import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { conflict, forbidden, unauthorized } from '../utils/errors';
import { signToken } from '../utils/jwt';
import { notifyAdmins } from '../services/notificationService';
import { emitChange } from '../socket';
import { logActivity } from '../services/activityService';
import { badRequest } from '../utils/errors';
import { deleteUploadedFile, filePath } from '../middleware/upload';

const publicUser = (u: { id: number; fullName: string; email: string; phone: string; role: string; mustChangePassword: boolean; createdAt: Date; avatarPath: string | null }) => ({
  id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, role: u.role, avatarPath: u.avatarPath,
  mustChangePassword: u.mustChangePassword, createdAt: u.createdAt,
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, phone, password } = req.body;
  if (await prisma.user.findUnique({ where: { email } })) throw conflict('An account with this email already exists');
  // role is ALWAYS USER here - there is no public way to create an admin
  const user = await prisma.user.create({
    data: { fullName, email, phone, passwordHash: await bcrypt.hash(password, 12), role: 'USER' },
  });
  await notifyAdmins('USER_REGISTERED', 'New guest registered', `${user.fullName} (${user.email}) created an account.`, { userId: user.id });
  emitChange('user', user.id);
  await logActivity(user.id, 'account', 'Account created', 'Welcome to StayLux');
  res.status(201).json({ token: signToken(user.id, user.role), user: publicUser(user) });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw unauthorized('Invalid email or password');
  if (!user.isActive) throw forbidden('This account has been deactivated. Please contact the hotel.');
  await logActivity(user.id, 'account', 'Signed in');
  res.json({ token: signToken(user.id, user.role), user: publicUser(user) });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  res.json({ user: publicUser(user) });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.update({ where: { id: req.user!.id }, data: { fullName: req.body.fullName, phone: req.body.phone } });
  emitChange('user', user.id);
  await logActivity(user.id, 'account', 'Profile updated', 'Name or phone number changed');
  res.json({ user: publicUser(user) });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) {
    throw unauthorized('Current password is incorrect');
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(req.body.newPassword, 12), mustChangePassword: false },
  });
  await logActivity(user.id, 'account', 'Password changed');
  res.json({ message: 'Password updated', user: publicUser(updated) });
});

export const savePushToken = asyncHandler(async (req: Request, res: Response) => {
  await prisma.user.update({ where: { id: req.user!.id }, data: { pushToken: req.body.token } });
  res.json({ ok: true });
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw badRequest('Choose a picture');
  const current = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  const user = await prisma.user.update({ where: { id: current.id }, data: { avatarPath: filePath(req.file) } });
  if (current.avatarPath) deleteUploadedFile(current.avatarPath);
  emitChange('user', user.id);
  await logActivity(user.id, 'account', 'Profile photo updated');
  res.json({ user: publicUser(user) });
});

/**
 * No email service is configured, so "forgot password" alerts the administrators,
 * who verify the guest and issue a temporary password. The response never reveals whether the email exists.
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (user && user.role === 'USER' && user.isActive) {
    await notifyAdmins('PASSWORD_RESET_REQUEST', 'Password reset requested', `${user.fullName} (${user.email}) asked for a password reset. Open Users to issue a temporary password.`, { userId: user.id });
  }
  res.json({ message: 'If that email is registered, the hotel has been notified and will contact you with a temporary password.' });
});
