import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../../db/prisma';
import { OrderStatus } from '@prisma/client';
import { stripeClient } from './stripe.service';
import { markOrderPaidFromGateway, reverseCommissionLedger } from './commission.service';
import { sendPaymentFailedEmail, sendAlertEmail } from '../email.service';
import { runStripeDisputeDraftAgent } from '../../agents/refundDispute.agent';
import { paymentLogger } from '../../utils/logger';

export async function handleStripeWebhook(req: Request, res: Response) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const buf = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));

  if (!stripeClient) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  let event: Stripe.Event;

  if (secret) {
    const sig = req.headers['stripe-signature'] as string | undefined;
    try {
      event = stripeClient.webhooks.constructEvent(buf, sig!, secret);
    } catch (err) {
      paymentLogger.warn('Stripe webhook signature failed', { err: String(err) });
      return res.status(400).json({ error: 'Invalid signature' });
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      paymentLogger.error('Stripe webhook: STRIPE_WEBHOOK_SECRET missing in production');
      return res.status(503).json({ error: 'Webhook misconfigured' });
    }
    paymentLogger.warn(
      'Stripe webhook: STRIPE_WEBHOOK_SECRET missing — skipping signature verification (development only)'
    );
    try {
      event = JSON.parse(buf.toString('utf8')) as Stripe.Event;
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  paymentLogger.info('Stripe webhook', { type: event.type });

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (order && order.status === OrderStatus.PENDING) {
          const cur = (pi.currency || 'inr').toUpperCase();
          const minor = pi.amount_received ?? pi.amount;
          await prisma.payment.upsert({
            where: { orderId },
            create: {
              orderId,
              gateway: 'stripe',
              gatewayPaymentId: pi.id,
              amount: minor / 100,
              amountPaise: minor,
              currency: cur,
              status: 'captured',
              webhookDataJson: pi as unknown as object,
            },
            update: {
              gatewayPaymentId: pi.id,
              status: 'captured',
              amountPaise: minor,
              amount: minor / 100,
              currency: cur,
              webhookDataJson: pi as unknown as object,
            },
          });
          await markOrderPaidFromGateway(orderId, 'stripe', {
            currency: cur,
            amountMinorUnits: minor,
          });
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { user: true },
        });
        if (order?.user?.email) {
          await sendPaymentFailedEmail(
            order.user.email,
            order.orderNumber,
            pi.last_payment_error?.message || 'Card or payment method was declined.'
          ).catch(() => {});
        }
        await prisma.payment
          .updateMany({
            where: { orderId },
            data: { status: 'failed', webhookDataJson: pi as unknown as object },
          })
          .catch(() => {});
      }
    }

    if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId = dispute.charge as string;
      const ch = await stripeClient.charges.retrieve(chargeId);
      const piId = ch.payment_intent as string | null;
      const draft = await runStripeDisputeDraftAgent({
        disputeId: dispute.id,
        chargeId,
        paymentIntentId: piId ?? undefined,
        reason: dispute.reason,
        amount: dispute.amount,
        currency: dispute.currency,
      });
      await sendAlertEmail(
        `Stripe dispute ${dispute.id}`,
        `Order PI: ${piId ?? 'unknown'}\n\nDraft:\n${draft.draft}\n\nEvidence:\n${(draft.evidencePoints || []).join('\n- ')}`
      );
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const piId = charge.payment_intent as string | null;
      if (!piId) {
        return res.json({ received: true });
      }
      const full =
        charge.amount_refunded != null &&
        charge.amount != null &&
        charge.amount_refunded >= charge.amount;
      if (!full) {
        paymentLogger.info('Partial Stripe refund — order status unchanged', {
          chargeId: charge.id,
        });
        return res.json({ received: true });
      }
      const pay = await prisma.payment.findFirst({
        where: { gatewayPaymentId: piId },
      });
      if (pay) {
        await prisma.payment.update({
          where: { id: pay.id },
          data: {
            status: 'refunded',
            refundAmount: pay.amount,
            refundedAt: new Date(),
            webhookDataJson: charge as unknown as object,
          },
        });
        await prisma.order.update({
          where: { id: pay.orderId },
          data: { status: OrderStatus.REFUNDED },
        });
        await reverseCommissionLedger(pay.orderId);
      }
    }
  } catch (e) {
    paymentLogger.error('Stripe webhook handler error', { err: String(e) });
  }

  res.json({ received: true });
}
