import { queueClient } from '../config/redis.js';
import { prisma } from '../config/db.js';
import { commandOptions } from 'redis';

import crypto from 'crypto';

export async function pollQueue() {
  const streamKey = 'chat_stream';
  const groupName = 'chat_workers';
  // process.pid is 1 for all Docker containers. We must use a UUID so each worker is unique
  // otherwise they share the same PEL and process the same messages multiple times.
  const consumerName = `worker_${crypto.randomUUID()}`;

  console.log(`Started Redis Stream consumer ${consumerName} for chat_stream...`);

  // Try to create the consumer group, ignore if it already exists
  try {
    await queueClient.xGroupCreate(streamKey, groupName, '0', { MKSTREAM: true });
  } catch (err) {
    if (!err.message.includes('BUSYGROUP')) {
      console.error("Failed to create consumer group:", err);
    }
  }

  while (true) {
    try {
      // 1. Read Pending Entries (PEL) first to recover stuck messages
      let response = await queueClient.xReadGroup(
        commandOptions({ isolated: true }),
        groupName,
        consumerName,
        [
          { key: streamKey, id: '0' }
        ],
        {
          COUNT: 5000
        }
      );

      // 2. If no pending messages, block and wait for new messages
      if (!response || response.length === 0 || response[0].messages.length === 0) {
        response = await queueClient.xReadGroup(
          commandOptions({ isolated: true }),
          groupName,
          consumerName,
          [
            { key: streamKey, id: '>' }
          ],
          {
            COUNT: 5000,
            BLOCK: 2000
          }
        );
      }

      if (response && response.length > 0) {
        const messagesToInsert = [];
        const ackIds = [];

        for (const stream of response) {
          for (const message of stream.messages) {
            const data = JSON.parse(message.message.payload);
            
            messagesToInsert.push({
              senderId: data.senderId,
              receiverId: data.receiverId,
              message: data.message,
              clientTimestamp: data.clientTimestamp ? BigInt(data.clientTimestamp) : null,
              createdAt: data.timestamp ? new Date(data.timestamp) : undefined
            });
            
            ackIds.push(message.id);
          }
        }

        if (messagesToInsert.length > 0) {
          // 1. Chunked Batch Insert to Database to prevent CPU exhaustion on huge arrays
          const chunkSize = 1000;
          for (let i = 0; i < messagesToInsert.length; i += chunkSize) {
            const chunk = messagesToInsert.slice(i, i + chunkSize);
            const ackChunk = ackIds.slice(i, i + chunkSize);

            await prisma.chatMessage.createMany({
              data: chunk,
              skipDuplicates: true // Optional: avoid failing the batch if duplicate clientTimestamp exists
            });

            // 2. Batch Acknowledge to Redis
            await queueClient.xAck(streamKey, groupName, ackChunk);
          }

          console.log(`Successfully processed and saved ${messagesToInsert.length} messages to DB.`);
        }
      }
    } catch (err) {
      console.error("Error processing stream:", err);
      if (err.message && err.message.includes('NOGROUP')) {
        console.log("Consumer group missing (NOGROUP). Attempting to recreate...");
        try {
          await queueClient.xGroupCreate(streamKey, groupName, '0', { MKSTREAM: true });
        } catch (e) {
          console.error("Failed to recreate consumer group in loop:", e);
        }
      }
      // Basic backoff on error
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
