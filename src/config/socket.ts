import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

let io: SocketServer;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    // Allow anonymous connections for QR order tracking
    if (!token) {
      socket.data.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      socket.data.user = decoded;
      next();
    } catch (error) {
      // Allow anonymous connections
      socket.data.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`✓ Client connected: ${socket.id}`);

    // Join user-specific room if authenticated
    if (socket.data.user) {
      socket.join(`user:${socket.data.user.id}`);
      
      // Join role-specific room
      if (socket.data.user.role_id === 2 || socket.data.user.role_id === 3) {
        socket.join('admins');
      }
    }

    // Join QR order tracking room
    socket.on('track-order', (orderNumber: string) => {
      socket.join(`order:${orderNumber}`);
      console.log(`✓ Client tracking order: ${orderNumber}`);
    });

    // Leave QR order tracking room
    socket.on('untrack-order', (orderNumber: string) => {
      socket.leave(`order:${orderNumber}`);
    });

    socket.on('disconnect', () => {
      console.log(`✗ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Emit to specific user
export const emitToUser = (userId: number, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Emit to all admins
export const emitToAdmins = (event: string, data: any) => {
  if (io) {
    io.to('admins').emit(event, data);
  }
};

// Emit to order tracking room
export const emitToOrder = (orderNumber: string, event: string, data: any) => {
  if (io) {
    io.to(`order:${orderNumber}`).emit(event, data);
  }
};

// Broadcast to all clients
export const broadcast = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
  }
};
