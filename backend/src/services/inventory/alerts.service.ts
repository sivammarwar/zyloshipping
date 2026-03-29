import { prisma } from '../../db/prisma';

/**
 * Create low stock alert for a product
 * Called during inventory sync when stock < 10
 */
export async function createLowStockAlert(
  productId: string,
  adminId: string = 'system'
): Promise<void> {
  try {
    // Check if alert already exists (not dismissed)
    const existing = await prisma.inventoryAlertDismissal.findUnique({
      where: { productId },
    });

    if (existing) {
      // Alert already exists, don't create duplicate
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { supplier: true },
    });

    if (!product || product.stockQuantity >= 10) {
      return;
    }

    // Create alert record
    await prisma.inventoryAlertDismissal.create({
      data: {
        productId,
        adminId,
      },
    });

    console.log(
      `[alerts] Low stock alert created for ${product.sku}: ${product.stockQuantity} units`
    );

    // TODO: Send email alert to admin when RESEND_API_KEY is configured
    // await sendLowStockEmail(product);
  } catch (error) {
    console.error('[alerts] Error creating low stock alert:', error);
  }
}

/**
 * Dismiss a low stock alert
 */
export async function dismissLowStockAlert(productId: string): Promise<void> {
  try {
    await prisma.inventoryAlertDismissal.delete({
      where: { productId },
    });

    console.log(`[alerts] Dismissed low stock alert for product ${productId}`);
  } catch (error) {
    console.error('[alerts] Error dismissing alert:', error);
  }
}

/**
 * Get all active low stock alerts
 */
export async function getActiveLowStockAlerts() {
  // Get all alert records
  const alerts = await prisma.inventoryAlertDismissal.findMany({
    orderBy: {
      dismissedAt: 'desc',
    },
  });

  // Fetch product details for each alert
  const alertsWithProducts = await Promise.all(
    alerts.map(async (alert) => {
      const product = await prisma.product.findUnique({
        where: { id: alert.productId },
        include: { supplier: true },
      });

      return {
        id: alert.id,
        productId: alert.productId,
        productName: product?.title || 'Unknown',
        productSku: product?.sku || 'N/A',
        currentStock: product?.stockQuantity || 0,
        supplierName: product?.supplier?.name || 'Unknown',
        supplierId: product?.supplierId || 'unknown',
        alertedAt: alert.dismissedAt,
      };
    })
  );

  return alertsWithProducts;
}

/**
 * Check all products and create alerts for low stock items
 * Called during inventory sync
 */
export async function checkAndCreateLowStockAlerts(): Promise<void> {
  const lowStockProducts = await prisma.product.findMany({
    where: {
      stockQuantity: {
        lt: 10,
        gt: 0,
      },
      status: {
        in: ['ACTIVE', 'LOW'],
      },
    },
    select: { id: true },
  });

  for (const product of lowStockProducts) {
    await createLowStockAlert(product.id);
  }

  if (lowStockProducts.length > 0) {
    console.log(`[alerts] Checked ${lowStockProducts.length} low stock products`);
  }
}
