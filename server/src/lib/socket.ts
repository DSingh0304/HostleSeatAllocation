import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from './logger';
import redis from './redis';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join_hostel', (hostelId: string) => {
      socket.join(`hostel:${hostelId}`);
      logger.info(`Socket ${socket.id} joined hostel room: ${hostelId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  // Subscribe to Redis updates
  const sub = redis.duplicate();
  sub.psubscribe('hostel_updates:*');

  sub.on('pmessage', (pattern, channel, message) => {
    const hostelId = channel.split(':')[1];
    const data = JSON.parse(message);
    io.to(`hostel:${hostelId}`).emit('room_update', data);
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
