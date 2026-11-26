import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// API root status
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'StayLux API is running',
    status: 'OK',
    port: env.port ?? 4000,
  });
});

// Room photos are real files on disk; their paths are stored in SQLite (RoomImage.path).
app.use('/uploads', express.static(env.uploadDir, { maxAge: '7d', fallthrough: true }));

// API routes
app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);
