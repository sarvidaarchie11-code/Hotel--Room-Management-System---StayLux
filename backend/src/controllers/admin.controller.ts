import { Request, Response } from 'express';
import { subDays } from 'date-fns';
import { prisma } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { badRequest, conflict } from '../utils/errors';
import { getDashboard, getReport } from '../services/dashboardService';
import { emitChange } from '../socket';
import { paging, parseDay, todayString } from '../utils/helpers';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { endOfMonth, startOfMonth } from 'date-fns';

const id = (req: Request) => {
  const n = Number(req.params.id);
  if (!Number.isInteger(n) || n <= 0) throw badRequest('Invalid id');
  return n;
};

export const dashboard = asyncHandler(async (_req, res) => res.json(await getDashboard()));

export const report = asyncHandler(async (req: Request, res: Response) => {
  const f = typeof req.query.from === 'string' ? req.query.from : undefined;
  const t = typeof req.query.to === 'string' ? req.query.to : undefined;
  const to = t ? new Date(`${t}T23:59:59.999Z`) : new Date();
  const from = f ? parseDay(f) : subDays(to, 30);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) throw badRequest('Invalid date range');
  res.json(await getReport(from, to));
});

// ---------- Users ----------
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const p = paging(req.query);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const where = { role: 'USER', ...(search ? { OR: [{ fullName: { contains: search } }, { email: { contains: search } }] } : {}) };
  const sort = req.query.sort;
  const orderBy = sort === 'name' ? { fullName: 'asc' as const } : sort === 'oldest' ? { createdAt: 'asc' as const } : { createdAt: 'desc' as const };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, orderBy, skip: p.skip, take: p.take,
      select: { id: true, fullName: true, email: true, phone: true, isActive: true, createdAt: true, avatarPath: true, _count: { select: { bookings: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ users, total, hasMore: p.paged ? p.page * p.pageSize < total : false });
});

/** Issues a one-time temporary password; the guest must change it at next login. */
export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const target = await prisma.user.findUniqueOrThrow({ where: { id: id(req) } });
  if (target.role === 'ADMIN') throw conflict('Administrator passwords cannot be reset here');
  const temp = `${randomBytes(5).toString('hex')}Aa1`;
  await prisma.user.update({ where: { id: target.id }, data: { passwordHash: await bcrypt.hash(temp, 12), mustChangePassword: true } });
  res.json({ temporaryPassword: temp });
});

/** Occupancy grid data: every room plus the bookings that touch the requested month. */
export const calendar = asyncHandler(async (req: Request, res: Response) => {
  const m = typeof req.query.month === 'string' && /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : todayString().slice(0, 7);
  const start = startOfMonth(parseDay(`${m}-01`));
  const end = endOfMonth(start);
  const [rooms, bookings] = await Promise.all([
    prisma.room.findMany({ orderBy: { roomNumber: 'asc' }, select: { id: true, roomNumber: true, name: true, status: true } }),
    prisma.booking.findMany({
      where: { status: { in: ['Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Completed'] }, checkIn: { lte: end }, checkOut: { gt: start } },
      select: { id: true, roomId: true, checkIn: true, checkOut: true, status: true, reference: true, user: { select: { fullName: true } } },
    }),
  ]);
  res.json({
    month: m,
    rooms,
    bookings: bookings.map((b) => ({ id: b.id, roomId: b.roomId, status: b.status, reference: b.reference, guest: b.user.fullName, checkIn: b.checkIn.toISOString().slice(0, 10), checkOut: b.checkOut.toISOString().slice(0, 10) })),
  });
});

export const setUserActive = asyncHandler(async (req: Request, res: Response) => {
  const target = await prisma.user.findUniqueOrThrow({ where: { id: id(req) } });
  if (target.role === 'ADMIN') throw conflict('Administrator accounts cannot be deactivated here');
  const user = await prisma.user.update({ where: { id: target.id }, data: { isActive: Boolean(req.body.isActive) } });
  emitChange('user', user.id);
  res.json({ user: { id: user.id, isActive: user.isActive } });
});

// ---------- Special offers ----------
const offerData = (b: Record<string, any>) => ({ ...b, validFrom: parseDay(b.validFrom), validUntil: parseDay(b.validUntil) });

export const listOffers = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === 'ADMIN';
  const today = parseDay(todayString());
  const offers = await prisma.specialOffer.findMany({
    where: isAdmin ? {} : { active: true, validFrom: { lte: today }, validUntil: { gte: today } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ offers });
});
export const createOffer = asyncHandler(async (req, res) => {
  const offer = await prisma.specialOffer.create({ data: offerData(req.body) });
  emitChange('offer', offer.id);
  res.status(201).json({ offer });
});
export const updateOffer = asyncHandler(async (req, res) => {
  const offer = await prisma.specialOffer.update({ where: { id: id(req) }, data: offerData(req.body) });
  emitChange('offer', offer.id);
  res.json({ offer });
});
export const deleteOffer = asyncHandler(async (req, res) => {
  await prisma.specialOffer.delete({ where: { id: id(req) } });
  emitChange('offer');
  res.json({ message: 'Offer deleted' });
});

// ---------- Hotel settings ----------
export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await prisma.hotelSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  res.json({ settings });
});
export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await prisma.hotelSettings.upsert({ where: { id: 1 }, update: req.body, create: { id: 1, ...req.body } });
  emitChange('settings');
  res.json({ settings });
});
