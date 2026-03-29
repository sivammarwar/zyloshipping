import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/** Dashboard admin access: ADMIN role per policy; OWNER included as super-admin. */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  const r = req.user.role;
  if (r !== 'ADMIN' && r !== 'OWNER') {
    return res.status(403).json({ error: 'Admin role required', code: 'ADMIN_REQUIRED' });
  }
  next();
}
