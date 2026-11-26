import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';

export const roomInclude = {
  category: true,
  images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }] },
  amenities: { include: { amenity: true } },
  reviews: { select: { rating: true } },
} satisfies Prisma.RoomInclude;

type RoomWithRelations = Prisma.RoomGetPayload<{ include: typeof roomInclude }>;

export const serializeRoom = (r: RoomWithRelations) => {
  const { amenities, images, reviews, ...rest } = r;
  const reviewCount = reviews.length;
  return {
    ...rest,
    reviewCount,
    avgRating: reviewCount ? Math.round((reviews.reduce((s, x) => s + x.rating, 0) / reviewCount) * 10) / 10 : null,
    images,
    primaryImage: images[0]?.path ?? null,
    amenities: amenities.map((a) => a.amenity),
  };
};

/**
 * Room status follows reservation / stay operations, but never overrides a manual
 * Maintenance or Unavailable status.
 */
export async function recomputeRoomStatus(roomId: number, db: Prisma.TransactionClient | typeof prisma = prisma) {
  const room = await db.room.findUnique({ where: { id: roomId } });
  if (!room || room.status === 'Maintenance' || room.status === 'Unavailable') return;
  const occupied = await db.booking.findFirst({ where: { roomId, status: 'CheckedIn' } });
  const reserved = occupied
    ? null
    : await db.booking.findFirst({ where: { roomId, status: 'Confirmed', checkOut: { gt: new Date() } } });
  const status = occupied ? 'Occupied' : reserved ? 'Reserved' : 'Available';
  if (status !== room.status) await db.room.update({ where: { id: roomId }, data: { status } });
}
