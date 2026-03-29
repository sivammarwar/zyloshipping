import { Request, Response, NextFunction } from 'express';
import { redis } from '../utils/redis';

const WINDOW_SEC = 60;
const MAX = 200;

export async function redisApiLimiter(req: Request, res: Response, next: NextFunction) {
  if (!redis) return next();
  try {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const key = `rate_limit:${ip}`;
    const n = await redis.incr(key);
    if (n === 1) {
      await redis.expire(key, WINDOW_SEC);
    }
    if (n > MAX) {
      return res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
    next();
  } catch {
    next();
  }
}
