import Stripe from 'stripe';
import { prisma } from '../../db/prisma';
import { paymentLogger } from '../../utils/logger';

export const stripeClient: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export function getStripePublishableKey(): string | undefined {
  return process.env.STRIPE_PUBLISHABLE_KEY;
}

function toMinorUnits(amountMajor: number, currency: string): number {
  const zeroDecimal = ['jpy', 'krw', 'vnd'].includes(currency.toLowerCase());
  if (zeroDecimal) {
    return Math.round(amountMajor);
  }
  return Math.round(amountMajor * 100);
}

export async function createStripePaymentIntentForOrder(
  orderId: string,
  currency: string = 'inr'
) {
  if (!stripeClient) {
    throw new Error('Stripe not configured');
  }
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error('Order not found');
  }

  const cur = currency.toLowerCase();
  const amountMinor = toMinorUnits(order.totalAmount, cur);

  const intent = await stripeClient.paymentIntents.create({
    amount: amountMinor,
    currency: cur,
    metadata: { orderId },
    automatic_payment_methods: { enabled: true },
    payment_method_options: {
      card: {
        request_three_d_secure: 'automatic',
      },
    },
    /** Radar runs on Stripe; 3DS + risk rules apply in Dashboard (Radar). */
    description: `ZyloShipping order ${order.orderNumber}`,
  });

  const publishableKey = getStripePublishableKey();
  if (!publishableKey) {
    paymentLogger.warn('STRIPE_PUBLISHABLE_KEY not set — frontend will need env');
  }

  paymentLogger.info('Stripe PaymentIntent created', {
    orderId,
    paymentIntentId: intent.id,
    amountMinor,
    currency: cur,
  });

  return {
    clientSecret: intent.client_secret,
    client_secret: intent.client_secret,
    paymentIntentId: intent.id,
    publishableKey,
    publishable_key: publishableKey,
    amount: order.totalAmount,
    currency: cur.toUpperCase(),
    amountMinorUnits: amountMinor,
  };
}

export async function refundStripePaymentIntent(paymentIntentId: string, amountMinor?: number) {
  if (!stripeClient) {
    throw new Error('Stripe not configured');
  }
  return stripeClient.refunds.create({
    payment_intent: paymentIntentId,
    ...(amountMinor != null ? { amount: amountMinor } : {}),
  });
}
