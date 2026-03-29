import { OrderStatus, TicketStatus } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../../db/prisma';
import { toPaise } from '@zyloshipping/shared/utils/currency';
import { refundRazorpayPayment } from './razorpay.service';
import { refundStripePaymentIntent } from './stripe.service';
import { reverseCommissionLedger } from './commission.service';
import { runRefundDisputeAgent } from '../../agents/refundDispute.agent';
import { paymentLogger } from '../../utils/logger';
import { sendRefundConfirmationEmail } from '../email.service';

export async function createRefundSupportTicket(userId: string, orderId: string, message: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });
  if (!order) {
    throw new Error('Order not found');
  }

  const ticketNumber = `RF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      userId,
      orderId,
      message: `[Refund request] ${message}`,
      status: TicketStatus.OPEN,
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.REFUND_REQUESTED },
  });

  paymentLogger.info('Refund ticket created', { orderId, ticketId: ticket.id });
  return ticket;
}

export async function processRefundWithAgentGate(orderId: string, opts?: { force?: boolean }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true, user: true },
  });
  if (!order || !order.payment) {
    throw new Error('Order or payment not found');
  }

  if (order.status === OrderStatus.REFUNDED) {
    return { ok: true as const, skipped: 'already_refunded' as const };
  }

  if (!opts?.force) {
    const decision = await runRefundDisputeAgent(orderId);
    if (!decision.approve) {
      const reason = 'reason' in decision && decision.reason ? decision.reason : 'Policy declined';
      paymentLogger.info('Refund denied by policy agent', { orderId, reason });
      return { ok: false as const, reason };
    }
  }

  const pay = order.payment;
  const gateway = pay.gateway.toLowerCase();

  if (gateway === 'razorpay') {
    const pid = pay.gatewayPaymentId.startsWith('pending_')
      ? null
      : pay.gatewayPaymentId;
    if (!pid) {
      throw new Error('No Razorpay payment id to refund');
    }
    const amountPaise = toPaise(order.totalAmount);
    const refund = await refundRazorpayPayment(pid, amountPaise);
    await prisma.payment.update({
      where: { id: pay.id },
      data: {
        status: 'refunded',
        refundId: (refund as { id?: string }).id ?? null,
        refundAmount: order.totalAmount,
        refundedAt: new Date(),
      },
    });
  } else if (gateway === 'stripe') {
    const amountMinor = pay.amountPaise;
    const refund = await refundStripePaymentIntent(pay.gatewayPaymentId, amountMinor);
    await prisma.payment.update({
      where: { id: pay.id },
      data: {
        status: 'refunded',
        refundId: refund.id,
        refundAmount: order.totalAmount,
        refundedAt: new Date(),
      },
    });
  } else {
    throw new Error('Unknown gateway');
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.REFUNDED },
  });

  await reverseCommissionLedger(orderId);

  if (order.user?.email) {
    await sendRefundConfirmationEmail(
      order.user.email,
      order.orderNumber,
      order.totalAmount,
      order.payment.currency || 'INR'
    ).catch(err => {
      paymentLogger.warn('Refund email failed', { err: String(err) });
    });
  }

  paymentLogger.info('Refund completed', { orderId, gateway });
  return { ok: true as const };
}
