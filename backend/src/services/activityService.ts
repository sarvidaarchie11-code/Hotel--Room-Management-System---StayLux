import { prisma } from '../config/db';
import { emitToUser } from '../socket';

export type ActivityKind = 'booking' | 'stay' | 'payment' | 'account' | 'review';

/** Appends an entry to the user's private activity history (never fails the main action). */
export async function logActivity(userId: number, kind: ActivityKind, title: string, detail?: string | null, refId?: number | null) {
  try {
    await prisma.activityLog.create({ data: { userId, kind, title, detail: detail ?? null, refId: refId ?? null } });
    emitToUser(userId, 'data:changed', { entity: 'activity' }); // only this user's app refreshes
  } catch (e) {
    console.error('activity log failed', e);
  }
}

export const kindFromNotification = (type: string): ActivityKind =>
  type.startsWith('PAYMENT') ? 'payment'
    : type.startsWith('BOOKING') ? 'booking'
    : type === 'CHECKED_IN' || type === 'CHECKED_OUT' || type === 'UPCOMING_CHECKIN' ? 'stay'
    : 'account';
