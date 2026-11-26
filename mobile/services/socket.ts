import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from '@/constants/config';
import { AppNotification } from '@/types';

export interface ChangeEvent { entity: string; id?: number }

let socket: Socket | null = null;
const changeHandlers = new Set<(e: ChangeEvent) => void>();
const notificationHandlers = new Set<(n: AppNotification) => void>();

export function connectSocket(token: string) {
  disconnectSocket();
  socket = io(SERVER_URL, { auth: { token }, transports: ['websocket'], reconnection: true });
  socket.on('data:changed', (e: ChangeEvent) => changeHandlers.forEach((h) => h(e)));
  socket.on('notification', (n: AppNotification) => notificationHandlers.forEach((h) => h(n)));
}

export function disconnectSocket() {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}

export const onChange = (h: (e: ChangeEvent) => void) => { changeHandlers.add(h); return () => { changeHandlers.delete(h); }; };
export const onNotification = (h: (n: AppNotification) => void) => { notificationHandlers.add(h); return () => { notificationHandlers.delete(h); }; };
