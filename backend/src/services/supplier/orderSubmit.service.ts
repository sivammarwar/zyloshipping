import { OrderStatus } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { retryWithBackoff } from '../../utils/retry';
import { getAliExpressAdapter } from './aliexpress.adapter';
import { getCjAdapter } from './cj.adapter';
import { transitionOrder } from '../order/stateMachine';
import { pauseOrderAutomation } from '../order/orderPause.service';
import { isAliExpressConfigured } from '../../utils/supplierConfig';

async function submitToSupplier(
  supplierId: 'aliexpress' | 'cj',
  orderId: string
): Promise<{ supplierOrderId: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new Error('Order not found');
  const first = order.items[0];
  if (!first) throw new Error('No order items');

  const payload = {
    productId: first.productId,
    quantity: first.quantity,
    shippingAddress: order.shippingAddressJson as object,
    supplierSku: first.product.supplierSku ?? undefined,
  };

  const adapter = supplierId === 'cj' ? getCjAdapter() : getAliExpressAdapter();
  const result = await retryWithBackoff(() => adapter.submitOrder(payload), {
    attempts: 3,
    baseDelayMs: 1000,
  });
  return { supplierOrderId: result.supplierOrderId };
}

function resolvePrimaryBackup(selected: string | null | undefined): {
  primary: 'aliexpress' | 'cj';
  backup: 'aliexpress' | 'cj' | null;
} {
  const aeOk = isAliExpressConfigured();
  let primary: 'aliexpress' | 'cj' = selected === 'cj' ? 'cj' : 'aliexpress';
  if (!aeOk && primary === 'aliexpress') {
    primary = 'cj';
  }

  let backup: 'aliexpress' | 'cj' | null = primary === 'cj' ? 'aliexpress' : 'cj';
  if (!aeOk && backup === 'aliexpress') {
    backup = null;
  }

  return { primary, backup };
}

/**
 * Submit to selected supplier; on failure try backup; on total failure pause automation.
 */
export async function submitOrderToPrimaryOrBackupSupplier(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== OrderStatus.PAYMENT_CONFIRMED) {
    return;
  }

  const { primary, backup } = resolvePrimaryBackup(order.selectedSupplierId);

  let result: { supplierOrderId: string } | null = null;
  let used: 'aliexpress' | 'cj' = primary;

  try {
    result = await submitToSupplier(primary, orderId);
  } catch (e1) {
    console.error('[supplier] primary submit failed', primary, e1);
    if (backup) {
      try {
        result = await submitToSupplier(backup, orderId);
        used = backup;
        await prisma.order.update({
          where: { id: orderId },
          data: { selectedSupplierId: backup },
        });
      } catch (e2) {
        console.error('[supplier] backup submit failed', backup, e2);
        await pauseOrderAutomation(
          orderId,
          `Supplier submit failed after primary (${primary}) and backup (${backup}): ${String(e2)}`
        );
        throw e2;
      }
    } else {
      await pauseOrderAutomation(
        orderId,
        `Supplier submit failed (${primary}) and no backup configured: ${String(e1)}`
      );
      throw e1;
    }
  }

  if (!result) return;

  await prisma.orderItem.updateMany({
    where: { orderId },
    data: { supplierOrderId: result.supplierOrderId },
  });

  await transitionOrder(orderId, OrderStatus.SUBMITTED_TO_SUPPLIER, `supplier_submit:${used}`, {
    meta: { supplierOrderId: result.supplierOrderId, supplier: used },
  });

  const mockFlow =
    process.env.MOCK_SUPPLIER_FLOW === 'true' ||
    (!process.env.ALIEXPRESS_APP_KEY && !process.env.CJ_API_KEY && !process.env.CJ_ACCESS_TOKEN);

  if (mockFlow) {
    await transitionOrder(orderId, OrderStatus.SUPPLIER_CONFIRMED, 'supplier_confirm_mock');
    const tracking = `MOCK-${order.orderNumber.replace(/\D/g, '').slice(-8) || Date.now()}`;
    await prisma.orderItem.updateMany({
      where: { orderId },
      data: { trackingNumber: tracking },
    });
    await transitionOrder(orderId, OrderStatus.SHIPPED, 'tracking_registered_mock', {
      meta: { trackingNumber: tracking },
    });
    await transitionOrder(orderId, OrderStatus.IN_TRANSIT, 'aftership_mock_in_transit');
    await transitionOrder(orderId, OrderStatus.DELIVERED, 'aftership_mock_delivered');
  }
}
