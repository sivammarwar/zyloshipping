import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import type { JwtAccessPayload } from '../types/jwt';

export interface AuthRequest extends Request {
  user?: JwtAccessPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtAccessPayload & {
      totpEnabled?: boolean;
      mfaVerified?: boolean;
    };

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      totpEnabled: payload.totpEnabled ?? false,
      mfaVerified: payload.mfaVerified ?? true,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  if (!['ADMIN', 'OWNER'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function ownerMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'OWNER') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtAccessPayload & {
        totpEnabled?: boolean;
        mfaVerified?: boolean;
      };
      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        totpEnabled: payload.totpEnabled ?? false,
        mfaVerified: payload.mfaVerified ?? true,
      };
    }
  } catch {
    /* ignore */
  }
  next();
}
