import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { badRequest, forbidden } from '../utils/errors';
import { loadBooking } from '../services/bookingService';
import { createPayment, paymentInclude, reviewPayment } from '../services/paymentService';
import { deleteUploadedFile, filePath } from '../middleware/upload';
import { paging } from '../utils/helpers';

const id = (req: Request) => {
  const n = Number(req.params.id);
  if (!Number.isInteger(n) || n <= 0) throw badRequest('Invalid id');
  return n;
};

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const bookingId = id(req);
  const proofPath = req.file ? filePath(req.file) : undefined;
  try {
    if (req.user!.role !== 'ADMIN') {
      const b = await loadBooking(bookingId);
      if (b.userId !== req.user!.id) throw forbidden();
    }
    res.status(201).json({ payment: await createPayment(bookingId, { ...req.body, proofPath }, req.user!) });
  } catch (e) {
    if (proofPath) deleteUploadedFile(proofPath); // do not keep files from rejected payments
    throw e;
  }
});

export const mine = asyncHandler(async (req: Request, res: Response) => {
  const payments = await prisma.payment.findMany({ where: { booking: { userId: req.user!.id } }, orderBy: { createdAt: 'desc' }, include: paymentInclude });
  res.json({ payments });
});

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const p = paging(req.query);
  const where = status ? { status } : {};
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' }, include: paymentInclude, skip: p.skip, take: p.take }),
    prisma.payment.count({ where }),
  ]);
  const grouped = await prisma.payment.groupBy({ by: ['status'], _count: { _all: true } });
  const counts: Record<string, number> = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));
  counts.All = grouped.reduce((s, g) => s + g._count._all, 0);
  res.json({ payments, total, counts, hasMore: p.paged ? p.page * p.pageSize < total : false });
});

export const verify = asyncHandler(async (req: Request, res: Response) => res.json({ payment: await reviewPayment(id(req), 'Verified', req.user!.id) }));
export const rejectPayment = asyncHandler(async (req: Request, res: Response) => res.json({ payment: await reviewPayment(id(req), 'Rejected', req.user!.id) }));
