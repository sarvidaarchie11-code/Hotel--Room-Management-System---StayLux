import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken } from './utils/jwt';
import { prisma } from './config/db';

let io: Server | null = null;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, { cors: { origin: '*' } });

  // Every socket must present a valid JWT; it joins a private room per user and per role.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('unauthorized'));
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive) return next(new Error('unauthorized'));
      socket.data.userId = user.id;
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
    socket.join(`role:${socket.data.role}`);
  });
  return io;
}

export const emitToUser = (userId: number, event: string, payload: unknown) => io?.to(`user:${userId}`).emit(event, payload);
export const emitToAdmins = (event: string, payload: unknown) => io?.to('role:ADMIN').emit(event, payload);

/** Tells every connected client that some data changed so screens can refetch. */
export type Entity = 'room' | 'booking' | 'payment' | 'user' | 'offer' | 'category' | 'settings';
export const emitChange = (entity: Entity, id?: number) => io?.emit('data:changed', { entity, id });
