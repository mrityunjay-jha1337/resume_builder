import { createClient } from 'redis';
import { REDIS_URL } from './env.js';

export const pubClient = createClient({ url: REDIS_URL });
export const queueClient = pubClient.duplicate();

export async function connectRedis() {
  try {
    await pubClient.connect();
    await queueClient.connect();
    console.log("Connected to Redis for Pub/Sub and Queueing");
  } catch (err) {
    console.error("Redis connection failed:", err);
    throw err;
  }
}
