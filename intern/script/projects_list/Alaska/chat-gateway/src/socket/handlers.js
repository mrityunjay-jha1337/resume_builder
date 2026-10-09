import { pubClient, streamClient } from '../redis.js';


let messageBatch = [];
let batchTimer = null;
const BATCH_SIZE_LIMIT = 5000;
const BATCH_TIME_LIMIT_MS = 50;

async function flushBatch(io) {
  if (messageBatch.length === 0) return;
  const currentBatch = messageBatch;
  messageBatch = [];
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  try {
    const multi = streamClient.multi();
    for (const item of currentBatch) {
      multi.xAdd('chat_stream', '*', { payload: JSON.stringify(item.streamPayload) });
    }
    
    // Execute all xAdd commands in a single round trip to Redis
    await multi.exec();

    // Only AFTER successful Redis write do we ACK and broadcast
    let emitCount = 0;
    for (const item of currentBatch) {
      io.to(String(item.receiverId)).emit("receive_message", item.payload);
      io.to(String(item.senderId)).emit("message_sent", item.payload);
      item.socket.emit("message_sent_ack", { 
        senderId: item.senderId, 
        receiverId: item.receiverId, 
        message: item.message,
        clientTimestamp: item.clientTimestamp,
        status: "queued" 
      });
      
      emitCount++;
      if (emitCount % 100 === 0) {
        await new Promise(r => setImmediate(r));
      }
    }
  } catch (err) {
    console.error("Batch insert failed:", err);
    for (const item of currentBatch) {
      item.socket.emit("error", { message: "Failed to queue message" });
    }
  }
}

export const handleGetOnlineUsers = (pubClient) => async (callback) => {
  try {
    const users = await pubClient.sMembers('online_users');
    if (typeof callback === 'function') callback(users);
  } catch (err) {
    if (typeof callback === 'function') callback([]);
  }
};

export const handleSendMessage = (io, socket) => (data) => {
  try {
    const { senderId, receiverId, message, clientTimestamp } = data;
    if (!senderId || !receiverId || !message) return;

    const createdAt = new Date().toISOString();

    const streamPayload = {
      senderId,
      receiverId,
      message,
      clientTimestamp,
      timestamp: createdAt
    };
    
    const payload = {
      id: `temp-pub-${clientTimestamp}`,
      senderId,
      receiverId,
      message,
      clientTimestamp,
      createdAt
    };

    messageBatch.push({
      socket,
      streamPayload,
      payload,
      senderId,
      receiverId,
      message,
      clientTimestamp
    });

    if (messageBatch.length >= BATCH_SIZE_LIMIT) {
      flushBatch(io);
    } else if (!batchTimer) {
      batchTimer = setTimeout(() => flushBatch(io), BATCH_TIME_LIMIT_MS);
    }
  } catch (err) {
    console.error("Error queuing message to batch:", err.message);
    socket.emit("error", { message: "Failed to queue message locally" });
  }
};

export const handleDisconnect = (io, socket) => async () => {
  console.log('User disconnected from Gateway:', socket.id);
  if (socket.userId) {
    try {
      await pubClient.sRem('online_users', socket.userId);
      io.emit('user_status', { userId: socket.userId, status: 'offline' });
    } catch (err) {
      console.error("Error setting offline status:", err);
    }
  }
};
