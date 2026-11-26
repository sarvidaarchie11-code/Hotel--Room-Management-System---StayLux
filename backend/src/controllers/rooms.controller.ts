import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { badRequest, conflict, notFound } from '../utils/errors';
import { roomInclude, serializeRoom } from '../services/roomService';
import { BLOCKING_STATUSES, findOverlap, futureBlockedRanges } from '../repositories/bookingRepository';
import { deleteUploadedFile, toPublicPath } from '../middleware/upload';
import { emitChange } from '../socket';
import { nightsBetween, paging, parseDay, toNum, todayString } from '../utils/helpers';
import { computePrice } from '../services/pricingService';

const idParam = (req: Request, name = 'id'): number => {
  const n = Number(req.params[name]);
  if (!Number.isInteger(n) || n <= 0) throw badRequest('Invalid id');
  return n;
};
const q = (req: Request, k: string): string | undefined => (typeof req.query[k] === 'string' ? (req.query[k] as string) : undefined);

export const listRooms = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === 'ADMIN';
  const where: Prisma.RoomWhereInput = {};
  if (!isAdmin) where.status = { notIn: ['Maintenance', 'Unavailable'] };
  else if (q(req, 'status')) where.status = q(req, 'status');
  const search = q(req, 'search')?.trim();
  if (search) where.OR = [{ name: { contains: search } }, { roomNumber: { contains: search } }, { description: { contains: search } }, { category: { name: { contains: search } } }];
  const categoryId = toNum(q(req, 'categoryId'));
  if (categoryId) where.categoryId = categoryId;
  const minPrice = toNum(q(req, 'minPrice')), maxPrice = toNum(q(req, 'maxPrice'));
  if (minPrice !== undefined || maxPrice !== undefined) where.pricePerNight = { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) };
  const guests = toNum(q(req, 'guests'));
  if (guests) where.maxGuests = { gte: guests };
  if (q(req, 'featured') === 'true') where.featured = true;
  const ci = q(req, 'checkIn'), co = q(req, 'checkOut');
  if (ci && co) {
    where.bookings = { none: { status: { in: BLOCKING_STATUSES }, checkIn: { lt: parseDay(co) }, checkOut: { gt: parseDay(ci) } } };
  }
  const sort = q(req, 'sort');
  const orderBy: Prisma.RoomOrderByWithRelationInput =
    sort === 'price_asc' ? { pricePerNight: 'asc' } : sort === 'price_desc' ? { pricePerNight: 'desc' } : sort === 'number' ? { roomNumber: 'asc' } : { createdAt: 'desc' };
  const p = paging(req.query);
  const [rooms, total] = await Promise.all([
    prisma.room.findMany({ where, orderBy, include: roomInclude, skip: p.skip, take: p.take }),
    prisma.room.count({ where }),
  ]);
  res.json({ rooms: rooms.map(serializeRoom), total, hasMore: p.paged ? p.page * p.pageSize < total : false });
});

export const getRoom = asyncHandler(async (req: Request, res: Response) => {
  const room = await prisma.room.findUnique({ where: { id: idParam(req) }, include: roomInclude });
  if (!room || (req.user!.role !== 'ADMIN' && ['Maintenance', 'Unavailable'].includes(room.status))) throw notFound('Room not found');
  res.json({ room: serializeRoom(room), bookedRanges: await futureBlockedRanges(room.id) });
});

export const checkAvailability = asyncHandler(async (req: Request, res: Response) => {
  const id = idParam(req);
  const ci = q(req, 'checkIn'), co = q(req, 'checkOut');
  if (!ci || !co || !/^\d{4}-\d{2}-\d{2}$/.test(ci) || !/^\d{4}-\d{2}-\d{2}$/.test(co)) throw badRequest('checkIn and checkOut (yyyy-MM-dd) are required');
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw notFound('Room not found');
  const nights = nightsBetween(parseDay(ci), parseDay(co));
  if (nights < 1) throw badRequest('Check-out must be after check-in');
  if (ci < todayString()) throw badRequest('Check-in date cannot be in the past');
  const blocked = ['Maintenance', 'Unavailable'].includes(room.status) || !!(await findOverlap(id, parseDay(ci), parseDay(co)));
  const price = await computePrice(room.pricePerNight, nights, parseDay(ci));
  res.json({ available: !blocked, nights, pricePerNight: room.pricePerNight, ...price });
});

export const createRoom = asyncHandler(async (req: Request, res: Response) => {
  const { amenityIds, ...data } = req.body;
  const room = await prisma.room.create({
    data: { ...data, amenities: { create: (amenityIds as number[]).map((amenityId) => ({ amenityId })) } },
    include: roomInclude,
  });
  emitChange('room', room.id);
  res.status(201).json({ room: serializeRoom(room) });
});

export const updateRoom = asyncHandler(async (req: Request, res: Response) => {
  const id = idParam(req);
  const { amenityIds, ...data } = req.body;
  const room = await prisma.$transaction(async (tx) => {
    await tx.roomAmenity.deleteMany({ where: { roomId: id } });
    return tx.room.update({
      where: { id },
      data: { ...data, amenities: { create: (amenityIds as number[]).map((amenityId) => ({ amenityId })) } },
      include: roomInclude,
    });
  });
  emitChange('room', id);
  res.json({ room: serializeRoom(room) });
});

export const setRoomStatus = asyncHandler(async (req: Request, res: Response) => {
  const room = await prisma.room.update({ where: { id: idParam(req) }, data: { status: req.body.status }, include: roomInclude });
  emitChange('room', room.id);
  res.json({ room: serializeRoom(room) });
});

export const deleteRoom = asyncHandler(async (req: Request, res: Response) => {
  const id = idParam(req);
  if (await prisma.booking.count({ where: { roomId: id } })) {
    throw conflict('This room has booking history and cannot be deleted. Set its status to Unavailable instead.');
  }
  const images = await prisma.roomImage.findMany({ where: { roomId: id } });
  await prisma.room.delete({ where: { id } });
  images.forEach((i) => deleteUploadedFile(i.path));
  emitChange('room', id);
  res.json({ message: 'Room deleted' });
});

// ---------- Room images ----------
const MAX_IMAGES = 12;

export const uploadImages = asyncHandler(async (req: Request, res: Response) => {
  const roomId = idParam(req);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const cleanup = () => files.forEach((f) => deleteUploadedFile(toPublicPath(f.filename)));
  try {
    if (!files.length) throw badRequest('Select at least one image');
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { images: true } });
    if (!room) throw notFound('Room not found');
    if (room.images.length + files.length > MAX_IMAGES) throw badRequest(`A room can have at most ${MAX_IMAGES} photos`);
    const base = room.images.reduce((m, i) => Math.max(m, i.sortOrder), -1) + 1;
    const primaryIndex = toNum(req.body?.primaryIndex);
    const wantPrimary = primaryIndex !== undefined && primaryIndex >= 0 && primaryIndex < files.length;
    await prisma.$transaction(async (tx) => {
      const needsPrimary = wantPrimary || !room.images.some((i) => i.isPrimary);
      if (wantPrimary) await tx.roomImage.updateMany({ where: { roomId }, data: { isPrimary: false } });
      for (let i = 0; i < files.length; i++) {
        await tx.roomImage.create({
          data: { roomId, path: toPublicPath(files[i].filename), sortOrder: base + i, isPrimary: needsPrimary && i === (wantPrimary ? primaryIndex : 0) },
        });
      }
    });
  } catch (e) {
    cleanup();
    throw e;
  }
  const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId }, include: roomInclude });
  emitChange('room', roomId);
  res.status(201).json({ room: serializeRoom(room) });
});

export const setPrimaryImage = asyncHandler(async (req: Request, res: Response) => {
  const roomId = idParam(req), imageId = idParam(req, 'imageId');
  const img = await prisma.roomImage.findFirst({ where: { id: imageId, roomId } });
  if (!img) throw notFound('Image not found');
  await prisma.$transaction([
    prisma.roomImage.updateMany({ where: { roomId }, data: { isPrimary: false } }),
    prisma.roomImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ]);
  const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId }, include: roomInclude });
  emitChange('room', roomId);
  res.json({ room: serializeRoom(room) });
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const roomId = idParam(req), imageId = idParam(req, 'imageId');
  const img = await prisma.roomImage.findFirst({ where: { id: imageId, roomId } });
  if (!img) throw notFound('Image not found');
  await prisma.roomImage.delete({ where: { id: imageId } });
  deleteUploadedFile(img.path);
  if (img.isPrimary) {
    const next = await prisma.roomImage.findFirst({ where: { roomId }, orderBy: { sortOrder: 'asc' } });
    if (next) await prisma.roomImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
  const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId }, include: roomInclude });
  emitChange('room', roomId);
  res.json({ room: serializeRoom(room) });
});

export const replaceImage = asyncHandler(async (req: Request, res: Response) => {
  const roomId = idParam(req), imageId = idParam(req, 'imageId');
  const file = req.file;
  if (!file) throw badRequest('Select an image');
  const img = await prisma.roomImage.findFirst({ where: { id: imageId, roomId } });
  if (!img) { deleteUploadedFile(toPublicPath(file.filename)); throw notFound('Image not found'); }
  await prisma.roomImage.update({ where: { id: imageId }, data: { path: toPublicPath(file.filename) } });
  deleteUploadedFile(img.path);
  const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId }, include: roomInclude });
  emitChange('room', roomId);
  res.json({ room: serializeRoom(room) });
});

// ---------- Categories & amenities ----------
export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await prisma.roomCategory.findMany({ orderBy: { id: 'asc' }, include: { _count: { select: { rooms: true } } } });
  res.json({ categories });
});
export const createCategory = asyncHandler(async (req, res) => {
  const category = await prisma.roomCategory.create({ data: req.body });
  emitChange('category', category.id);
  res.status(201).json({ category });
});
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await prisma.roomCategory.update({ where: { id: idParam(req) }, data: req.body });
  emitChange('category', category.id);
  res.json({ category });
});
export const deleteCategory = asyncHandler(async (req, res) => {
  const id = idParam(req);
  if (await prisma.room.count({ where: { categoryId: id } })) throw conflict('Move or delete the rooms in this category first');
  await prisma.roomCategory.delete({ where: { id } });
  emitChange('category', id);
  res.json({ message: 'Category deleted' });
});
export const listAmenities = asyncHandler(async (_req, res) => {
  res.json({ amenities: await prisma.amenity.findMany({ orderBy: { name: 'asc' } }) });
});
export const createAmenity = asyncHandler(async (req, res) => {
  res.status(201).json({ amenity: await prisma.amenity.create({ data: req.body }) });
});
export const deleteAmenity = asyncHandler(async (req, res) => {
  await prisma.amenity.delete({ where: { id: idParam(req) } });
  res.json({ message: 'Amenity deleted' });
});

/** Suggests the next free room number (highest numeric room number + 1, or 101). */
export const nextRoomNumber = asyncHandler(async (_req, res) => {
  const all = await prisma.room.findMany({ select: { roomNumber: true } });
  const nums = all.map((r) => Number(r.roomNumber)).filter((n) => Number.isInteger(n) && n > 0);
  res.json({ next: String(nums.length ? Math.max(...nums) + 1 : 101) });
});
