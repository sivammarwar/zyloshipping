import { Order, OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';

const ORDER_FLOW: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.SUBMITTED_TO_SUPPLIER,
  OrderStatus.SUPPLIER_CONFIRMED,
  OrderStatus.SHIPPED,
  OrderStatus.IN_TRANSIT,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
];

const EXCEPTION_TO_REFUNDED: OrderStatus[] = [OrderStatus.REFUND_REQUESTED];

const CANCEL_SOURCES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.SUBMITTED_TO_SUPPLIER,
  OrderStatus.SUPPLIER_CONFIRMED,
];

const REFUND_REQUEST_SOURCES: OrderStatus[] = [
  OrderStatus.PAYMENT_CONFIRMED,
  OrderStatus.SUBMITTED_TO_SUPPLIER,
  OrderStatus.SUPPLIER_CONFIRMED,
  OrderStatus.SHIPPED,
  OrderStatus.IN_TRANSIT,
  OrderStatus.DELIVERED,
];

export class InvalidOrderTransitionError extends Error {
  readonly code = 'INVALID_ORDER_TRANSITION' as const;
  constructor(
    readonly orderId: string,
    readonly from: OrderStatus,
    readonly to: OrderStatus
  ) {
    super(`Invalid transition for order ${orderId}: ${from} → ${to}`);
    this.name = 'InvalidOrderTransitionError';
  }
}

function isNextInMainFlow(from: OrderStatus, to: OrderStatus): boolean {
  const i = ORDER_FLOW.indexOf(from);
  const j = ORDER_FLOW.indexOf(to);
  if (i === -1 || j === -1) return false;
  return j === i + 1;
}

export function assertTransitionAllowed(orderId: string, from: OrderStatus, to: OrderStatus): void {
  if (from === to) return;

  if (isNextInMainFlow(from, to)) return;

  if (to === OrderStatus.CANCELLED && CANCEL_SOURCES.includes(from)) return;

  if (to === OrderStatus.REFUND_REQUESTED && REFUND_REQUEST_SOURCES.includes(from)) return;

  if (to === OrderStatus.REFUNDED && EXCEPTION_TO_REFUNDED.includes(from)) return;

  throw new InvalidOrderTransitionError(orderId, from, to);
}

export interface TransitionOrderOptions {
  meta?: Record<string, unknown>;
  skipAutomation?: boolean;
  /** Set when confirming payment */
  gateway?: string;
}

/**
 * Single entry point for order status changes. Persists status, audit log, then automation hooks.
 */
export async function transitionOrder(
  orderId: string,
  to: OrderStatus,
  reason: string,
  opts: TransitionOrderOptions = {}
): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  if (order.status === to) {
    return order;
  }

  assertTransitionAllowed(orderId, order.status, to);

  const from = order.status;
  const now = new Date();

  const data: Prisma.OrderUpdateInput = { status: to };

  if (opts.gateway != null) {
    data.gateway = opts.gateway;
  }

  if (to === OrderStatus.DELIVERED && !order.deliveredAt) {
    data.deliveredAt = now;
  }

  const updated = await prisma.$transaction(async tx => {
    const o = await tx.order.update({
      where: { id: orderId },
      data,
    });
    await tx.orderTransitionLog.create({
      data: {
        orderId,
        fromStatus: from,
        toStatus: to,
        reason,
        ...(opts.meta ? { metaJson: opts.meta as Prisma.InputJsonValue } : {}),
      },
    });
    return o;
  });

  if (!opts.skipAutomation) {
    const { dispatchOrderAutomation } = await import('./orderAutomation.service');
    await dispatchOrderAutomation({
      orderId,
      from,
      to,
      reason,
      meta: opts.meta,
    }).catch(err => {
      console.error('[orderAutomation] dispatch failed', orderId, err);
    });
  }

  return updated;
}

/**
 * Bypass normal transition rules for dashboard overrides. Writes the same audit log shape
 * so history stays complete. Use sparingly — automation is skipped by default.
 */
export async function adminForceOrderStatus(
  orderId: string,
  to: OrderStatus,
  reason: string,
  opts: { meta?: Record<string, unknown>; skipAutomation?: boolean } = {}
): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  if (order.status === to) {
    return order;
  }

  const from = order.status;
  const now = new Date();
  const data: Prisma.OrderUpdateInput = { status: to };

  if (to === OrderStatus.DELIVERED && !order.deliveredAt) {
    data.deliveredAt = now;
  }

  const updated = await prisma.$transaction(async tx => {
    const o = await tx.order.update({
      where: { id: orderId },
      data,
    });
    await tx.orderTransitionLog.create({
      data: {
        orderId,
        fromStatus: from,
        toStatus: to,
        reason,
        metaJson: (opts.meta ?? { adminOverride: true }) as Prisma.InputJsonValue,
      },
    });
    return o;
  });

  const skip = opts.skipAutomation !== false;
  if (!skip) {
    const { dispatchOrderAutomation } = await import('./orderAutomation.service');
    await dispatchOrderAutomation({
      orderId,
      from,
      to,
      reason,
      meta: opts.meta,
    }).catch(err => {
      console.error('[orderAutomation] admin force dispatch failed', orderId, err);
    });
  }

  return updated;
}
