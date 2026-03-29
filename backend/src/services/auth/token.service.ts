import jwt from 'jsonwebtoken';
import { Response } from 'express';
import type { JwtAccessPayload } from '../../types/jwt';

export function buildAccessPayload(user: {
  id: string;
  email: string;
  role: string;
  totpEnabled: boolean;
  mfaVerified: boolean;
}): JwtAccessPayload {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    totpEnabled: user.totpEnabled,
    mfaVerified: user.mfaVerified,
  };
}

export function signAccessToken(payload: JwtAccessPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
}

export function signTokenPair(user: {
  id: string;
  email: string;
  role: string;
  totpEnabled: boolean;
  mfaVerified: boolean;
}): { access: string; refresh: string } {
  const payload = buildAccessPayload(user);
  return {
    access: signAccessToken(payload),
    refresh: signRefreshToken(user.id),
  };
}

/** After login / refresh: MFA required users are unverified until TOTP step + verify-mfa (or Redis session). */
export function mfaFlagsFromUser(totpEnabled: boolean, sessionVerified: boolean): boolean {
  if (!totpEnabled) return true;
  return sessionVerified;
}

export function setAuthCookies(res: Response, access: string, refresh: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', access, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refresh, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600 * 1000,
    path: '/',
  });
}
