import { prisma } from '../../db/prisma';
import { OrderStatus } from '@prisma/client';
import type { PaymentGateway } from './types';
import { paymentLogger } from '../../utils/logger';
import { transitionOrder } from '../order/stateMachine';

/** Razorpay India: 2% of revenue (major units, INR). */
const RAZORPAY_FEE_RATE = 0.02;

/**
 * Stripe: 2.9% + fixed in smallest currency units.
 * USD: +30 cents. INR: percentage only (fixed optional via env).
 */
export function stripeGatewayFeeMinor(amountMinor: number, currency: string): number {
  const c = currency.toLowerCase();
  const pct = Math.round(amountMinor * 0.029);
  if (c === 'usd') {
    const fixed = 30;
    return pct + fixed;
  }
  if (c === 'inr') {
    const fixedInr = Number(process.env.STRIPE_FIXED_FEE_PAISE || '0');
    return pct + fixedInr;
  }
  const fixed = Number(process.env.STRIPE_FIXED_FEE_MINOR || '0');
  return pct + fixed;
}

export function calculateGatewayFeeMajor(
  revenue: number,
  gateway: PaymentGateway,
  opts?: { currency?: string; amountMinorUnits?: number }
): number {
  if (gateway === 'razorpay') {
    return revenue * RAZORPAY_FEE_RATE;
  }
  const currency = (opts?.currency || 'inr').toLowerCase();
  const minor = opts?.amountMinorUnits ?? Math.round(revenue * 100);
  const feeMinor = stripeGatewayFeeMinor(minor, currency);
  return feeMinor / 100;
}

export function buildCommissionBreakdown(params: {
  revenue: number;
  supplierCost: number;
  gateway: PaymentGateway;
  currency?: string;
  amountMinorUnits?: number;
  shippingCost: number;
}) {
  const gatewayFee = calculateGatewayFeeMajor(params.revenue, params.gateway, {
    currency: params.currency,
    amountMinorUnits: params.amountMinorUnits,
  });
  // net_commission = revenue - supplier_cost - gateway_fee (shipping stored separately)
  const netCommission = params.revenue - params.supplierCost - gatewayFee;
  const marginPercent = params.revenue > 0 ? (netCommission / params.revenue) * 100 : 0;
  return {
    revenue: params.revenue,
    supplierCost: params.supplierCost,
    gatewayFee,
    netCommission,
    marginPercent,
    shippingCost: params.shippingCost,
  };
}

export async function recordCommissionForOrder(
  orderId: string,
  gateway: PaymentGateway,
  opts?: { currency?: string; amountMinorUnits?: number }
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return null;

  const supplierCost = order.items.reduce((s, i) => s + i.supplierCost * i.quantity, 0);
  const revenue = order.totalAmount;
  const breakdown = buildCommissionBreakdown({
    revenue,
    supplierCost,
    gateway,
    currency: opts?.currency || 'INR',
    amountMinorUnits: opts?.amountMinorUnits,
    shippingCost: order.shippingAmount,
  });

  return prisma.commission.upsert({
    where: { orderId },
    create: {
      orderId,
      revenue: breakdown.revenue,
      supplierCost: breakdown.supplierCost,
      gatewayFee: breakdown.gatewayFee,
      netCommission: breakdown.netCommission,
      marginPercent: breakdown.marginPercent,
      shippingCost: breakdown.shippingCost,
    },
    update: {
      revenue: breakdown.revenue,
      supplierCost: breakdown.supplierCost,
      gatewayFee: breakdown.gatewayFee,
      netCommission: breakdown.netCommission,
      marginPercent: breakdown.marginPercent,
      shippingCost: breakdown.shippingCost,
    },
  });
}

/** Full refund: reverse net commission sign for ledger visibility. */
export async function reverseCommissionLedger(orderId: string) {
  const row = await prisma.commission.findUnique({ where: { orderId } });
  if (!row) return null;
  return prisma.commission.update({
    where: { orderId },
    data: {
      netCommission: -Math.abs(row.netCommission),
      revenue: 0,
      gatewayFee: 0,
    },
  });
}

export async function markOrderPaidFromGateway(
  orderId: string,
  gateway: PaymentGateway,
  commissionOpts?: { currency?: string; amountMinorUnits?: number }
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    paymentLogger.warn('markOrderPaid: order not found', { orderId });
    return;
  }

  if (
    order.status === OrderStatus.REFUNDED ||
    order.status === OrderStatus.CANCELLED
  ) {
    paymentLogger.info('markOrderPaid: terminal state, ignoring', {
      orderId,
      status: order.status,
    });
    return;
  }

  await recordCommissionForOrder(orderId, gateway, commissionOpts).catch(() => {});

  if (order.status === OrderStatus.PENDING) {
    await transitionOrder(orderId, OrderStatus.PAYMENT_CONFIRMED, 'gateway_payment_captured', {
      gateway,
      meta: { gateway },
    }).catch(err => {
      paymentLogger.error('transition PAYMENT_CONFIRMED failed', { orderId, err: String(err) });
    });
  }
}
