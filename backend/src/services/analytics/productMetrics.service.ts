import { prisma } from '../../db/prisma';

/**
 * Track product sale
 * Called after order is confirmed
 */
export async function trackProductSale(productId: string, quantity: number): Promise<void> {
  try {
    // Increment total sales count
    await prisma.product.update({
      where: { id: productId },
      data: {
        totalSales: {
          increment: quantity,
        },
      },
    });

    // Log to ProductMetricAudit
    await prisma.productMetricAudit.create({
      data: {
        productId,
        kind: 'sale',
        value: quantity,
      },
    });

    console.log(`[metrics] Tracked sale for product ${productId}: ${quantity} units`);
  } catch (error) {
    console.error('[metrics] Error tracking product sale:', error);
  }
}

/**
 * Track product view
 * Called when product page is viewed
 */
export async function trackProductView(productId: string): Promise<void> {
  try {
    // Log to ProductMetricAudit
    await prisma.productMetricAudit.create({
      data: {
        productId,
        kind: 'view',
        value: 1,
      },
    });
  } catch (error) {
    console.error('[metrics] Error tracking product view:', error);
  }
}

/**
 * Track all sales for an order
 * Called after order is confirmed
 */
export async function trackOrderSales(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    console.error(`[metrics] Order ${orderId} not found`);
    return;
  }

  for (const item of order.items) {
    await trackProductSale(item.productId, item.quantity);
  }
}

/**
 * Get top selling products
 */
export async function getTopSellingProducts(limit: number = 10) {
  const products = await prisma.product.findMany({
    where: {
      totalSales: {
        gt: 0,
      },
    },
    orderBy: {
      totalSales: 'desc',
    },
    take: limit,
    select: {
      id: true,
      sku: true,
      title: true,
      totalSales: true,
      price: true,
    },
  });

  return products;
}

/**
 * Get product metrics for analytics
 */
export async function getProductMetrics(productId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const metrics = await prisma.productMetricAudit.findMany({
    where: {
      productId,
      recordedAt: {
        gte: startDate,
      },
    },
    orderBy: {
      recordedAt: 'asc',
    },
  });

  const sales = metrics.filter((m) => m.kind === 'sale').reduce((sum, m) => sum + m.value, 0);
  const views = metrics.filter((m) => m.kind === 'view').length;

  return {
    sales,
    views,
    conversionRate: views > 0 ? (sales / views) * 100 : 0,
  };
}
