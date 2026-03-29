// backend/src/routes/auth.routes.ts
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import { sendPasswordResetEmail } from '../services/email/passwordReset';
import { signTokenPair, setAuthCookies } from '../services/auth/token.service';
import { redis, KEYS } from '../utils/redis';
import {
  isAccountLocked,
  incrementLoginAttempts,
  clearLoginAttempts,
} from '../services/auth/loginAttempts.service';

const router = Router();

// ── POST /api/auth/register ───────────────────────────────────
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  const schema = z.object({
    email:    z.string().email(),
    password: z.string().min(8),
    name:     z.string().min(1).optional(),
    phone:    z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { email, password, name, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, phone },
    select: { id: true, email: true, name: true, role: true },
  });

  // Create empty cart for new user
  await prisma.cart.create({ data: { userId: user.id } });

  const { access, refresh } = signTokenPair({
    id: user.id,
    email: user.email,
    role: user.role,
    totpEnabled: false,
    mfaVerified: true,
  });
  setAuthCookies(res, access, refresh);

  res.status(201).json({ user, token: access });
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  const schema = z.object({
    email:    z.string().email(),
    password: z.string().min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { email, password } = parsed.data;

  // Check if account is locked due to failed attempts
  if (await isAccountLocked(email)) {
    return res.status(429).json({ 
      error: 'Too many failed login attempts. Please try again in 15 minutes.' 
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      name: true,
      role: true,
      totpEnabled: true,
      isActive: true,
    },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    // Increment failed login attempts
    await incrementLoginAttempts(email);
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Account is disabled' });
  }

  // Clear failed login attempts on successful login
  await clearLoginAttempts(email);

  let mfaVerified = !user.totpEnabled;
  if (user.totpEnabled && redis) {
    const ok = await redis.get(KEYS.adminMfa(user.id));
    mfaVerified = ok === '1';
  }

  const { access, refresh } = signTokenPair({
    id: user.id,
    email: user.email,
    role: user.role,
    totpEnabled: user.totpEnabled,
    mfaVerified,
  });
  setAuthCookies(res, access, refresh);

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token: access,
    mfaRequired: user.totpEnabled && !mfaVerified,
  });
});

// ── POST /api/auth/logout ─────────────────────────────────────
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ success: true });
});

router.post('/forgot-password', authLimiter, async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Valid email required' });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const raw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${base}/forgot-password?token=${raw}`;
    await sendPasswordResetEmail({
      email: user.email,
      resetLink: resetUrl,
      ipAddress: req.ip
    });
  }

  res.json({ ok: true, message: 'If an account exists, a reset link has been sent.' });
});

router.post('/reset-password', authLimiter, async (req: Request, res: Response) => {
  const schema = z.object({
    token: z.string().min(10),
    password: z.string().min(8),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const tokenHash = crypto.createHash('sha256').update(parsed.data.token).digest('hex');
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });
  await prisma.passwordResetToken.delete({ where: { id: record.id } });

  res.json({ ok: true });
});

// ── POST /api/auth/refresh ────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, isActive: true, totpEnabled: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or disabled' });
    }

    let mfaVerified = !user.totpEnabled;
    if (user.totpEnabled && redis) {
      const ok = await redis.get(KEYS.adminMfa(user.id));
      mfaVerified = ok === '1';
    }

    const { access, refresh } = signTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      totpEnabled: user.totpEnabled,
      mfaVerified,
    });
    setAuthCookies(res, access, refresh);
    res.json({ token: access });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, phone: true, role: true, addressJson: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// ── PATCH /api/auth/me ─────────────────────────────────────────
router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name:        z.string().min(1).optional(),
    phone:       z.string().optional(),
    addressJson: z.record(z.any()).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: parsed.data,
    select: { id: true, email: true, name: true, phone: true, role: true },
  });
  res.json({ user });
});

export default router;