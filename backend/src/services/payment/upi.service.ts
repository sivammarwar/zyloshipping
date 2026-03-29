import QRCode from 'qrcode';
import { prisma } from '../../db/prisma';
import { redis, KEYS, TTL } from '../../utils/redis';
import { createRazorpayOrderForOrder, razorpayClient, verifyRazorpayPaymentSignature } from './razorpay.service';
import { markOrderPaidFromGateway } from './commission.service';
import { paymentLogger } from '../../utils/logger';

const UPI_POLL_WINDOW_MS = 5 * 60 * 1000;

function buildUpiQuery(params: {
  pa: string;
  pn: string;
  am: string;
  cu: string;
  tn: string;
  tr: string;
}) {
  const q = new URLSearchParams({
    pa: params.pa,
    pn: params.pn,
    am: params.am,
    cu: params.cu,
    tn: params.tn,
    tr: params.tr,
  });
  return q.toString();
}

function buildDeepLinks(amountMajor: string, razorpayOrderId: string, orderNumber: string) {
  const vpa = process.env.MERCHANT_UPI_VPA || process.env.RAZORPAY_MERCHANT_VPA || 'merchant@razorpay';
  const base = buildUpiQuery({
    pa: vpa,
    pn: 'ZyloShipping',
    am: amountMajor,
    cu: 'INR',
    tn: `Order ${orderNumber}`,
    tr: razorpayOrderId,
  });

  return {
    universal: `upi://pay?${base}`,
    googlePay: `tez://pay?${base}`,
    phonePe: `phonepe://pay?${base}`,
    paytm: `paytmmp://pay?${base}`,
    bhim: `bhim://pay?${base}`,
  };
}

export async function createUpiOrderBundle(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error('Order not found');
  }

  const created = await createRazorpayOrderForOrder(orderId);
  const amountStr = order.totalAmount.toFixed(2);
  const deepLinks = buildDeepLinks(amountStr, created.razorpayOrderId, order.orderNumber);

  const upiString = deepLinks.universal;
  const qrPayload = { upiString };

  if (redis) {
    await redis.set(KEYS.upiSession(orderId), String(Date.now()), { ex: TTL.UPI_PAY });
  }

  paymentLogger.info('UPI Razorpay order ready', {
    orderId,
    razorpayOrderId: created.razorpayOrderId,
  });

  return {
    keyId: created.keyId,
    key_id: created.key_id,
    razorpayOrderId: created.razorpayOrderId,
    order_id: created.order_id,
    amount: created.amount,
    currency: created.currency,
    amountPaise: created.amountPaise,
    deepLinks,
    qrPayload,
    pollIntervalMs: 3000,
    pollExpiresAt: new Date(Date.now() + UPI_POLL_WINDOW_MS).toISOString(),
    maxPollDurationMs: UPI_POLL_WINDOW_MS,
  };
}

export async function verifyUpiSignatureAndCapture(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  if (!verifyRazorpayPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    return { verified: false as const, error: 'Invalid payment signature' };
  }

  const payment = await prisma.payment.findFirst({
    where: { gatewayOrderId: razorpayOrderId },
    include: { order: true },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayPaymentId: razorpayPaymentId,
        status: 'captured',
        method: 'upi',
      },
    });
    await markOrderPaidFromGateway(payment.orderId, 'razorpay');
  }

  return { verified: true as const, paymentId: razorpayPaymentId };
}

export async function getUpiPaymentStatusAndMaybeCapture(paymentId: string, userId?: string) {
  if (!razorpayClient) {
    throw new Error('Razorpay not configured');
  }
  const remote = await razorpayClient.payments.fetch(paymentId);
  const orderIdFromRzp = (remote as { order_id?: string }).order_id;

  const local = await prisma.payment.findFirst({
    where: {
      OR: [
        { gatewayPaymentId: paymentId },
        ...(orderIdFromRzp ? [{ gatewayOrderId: orderIdFromRzp }] : []),
      ],
    },
    include: { order: true },
  });

  if (userId && local && local.order.userId !== userId) {
    throw new Error('Forbidden');
  }

  if (remote.status === 'captured' && local && local.status === 'pending') {
    await prisma.payment.update({
      where: { id: local.id },
      data: {
        status: 'captured',
        method: 'upi',
        gatewayPaymentId: paymentId,
      },
    });
    await markOrderPaidFromGateway(local.orderId, 'razorpay');
  }

  return {
    status: remote.status,
    method: remote.method,
    orderId: local?.orderId,
  };
}

export async function generateUpiQrDataUrl(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error('Order not found');
  }
  const vpa = process.env.MERCHANT_UPI_VPA || process.env.RAZORPAY_MERCHANT_VPA;
  if (!vpa) {
    throw new Error('MERCHANT_UPI_VPA not configured for QR');
  }
  const amount = order.totalAmount.toFixed(2);
  const upiString =
    `upi://pay?pa=${encodeURIComponent(vpa)}` +
    `&pn=${encodeURIComponent('ZyloShipping')}` +
    `&am=${amount}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(`Order ${order.orderNumber}`)}` +
    `&tr=${encodeURIComponent(orderId)}`;

  const qrDataUrl = await QRCode.toDataURL(upiString, { width: 300 });
  return { qrDataUrl, upiString };
}

export async function registerUpiSession(orderId: string) {
  if (redis) {
    await redis.set(KEYS.upiSession(orderId), String(Date.now()), { ex: TTL.UPI_PAY });
  }
  return { ok: true, expiresInSec: TTL.UPI_PAY };
}

export async function handleUpiTimeout(orderId: string) {
  const payment = await prisma.payment.findUnique({
    where: { orderId },
    include: { order: { include: { user: true } } },
  });
  if (!payment || payment.status !== 'pending') {
    return { updated: false, reason: 'not_pending' as const };
  }

  let started = payment.createdAt.getTime();
  if (redis) {
    const raw = await redis.get<string>(KEYS.upiSession(orderId));
    if (raw) started = Number(raw);
  }
  if (Date.now() - started < UPI_POLL_WINDOW_MS - 2000) {
    return { updated: false, reason: 'window_not_elapsed' as const };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'failed' },
  });

  paymentLogger.warn('UPI payment timed out', { orderId });

  const { sendPaymentFailedEmail } = await import('../email.service');
  const email = payment.order.user?.email;
  if (email) {
    await sendPaymentFailedEmail(
      email,
      payment.order.orderNumber,
      'UPI payment window expired. Please try again or use another method.'
    ).catch(() => {});
  }

  return { updated: true as const };
}
