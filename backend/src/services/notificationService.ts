import { prisma } from '../config/db';
import { emitToUser } from '../socket';
import { kindFromNotification, logActivity } from './activityService';

export type NotifType =
  | 'USER_REGISTERED' | 'BOOKING_REQUEST' | 'BOOKING_CANCELLED' | 'PAYMENT_SUBMITTED'
  | 'BOOKING_SUBMITTED' | 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'PAYMENT_VERIFIED'
  | 'PAYMENT_REJECTED' | 'UPCOMING_CHECKIN' | 'BOOKING_CANCELLED_USER' | 'CHECKED_IN' | 'CHECKED_OUT' | 'PASSWORD_RESET_REQUEST' | 'REVIEW_POSTED';

export async function notifyUser(userId: number, type: NotifType, title: string, body: string, data?: Record<string, unknown>, logHistory = true) {
  const row = await prisma.notification.create({
    data: { userId, type, title, body, data: data ? JSON.stringify(data) : null },
  });
  emitToUser(userId, 'notification', row); // real-time push to the connected app
  const refId = typeof data?.bookingId === 'number' ? data.bookingId : null;
  if (logHistory) await logActivity(userId, kindFromNotification(type), title, body, refId); // guests: every event also lands in their private history
  return row;
}

export async function notifyAdmins(type: NotifType, title: string, body: string, data?: Record<string, unknown>) {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
  // admins have no guest history, so skip logging it
  await Promise.all(admins.map((a) => notifyUser(a.id, type, title, body, data, false)));
}
