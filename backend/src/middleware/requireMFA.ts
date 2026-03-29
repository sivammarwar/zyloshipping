import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { redis, KEYS, TTL } from '../utils/redis';

export async function requireMFA(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const totpEnabled = req.user.totpEnabled === true;
  if (!totpEnabled) {
    return next();
  }

  if (req.user.mfaVerified === true) {
    return next();
  }

  if (redis) {
    const ok = await redis.get(KEYS.adminMfa(req.user.id));
    if (ok === '1') {
      return next();
    }
  }

  return res.status(403).json({
    error: 'MFA verification required',
    code: 'MFA_REQUIRED',
  });
}

export async function setAdminMfaSession(userId: string): Promise<void> {
  if (redis) {
    await redis.set(KEYS.adminMfa(userId), '1', { ex: TTL.ADMIN_MFA });
  }
}

export async function clearAdminMfaSession(userId: string): Promise<void> {
  if (redis) {
    await redis.del(KEYS.adminMfa(userId));
  }
}
