import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { badRequest, conflict, forbidden, notFound } from '../utils/errors';
import { roomInclude, serializeRoom } from '../services/roomService';
import { notifyAdmins } from '../services/notificationService';
import { emitChange } from '../socket';
import { logActivity } from '../services/activityService';

const num = (req: Request, name: string) => {
  const n = Number(req.params[name]);
  if (!Number.isInteger(n) || n <= 0) throw badRequest('Invalid id');
  return n;
};

// ---------- Reviews ----------
export const listReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await prisma.review.findMany({
    where: { roomId: num(req, 'id') },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { fullName: true, avatarPath: true } } },
  });
  res.json({ reviews });
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const booking = await prisma.booking.findUnique({ where: { id: num(req, 'id') }, include: { room: true, user: true } });
  if (!booking) throw notFound('Booking not found');
  if (booking.userId !== req.user!.id) throw forbidden();
  if (!['CheckedOut', 'Completed'].includes(booking.status)) throw conflict('You can rate a stay after check-out');
  if (await prisma.review.findUnique({ where: { bookingId: booking.id } })) throw conflict('You already rated this stay');
  const review = await prisma.review.create({
    data: { bookingId: booking.id, roomId: booking.roomId, userId: booking.userId, rating: req.body.rating, comment: req.body.comment || null },
  });
  await notifyAdmins('REVIEW_POSTED', 'New guest review', `${booking.user.fullName} rated ${booking.room.name} ${review.rating}/5.`, { bookingId: booking.id });
  await logActivity(booking.userId, 'review', `You rated ${booking.room.name}`, `${review.rating} out of 5${review.comment ? ` - "${review.comment}"` : ''}`, booking.id);
  emitChange('room', booking.roomId);
  emitChange('booking', booking.id);
  res.status(201).json({ review });
});

export const myReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await prisma.review.findFirst({ where: { bookingId: num(req, 'id'), userId: req.user!.id } });
  res.json({ review });
});

// ---------- Favorites ----------
export const listFavorites = asyncHandler(async (req: Request, res: Response) => {
  const rows = await prisma.favorite.findMany({
    where: { userId: req.user!.id, room: { status: { notIn: ['Maintenance', 'Unavailable'] } } },
    orderBy: { createdAt: 'desc' },
    include: { room: { include: roomInclude } },
  });
  res.json({ rooms: rows.map((f) => serializeRoom(f.room)), ids: rows.map((f) => f.roomId) });
});

export const toggleFavorite = asyncHandler(async (req: Request, res: Response) => {
  const roomId = num(req, 'roomId');
  const key = { userId_roomId: { userId: req.user!.id, roomId } };
  const existing = await prisma.favorite.findUnique({ where: key });
  if (existing) await prisma.favorite.delete({ where: key });
  else {
    if (!(await prisma.room.findUnique({ where: { id: roomId } }))) throw notFound('Room not found');
    await prisma.favorite.create({ data: { userId: req.user!.id, roomId } });
  }
  res.json({ favorite: !existing });
});
