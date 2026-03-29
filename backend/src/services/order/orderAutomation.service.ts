import { OrderStatus } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { runOrderRoutingAgent } from '../../agents/orderRouting.agent';
import {
  sendOrderConfirmedEmail,
  sendOrderProcessingEmail,
  sendOrderShippedEmail,
  sendOutForDeliveryEmail,
  sendOrderDeliveredEmail,
  sendOrderInTransitEmail,
} from '../notification/email.service';
import { sendShippedSms, sendOutForDeliverySms, sendDeliveredSms } from '../notification/sms.service';
import { registerTrackingWithAfterShip } from '../tracking/aftership.service';
import { transitionOrder } from './stateMachine';
import { submitOrderToPrimaryOrBackupSupplier } from '../supplier/orderSubmit.service';
import { isAliExpressConfigured } from '../../utils/supplierConfig';
export interface AutomationContext {
  orderId: string;
  from: OrderStatus;
  to: OrderStatus;
  reason: string;
  meta?: Record<string, unknown>;
}

export async function dispatchOrderAutomation(ctx: AutomationContext): Promise<void> {
  const { orderId, to } = ctx;

  switch (to) {
    case OrderStatus.PAYMENT_CONFIRMED:
      await onPaymentConfirmed(orderId);
      break;
    case OrderStatus.SUBMITTED_TO_SUPPLIER:
      break;
    case OrderStatus.SUPPLIER_CONFIRMED:
      await onSupplierConfirmed(orderId);
      break;
    case OrderStatus.SHIPPED:
      await onShipped(orderId);
      break;
    case OrderStatus.IN_TRANSIT:
      await onInTransit(orderId);
      break;
    case OrderStatus.DELIVERED:
      await onDelivered(orderId);
      break;
    case OrderStatus.COMPLETED:
      await onCompleted(orderId);
      break;
    default:
      break;
  }
}

async function onPaymentConfirmed(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });
  if (!order) return;

  await sendOrderConfirmedEmail(order).catch(err => console.error('[email] order confirmed', err));

  try {
    const routing = await runOrderRoutingAgent(orderId);
    let supplierId = routing?.supplierId === 'cj' ? 'cj' : 'aliexpress';
    if (!isAliExpressConfigured()) {
      supplierId = 'cj';
    }
    await prisma.order.update({
      where: { id: orderId },
      data: { selectedSupplierId: supplierId },
    });
  } catch (e) {
    console.error('[routing] failed', e);
    await prisma.order.update({
      where: { id: orderId },
      data: { selectedSupplierId: isAliExpressConfigured() ? 'aliexpress' : 'cj' },
    });
  }

  const { getOrderAutomationQueue } = await import('../../jobs/queue');
  const q = getOrderAutomationQueue();
  if (q) {
    await q.add(
      'orderSubmission',
      { orderId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnFail: false,
      }
    );
  } else {
    await submitOrderToPrimaryOrBackupSupplier(orderId).catch(err =>
      console.error('[order] inline submit failed (no queue)', err)
    );
  }

  if (process.env.PUSH_NOTIFICATIONS_ENABLED === 'true') {
    console.log('[push] order confirmed', orderId);
  }
}

async function onSupplierConfirmed(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });
  if (!order?.user?.email) return;
  await sendOrderProcessingEmail(order).catch(() => {});
}

async function onShipped(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });
  if (!order) return;

  const tracking = order.items.find(i => i.trackingNumber)?.trackingNumber;
  const trackingUrl = tracking
    ? `${process.env.AFTERSHIP_PUBLIC_TRACKING_BASE || 'https://zylo.aftership.com'}/${encodeURIComponent(tracking)}`
    : undefined;

  await sendOrderShippedEmail(order, tracking ?? undefined).catch(() => {});
  if (order.user?.phone && trackingUrl) {
    await sendShippedSms(order.user.phone ?? '', order.orderNumber, trackingUrl).catch(() => {});
  }

  if (tracking) {
    await registerTrackingWithAfterShip(tracking, order.orderNumber).catch(() => {});
  }
}

async function onInTransit(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });
  if (!order?.user?.email) return;
  await sendOrderInTransitEmail(order).catch(() => {});
}

async function onDelivered(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });
  if (!order?.user?.email) return;

  await sendOrderDeliveredEmail(order).catch(() => {});

  if (order.user.phone) {
    await sendDeliveredSms(order.user.phone ?? '', order.orderNumber).catch(() => {});
  }

  const { getOrderAutomationQueue } = await import('../../jobs/queue');
  const q = getOrderAutomationQueue();
  if (q) {
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    await q.add('reviewRequest', { orderId }, { delay: threeDays, removeOnFail: false });
    await q.add('orderCompletion', { orderId }, { delay: sevenDays, removeOnFail: false });
  }
}

async function onCompleted(orderId: string) {
  const row = await prisma.commission.findUnique({ where: { orderId } });
  console.log('[commission] ledger finalized for order', orderId, row?.netCommission);
}

export async function notifyOutForDelivery(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });
  if (!order?.user?.email) return;
  await sendOutForDeliveryEmail(order).catch(() => {});
  if (order.user.phone) {
    await sendOutForDeliverySms(order.user.phone ?? '', order.orderNumber).catch(() => {});
  }
}

export { pauseOrderAutomation, resumeOrderAutomation } from './orderPause.service';

export async function safeTransition(
  orderId: string,
  to: OrderStatus,
  reason: string,
  meta?: Record<string, unknown>
) {
  return transitionOrder(orderId, to, reason, { meta });
}
