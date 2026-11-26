import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';

/** Statuses that actually occupy a room on a date range. */
export const BLOCKING_STATUSES = ['Confirmed', 'CheckedIn'];

type Db = Prisma.TransactionClient | typeof prisma;

/** Booking that overlaps [checkIn, checkOut). Check-out day is free for the next guest. */
export const findOverlap = (roomId: number, checkIn: Date, checkOut: Date, excludeBookingId?: number, db: Db = prisma) =>
  db.booking.findFirst({
    where: {
      roomId,
      status: { in: BLOCKING_STATUSES },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
  });

export const futureBlockedRanges = async (roomId: number) => {
  const rows = await prisma.booking.findMany({
    where: { roomId, status: { in: BLOCKING_STATUSES }, checkOut: { gt: new Date() } },
    select: { checkIn: true, checkOut: true },
    orderBy: { checkIn: 'asc' },
  });
  return rows.map((r) => ({ checkIn: r.checkIn.toISOString().slice(0, 10), checkOut: r.checkOut.toISOString().slice(0, 10) }));
};

export const bookingInclude = {
  room: { include: { images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }] }, category: true } },
  user: { select: { id: true, fullName: true, email: true, phone: true } },
  payments: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.BookingInclude;
