// backend/src/middleware/rateLimiter.middleware.ts
import rateLimit from 'express-rate-limit';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Strict limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts, please try again in 15 minutes.' },
});

// Payment endpoints
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many payment requests.' },
});

// Admin login — stricter
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin login attempts. Try again in 15 minutes.' },
});

// Webhook endpoints — more permissive (suppliers call these)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: { error: 'Rate limit exceeded.' },
});