import { OrderStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { transitionOrder } from '../services/order/stateMachine';

export async function runOrderCompletionJob(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== OrderStatus.DELIVERED) return;
  try {
    await transitionOrder(orderId, OrderStatus.COMPLETED, 'auto_completion_7d_after_delivery');
  } catch (e) {
    console.warn('[orderCompletion] skipped', orderId, String(e));
  }
}
