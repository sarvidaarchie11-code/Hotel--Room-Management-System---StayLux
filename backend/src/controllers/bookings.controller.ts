import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { badRequest, forbidden } from '../utils/errors';
import { bookingInclude } from '../repositories/bookingRepository';
import { paging } from '../utils/helpers';
import * as svc from '../services/bookingService';

const id = (req: Request) => {
  const n = Number(req.params.id);
  if (!Number.isInteger(n) || n <= 0) throw badRequest('Invalid id');
  return n;
};
const out = (b: Awaited<ReturnType<typeof svc.loadBooking>>) => ({ booking: svc.serializeBooking(b) });

export const create = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(out(await svc.createBooking(req.user!.id, req.body)));
});

export const mine = asyncHandler(async (req: Request, res: Response) => {
  const p = paging(req.query);
  const where = { userId: req.user!.id };
  const [rows, total] = await Promise.all([
    prisma.booking.findMany({ where, orderBy: { createdAt: 'desc' }, include: bookingInclude, skip: p.skip, take: p.take }),
    prisma.booking.count({ where }),
  ]);
  res.json({ bookings: rows.map(svc.serializeBooking), total, hasMore: p.paged ? p.page * p.pageSize < total : false });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const b = await svc.loadBooking(id(req));
  if (req.user!.role !== 'ADMIN' && b.userId !== req.user!.id) throw forbidden();
  res.json(out(b));
});

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const p = paging(req.query);
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'newest';
  const orderBy = sort === 'oldest' ? { createdAt: 'asc' as const } : sort === 'checkin' ? { checkIn: 'asc' as const } : sort === 'amount' ? { totalAmount: 'desc' as const } : { createdAt: 'desc' as const };
  const where = status ? { status } : {};
  const pay = typeof req.query.pay === 'string' ? req.query.pay : undefined;
  let rows: Prisma.BookingGetPayload<{ include: typeof bookingInclude }>[];
  let total: number;
  if (pay) {
    // the payment label is computed from verified payments, so filter after loading
    const all = (await prisma.booking.findMany({ where, orderBy, include: bookingInclude })).filter((b) => svc.serializeBooking(b).paymentStatus === pay);
    total = all.length;
    rows = p.paged ? all.slice(p.skip, (p.skip ?? 0) + (p.take ?? all.length)) : all;
  } else {
    [rows, total] = await Promise.all([
      prisma.booking.findMany({ where, orderBy, include: bookingInclude, skip: p.skip, take: p.take }),
      prisma.booking.count({ where }),
    ]);
  }
  const grouped = await prisma.booking.groupBy({ by: ['status'], _count: { _all: true } });
  const counts: Record<string, number> = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));
  counts.All = grouped.reduce((s, g) => s + g._count._all, 0);
  res.json({ bookings: rows.map(svc.serializeBooking), total, counts, hasMore: p.paged ? p.page * p.pageSize < total : false });
});

export const cancel = asyncHandler(async (req: Request, res: Response) => res.json(out(await svc.cancelBooking(id(req), req.user!))));
export const approve = asyncHandler(async (req: Request, res: Response) => res.json(out(await svc.approveBooking(id(req)))));
export const reject = asyncHandler(async (req: Request, res: Response) => res.json(out(await svc.rejectBooking(id(req), req.body.reason))));
export const checkIn = asyncHandler(async (req: Request, res: Response) => res.json(out(await svc.checkInBooking(id(req)))));
export const checkOut = asyncHandler(async (req: Request, res: Response) => res.json(out(await svc.checkOutBooking(id(req)))));
export const complete = asyncHandler(async (req: Request, res: Response) => res.json(out(await svc.completeBooking(id(req)))));
