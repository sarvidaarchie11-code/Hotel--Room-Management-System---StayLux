import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/db';
import { verifyToken } from '../utils/jwt';
import { asyncHandler } from '../utils/asyncHandler';
import { forbidden, unauthorized } from '../utils/errors';

export interface AuthUser {
  id: number;
  role: string;
  email: string;
  fullName: string;
  mustChangePassword: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

const ALLOWED_WHILE_PASSWORD_PENDING = ['/auth/me', '/auth/change-password'];

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw unauthorized();
  let payload;
  try {
    payload = verifyToken(header.slice(7));
  } catch {
    throw unauthorized('Session expired. Please log in again.');
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw unauthorized('Account not found or deactivated');
  req.user = { id: user.id, role: user.role, email: user.email, fullName: user.fullName, mustChangePassword: user.mustChangePassword };
  if (user.mustChangePassword) {
    const url = req.originalUrl.split('?')[0];
    if (!ALLOWED_WHILE_PASSWORD_PENDING.some((p) => url.endsWith(p))) {
      throw forbidden('You must change your password before continuing', 'PASSWORD_CHANGE_REQUIRED');
    }
  }
  next();
});

export const requireRole = (role: 'ADMIN' | 'USER') => (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== role) return next(forbidden());
  next();
};
