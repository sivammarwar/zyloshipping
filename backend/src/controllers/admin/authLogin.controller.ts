import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../db/prisma';
import { signTokenPair, setAuthCookies } from '../../services/auth/token.service';
import { redis, KEYS } from '../../utils/redis';

/**
 * Dedicated admin login with tighter rate limits. Only ADMIN / OWNER accounts.
 */
export async function adminLogin(req: Request, res: Response) {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && parsed.data.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return res.status(403).json({ error: 'Admin login restricted for this deployment' });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      email: true,
      role: true,
      passwordHash: true,
      isActive: true,
      totpEnabled: true,
    },
  });

  if (
    !user ||
    !['ADMIN', 'OWNER'].includes(user.role) ||
    !(await bcrypt.compare(parsed.data.password, user.passwordHash))
  ) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Account disabled' });
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

  res.json({
    user: { id: user.id, email: user.email, role: user.role },
    token: access,
    mfaRequired: user.totpEnabled && !mfaVerified,
  });
}
