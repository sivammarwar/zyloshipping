import Razorpay from 'razorpay';
import crypto from 'crypto';

// Inline from shared package (avoiding monorepo import issues)
const toPaise = (inr: number) => Math.round(inr * 100);

import { prisma } from '../../db/prisma';
import { paymentLogger } from '../../utils/logger';

export const razorpayClient: Razorpay | null =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

export function getRazorpayKeyId(): string | undefined {
  return process.env.RAZORPAY_KEY_ID;
}

export function verifyRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return expected === razorpaySignature;
}

export async function createRazorpayOrderForOrder(orderId: string) {
  if (!razorpayClient) {
    throw new Error('Razorpay not configured');
  }
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error('Order not found');
  }

  const amount = order.totalAmount;
  const amountPaise = toPaise(amount);
  const receipt = order.orderNumber.slice(0, 40);

  const rzpOrder = await razorpayClient.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    payment_capture: true,
  });

  await prisma.payment.upsert({
    where: { orderId },
    create: {
      orderId,
      gateway: 'razorpay',
      gatewayPaymentId: `pending_${rzpOrder.id}`,
      gatewayOrderId: rzpOrder.id,
      amount,
      amountPaise,
      currency: 'INR',
      status: 'pending',
    },
    update: {
      gatewayOrderId: rzpOrder.id,
      gatewayPaymentId: `pending_${rzpOrder.id}`,
      amountPaise,
      amount,
      currency: 'INR',
      status: 'pending',
    },
  });

  const keyId = getRazorpayKeyId();
  if (!keyId) {
    throw new Error('RAZORPAY_KEY_ID missing');
  }

  paymentLogger.info('Razorpay order created', {
    orderId,
    razorpayOrderId: rzpOrder.id,
    amountPaise,
  });

  return {
    keyId,
    key_id: keyId,
    razorpayOrderId: rzpOrder.id,
    order_id: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: 'INR' as const,
    amountPaise,
  };
}

export async function refundRazorpayPayment(paymentId: string, amountPaise?: number) {
  if (!razorpayClient) {
    throw new Error('Razorpay not configured');
  }
  const body: { amount?: number } = {};
  if (amountPaise != null) {
    body.amount = amountPaise;
  }
  return razorpayClient.payments.refund(paymentId, body);
}
