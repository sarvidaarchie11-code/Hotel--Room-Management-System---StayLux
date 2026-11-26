import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomBytes } from 'crypto';
import { env } from '../config/env';
import { HttpError } from '../utils/errors';

const FOLDERS: Record<string, string> = { images: 'rooms', image: 'rooms', proof: 'proofs', avatar: 'avatars' };
const folderFor = (field: string) => FOLDERS[field] ?? 'rooms';
Object.values(FOLDERS).forEach((f) => fs.mkdirSync(path.join(env.uploadDir, f), { recursive: true }));

const EXT: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: (_req, file, cb) => cb(null, path.join(env.uploadDir, folderFor(file.fieldname))),
  // extension comes from the validated MIME type, never from the client's filename
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${EXT[file.mimetype]}`),
});

export const imageUpload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!EXT[file.mimetype]) return cb(new HttpError(400, 'Only JPG, PNG or WEBP images are allowed'));
    cb(null, true);
  },
});

/** Public URL path (stored in SQLite) for a file multer just saved. */
export const filePath = (file: Express.Multer.File): string => `/uploads/${folderFor(file.fieldname)}/${file.filename}`;
export const toPublicPath = (filename: string): string => `/uploads/rooms/${filename}`; // room photos

export const deleteUploadedFile = (publicPath: string): void => {
  const file = path.join(env.uploadDir, publicPath.replace(/^\/uploads\//, ''));
  if (file.startsWith(env.uploadDir)) fs.promises.unlink(file).catch(() => undefined);
};
