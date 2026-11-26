import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload { sub: number; role: string }

export const signToken = (userId: number, role: string): string =>
  jwt.sign({ sub: userId, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] });

export const verifyToken = (token: string): TokenPayload => {
  const p = jwt.verify(token, env.jwtSecret) as unknown as TokenPayload;
  return { sub: Number(p.sub), role: p.role };
};
