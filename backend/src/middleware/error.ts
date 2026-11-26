import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/errors';

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, code: err.code, errors: err.errors });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large' : err.message;
    return res.status(400).json({ message });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'A record with that value already exists' });
    if (err.code === 'P2025') return res.status(404).json({ message: 'Record not found' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
};
