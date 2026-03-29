import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { getAliExpressAdapter } from '../adapters/aliexpress.adapter';
import { getCjAdapter } from '../adapters/cj.adapter';

const router = Router();

router.get('/', async (_req, res: Response) => {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      logo: true,
      logoColor: true,
      status: true,
      rating: true,
      avgDeliveryDays: true,
      uptimePercent: true,
    },
  });
  res.json({ suppliers });
});

router.get('/:id/health', async (req, res: Response) => {
  const id = req.params.id.toLowerCase();
  try {
    if (id === 'aliexpress') {
      const a = getAliExpressAdapter();
      await a.checkStock('health-check');
    } else if (id === 'cj') {
      const a = getCjAdapter();
      await a.checkStock('health-check');
    }
    res.json({ supplierId: id, ok: true });
  } catch (e) {
    res.status(503).json({ supplierId: id, ok: false, error: String(e) });
  }
});

export default router;
