import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { paging } from '../utils/helpers';

const GROUPS: Record<string, string[]> = { bookings: ['booking', 'stay'], payments: ['payment'], account: ['account', 'review'] };

/** The signed-in user's OWN history - the user id comes from the token, never from the request, so nobody can read another user's. */
export const myActivity = asyncHandler(async (req: Request, res: Response) => {
  const p = paging(req.query);
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const where = { userId: req.user!.id, ...(type && GROUPS[type] ? { kind: { in: GROUPS[type] } } : {}) };
  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: p.skip, take: p.take ?? 100 }),
    prisma.activityLog.count({ where }),
  ]);
  res.json({ items, total, hasMore: p.paged ? p.page * p.pageSize < total : false });
});
