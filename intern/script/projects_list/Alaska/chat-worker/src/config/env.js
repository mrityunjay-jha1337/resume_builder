import dotenv from 'dotenv';
dotenv.config();

export const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/alaska-chat';
export const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
export const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'default_dev_secret';
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4002;
