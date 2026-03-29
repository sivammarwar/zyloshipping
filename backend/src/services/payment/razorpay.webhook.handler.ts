import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../../db/prisma';
import { OrderStatus } from '@prisma/client';
import { markOrderPaidFromGateway, reverseCommissionLedger } from './commission.service';
import { sendPaymentFailedEmail } from '../email.service';
import { paymentLogger } from '../../utils/logger';

function verifySignature(body: string, signature: string | undefined, secret: string) {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

export async function handleRazorpayWebhook(req: Request, res: Response) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const raw = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
  const sig = req.headers['x-razorpay-signature'] as string | undefined;

  if (secret) {
    if (!verifySignature(raw, sig, secret)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
  } else if (process.env.NODE_ENV === 'production') {
    paymentLogger.error('Razorpay webhook: RAZORPAY_WEBHOOK_SECRET missing in production');
    return res.status(503).json({ error: 'Webhook misconfigured' });
  } else {
    paymentLogger.warn(
      'Razorpay webhook: RAZORPAY_WEBHOOK_SECRET missing — skipping signature verification (development only)'
    );
  }

  let payload: {
    event?: string;
    payload?: {
      payment?: { entity?: Record<string, unknown> };
      refund?: { entity?: Record<string, unknown> };
    };
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const event = payload.event;
  paymentLogger.info('Razorpay webhook', { event });

  try {
    if (event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity as
        | { id?: string; order_id?: string; amount?: number }
        | undefined;
      if (paymentEntity?.id && paymentEntity.order_id) {
        const row = await prisma.payment.findFirst({
          where: { gatewayOrderId: paymentEntity.order_id },
          include: { order: { include: { user: true } } },
        });
        if (row && row.status === 'pending') {
          await prisma.payment.update({
            where: { id: row.id },
            data: {
              gatewayPaymentId: paymentEntity.id,
              status: 'captured',
              webhookDataJson: payload as object,
            },
          });
          await markOrderPaidFromGateway(row.orderId, 'razorpay', {
            currency: 'INR',
            amountMinorUnits: paymentEntity.amount ?? row.amountPaise,
          });
        }
      }
    }

    if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity as
        | { id?: string; order_id?: string; error_description?: string }
        | undefined;
      if (paymentEntity?.order_id) {
        const row = await prisma.payment.findFirst({
          where: { gatewayOrderId: paymentEntity.order_id },
          include: { order: { include: { user: true } } },
        });
        if (row) {
          await prisma.payment.update({
            where: { id: row.id },
            data: { status: 'failed', webhookDataJson: payload as object },
          });
          const email = row.order.user?.email;
          if (email) {
            await sendPaymentFailedEmail(
              email,
              row.order.orderNumber,
              paymentEntity.error_description || 'Payment was declined or failed.'
            ).catch(() => {});
          }
        }
      }
    }

    if (event === 'refund.processed') {
      const refundEntity = payload.payload?.refund?.entity as
        | { payment_id?: string; id?: string }
        | undefined;
      const payId = refundEntity?.payment_id;
      if (payId) {
        const row = await prisma.payment.findFirst({
          where: { gatewayPaymentId: payId },
          include: { order: true },
        });
        if (row && row.order.status !== OrderStatus.REFUNDED) {
          await prisma.payment.update({
            where: { id: row.id },
            data: {
              status: 'refunded',
              refundId: refundEntity?.id ?? null,
              refundAmount: row.amount,
              refundedAt: new Date(),
              webhookDataJson: payload as object,
            },
          });
          await prisma.order.update({
            where: { id: row.orderId },
            data: { status: OrderStatus.REFUNDED },
          });
          await reverseCommissionLedger(row.orderId);
        }
      }
    }
  } catch (e) {
    paymentLogger.error('Razorpay webhook handler error', { err: String(e) });
  }

  res.json({ ok: true });
}
