import { ProductStatus } from '@prisma/client';
import { prisma } from '../../db/prisma';

/**
 * Decrement stock after order is confirmed
 * Updates product status based on remaining stock
 * Logs changes to ProductMetricAudit table
 */
export async function decrementStockForOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    console.error(`[stock] Order ${orderId} not found`);
    return;
  }

  for (const item of order.items) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        console.warn(`[stock] Product ${item.productId} not found`);
        continue;
      }

      const newStock = Math.max(0, product.stockQuantity - item.quantity);
      
      // Determine new status based on stock level
      let newStatus = product.status;
      if (newStock === 0) {
        newStatus = ProductStatus.HIDDEN;
      } else if (newStock < 10) {
        newStatus = ProductStatus.LOW;
      }

      // Update product stock and status
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: newStock,
          status: newStatus,
        },
      });

      // Log stock change to ProductMetricAudit
      await prisma.productMetricAudit.create({
        data: {
          productId: item.productId,
          kind: 'stock',
          value: newStock,
        },
      });

      console.log(
        `[stock] Updated ${product.sku}: ${product.stockQuantity} → ${newStock} (status: ${newStatus})`
      );
    } catch (error) {
      console.error(`[stock] Error updating stock for product ${item.productId}:`, error);
    }
  }
}

/**
 * Restore stock when order is cancelled or refunded
 */
export async function restoreStockForOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    console.error(`[stock] Order ${orderId} not found`);
    return;
  }

  for (const item of order.items) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        console.warn(`[stock] Product ${item.productId} not found`);
        continue;
      }

      const newStock = product.stockQuantity + item.quantity;
      
      // Determine new status based on stock level
      let newStatus = product.status;
      if (newStock > 10 && product.status === ProductStatus.HIDDEN) {
        newStatus = ProductStatus.ACTIVE;
      } else if (newStock >= 10 && product.status === ProductStatus.LOW) {
        newStatus = ProductStatus.ACTIVE;
      } else if (newStock > 0 && newStock < 10) {
        newStatus = ProductStatus.LOW;
      }

      // Update product stock and status
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: newStock,
          status: newStatus,
        },
      });

      // Log stock restoration to ProductMetricAudit
      await prisma.productMetricAudit.create({
        data: {
          productId: item.productId,
          kind: 'stock',
          value: newStock,
        },
      });

      console.log(
        `[stock] Restored ${product.sku}: ${product.stockQuantity} → ${newStock} (status: ${newStatus})`
      );
    } catch (error) {
      console.error(`[stock] Error restoring stock for product ${item.productId}:`, error);
    }
  }
}
