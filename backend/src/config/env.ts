import 'dotenv/config';
import path from 'path';

function need(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required environment variable ${key}. Copy .env.example to .env first.`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: need('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads'),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 5),
};
