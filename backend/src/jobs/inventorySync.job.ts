import { ProductStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { getAliExpressAdapter } from '../services/supplier/aliexpress.adapter';
import { getCjAdapter } from '../services/supplier/cj.adapter';
import { isAliExpressConfigured } from '../utils/supplierConfig';
import { checkAndCreateLowStockAlerts } from '../services/inventory/alerts.service';

export async function runInventorySyncJob(supplierId?: string): Promise<void> {
  const ae = getAliExpressAdapter();
  const cj = getCjAdapter();
  const products = await prisma.product.findMany({
    where: {
      status: { in: [ProductStatus.ACTIVE, ProductStatus.LOW] },
      ...(supplierId ? { supplierId } : {}),
    },
    take: supplierId ? 500 : 200,
    select: { id: true, supplierId: true, supplierSku: true },
  });

  for (const p of products) {
    if (p.supplierId === 'aliexpress' && !isAliExpressConfigured()) {
      continue;
    }
    const adapter = p.supplierId === 'cj' ? cj : ae;
    const stock = await adapter.checkStock(p.supplierSku || p.id).catch(() => null);
    if (stock == null) continue;
    await prisma.product.update({
      where: { id: p.id },
      data: {
        stockQuantity: stock,
        status: stock > 10 ? ProductStatus.ACTIVE : stock <= 0 ? ProductStatus.HIDDEN : ProductStatus.LOW,
      },
    });
  }

  // Check and create low stock alerts after sync
  await checkAndCreateLowStockAlerts();
}
