import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { HttpError } from '../utils/errors';

export const validate = (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return next(zodToHttp(result.error));
  req.body = result.data;
  next();
};

export function zodToHttp(err: ZodError): HttpError {
  const errors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || 'form';
    if (!errors[key]) errors[key] = issue.message;
  }
  const first = Object.values(errors)[0] ?? 'Invalid input';
  return new HttpError(400, first, 'VALIDATION_ERROR', errors);
}
