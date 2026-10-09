import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { pubClient, subClient } from '../redis.js';
import {
  handleGetOnlineUsers,
  handleSendMessage,
  handleDisconnect
} from './handlers.js';

export const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    adapter: createAdapter(pubClient, subClient)
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: No token provided'));
    
    jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key_123', (err, decoded) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      socket.userId = String(decoded.userId || decoded.id);
      next();
    });
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.userId} connected to Gateway on socket ${socket.id}`);
    
    // Auto join room based on authenticated userId
    socket.join(socket.userId);
    console.log(`User ${socket.userId} joined their room`);
    
    try {
      await pubClient.sAdd('online_users', socket.userId);
      io.emit('user_status', { userId: socket.userId, status: 'online' });
    } catch (err) {
      console.error("Error setting online status:", err);
    }
    socket.on('get_online_users', handleGetOnlineUsers(pubClient));
    socket.on('send_message', handleSendMessage(io, socket));
    socket.on('disconnect', handleDisconnect(io, socket));
  });

  return io;
};
