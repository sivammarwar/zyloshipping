import { Request, Response, NextFunction } from 'express';
import { cache } from '../lib/cache';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  general: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 per 15 min
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 per 15 min
  payment: { windowMs: 60 * 60 * 1000, maxRequests: 20 }, // 20 per hour
  admin: { windowMs: 15 * 60 * 1000, maxRequests: 200 }, // 200 per 15 min
};

/**
 * Get client identifier (IP address or user ID)
 */
function getClientId(req: Request): string {
  // Prefer user ID if authenticated
  const userId = (req as any).user?.id;
  if (userId) return `user:${userId}`;

  // Fall back to IP address
  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0] ||
    req.headers['x-real-ip']?.toString() ||
    req.socket.remoteAddress ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Rate limiting middleware factory
 */
export function rateLimit(type: keyof typeof RATE_LIMITS = 'general') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const config = RATE_LIMITS[type];
    const clientId = getClientId(req);
    const key = `ratelimit:${type}:${clientId}`;

    try {
      // Get current count
      const current = await cache.incr(key, Math.floor(config.windowMs / 1000));

      // Set headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - current));
      res.setHeader('X-RateLimit-Reset', Date.now() + config.windowMs);

      // Check if limit exceeded
      if (current > config.maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again later.`,
          retryAfter: Math.ceil(config.windowMs / 1000),
        });
      }

      next();
    } catch (error) {
      // If Redis is down, allow the request (fail open)
      console.error('[rateLimit] Error checking rate limit:', error);
      next();
    }
  };
}

/**
 * Specific rate limiters for different route types
 */
export const rateLimitGeneral = rateLimit('general');
export const rateLimitAuth = rateLimit('auth');
export const rateLimitPayment = rateLimit('payment');
export const rateLimitAdmin = rateLimit('admin');
