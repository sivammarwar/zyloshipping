import { Response } from 'express';
import { authenticator } from 'otplib';
import { z } from 'zod';
import { prisma } from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';
import { signTokenPair, setAuthCookies } from '../../services/auth/token.service';
import { setAdminMfaSession } from '../../middleware/requireMFA';
import { logAdminAction } from '../../services/admin/adminLog.service';

const ISSUER = process.env.ADMIN_MFA_ISSUER || 'ZyloShipping';

export async function setupMfa(req: AuthRequest, res: Response) {
  const secret = authenticator.generateSecret();
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { totpSecret: secret, totpEnabled: false },
  });

  await logAdminAction(req, { action: 'auth.mfa_setup', resource: 'user', resourceId: req.user!.id });

  const otpauthUrl = authenticator.keyuri(req.user!.email, ISSUER, secret);

  res.json({
    secret,
    otpauthUrl,
    mfa_secret: secret,
    qr_uri: otpauthUrl,
  });
}

export async function verifyMfa(req: AuthRequest, res: Response) {
  const schema = z.object({ token: z.string().min(6).max(10) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Valid TOTP token required' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, role: true, totpSecret: true },
  });
  if (!user?.totpSecret) {
    return res.status(400).json({ error: 'MFA not initialized. Call setup-mfa first.' });
  }

  const ok = authenticator.verify({ token: parsed.data.token, secret: user.totpSecret });
  if (!ok) {
    return res.status(401).json({ error: 'Invalid TOTP code' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: true },
  });

  await setAdminMfaSession(user.id);

  const { access, refresh } = signTokenPair({
    id: user.id,
    email: user.email,
    role: user.role,
    totpEnabled: true,
    mfaVerified: true,
  });
  setAuthCookies(res, access, refresh);

  await logAdminAction(req, { action: 'auth.mfa_verify', resource: 'user', resourceId: user.id });

  res.json({ ok: true, token: access, mfaEnabled: true });
}
