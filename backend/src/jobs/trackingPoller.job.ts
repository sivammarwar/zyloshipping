import { OrderStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { getCjAdapter } from '../services/supplier/cj.adapter';
import { transitionOrder } from '../services/order/stateMachine';

export async function runTrackingPollerJob(): Promise<void> {
  const cj = getCjAdapter();
  const items = await prisma.orderItem.findMany({
    where: {
      supplierId: 'cj',
      supplierOrderId: { not: null },
      order: { status: { in: [OrderStatus.SUBMITTED_TO_SUPPLIER, OrderStatus.SUPPLIER_CONFIRMED] } },
    },
    include: { order: true },
    take: 50,
  });

  for (const item of items) {
    if (!item.supplierOrderId || !cj.getOrderStatus) continue;
    const st = await cj.getOrderStatus(item.supplierOrderId).catch(() => null);
    if (!st) continue;

    let tracking = st.trackingNumber;
    if (tracking) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { trackingNumber: tracking },
      });
    }

    const s = st.status.toLowerCase();
    if (s.includes('fulfill') || s.includes('ship') || tracking) {
      if (item.order.status === OrderStatus.SUPPLIER_CONFIRMED) {
        await transitionOrder(item.orderId, OrderStatus.SHIPPED, 'cj_poll_shipped').catch(() => {});
      }
    }
    if (s.includes('confirm') && item.order.status === OrderStatus.SUBMITTED_TO_SUPPLIER) {
      await transitionOrder(item.orderId, OrderStatus.SUPPLIER_CONFIRMED, 'cj_poll_confirmed').catch(
        () => {}
      );
    }
  }
}
