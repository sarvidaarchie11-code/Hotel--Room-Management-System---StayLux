import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { badRequest } from '../utils/errors';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  res.json({ notifications, unread });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw badRequest('Invalid id');
  await prisma.notification.updateMany({ where: { id, userId: req.user!.id }, data: { read: true } });
  res.json({ ok: true });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.id, read: false }, data: { read: true } });
  res.json({ ok: true });
});
