import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';

function clientIp(req: AuthRequest): string | undefined {
  const x = req.headers['x-forwarded-for'];
  if (typeof x === 'string') return x.split(',')[0]?.trim();
  if (Array.isArray(x)) return x[0];
  return req.socket.remoteAddress;
}

export async function logAdminAction(
  req: AuthRequest,
  params: {
    action: string;
    resource: string;
    resourceId?: string | null;
    meta?: Record<string, unknown>;
  }
): Promise<void> {
  if (!req.user?.id) return;
  try {
    await prisma.adminLog.create({
      data: {
        adminId: req.user.id,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId ?? null,
        ipAddress: clientIp(req) ?? null,
        metaJson: params.meta ? (params.meta as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (e) {
    console.error('[adminLog]', e);
  }
}
