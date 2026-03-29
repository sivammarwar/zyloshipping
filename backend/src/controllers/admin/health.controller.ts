import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getAdminHealthSnapshot } from '../../services/admin/health.service';

export async function getAdminHealth(_req: AuthRequest, res: Response) {
  try {
    const payload = await getAdminHealthSnapshot();
    res.json(payload);
  } catch (e) {
    console.error('[admin.health]', e);
    res.status(500).json({ error: 'Health check failed' });
  }
}
