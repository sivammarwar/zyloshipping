import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../db/prisma';
import {
  createRazorpayOrderForOrder,
  verifyRazorpayPaymentSignature,
} from '../services/payment/razorpay.service';
import { createStripePaymentIntentForOrder, stripeClient } from '../services/payment/stripe.service';
import { markOrderPaidFromGateway } from '../services/payment/commission.service';
import {
  createUpiOrderBundle,
  verifyUpiSignatureAndCapture,
  getUpiPaymentStatusAndMaybeCapture,
  generateUpiQrDataUrl,
  registerUpiSession,
  handleUpiTimeout,
} from '../services/payment/upi.service';
import { createRefundSupportTicket, processRefundWithAgentGate } from '../services/payment/refund.service';
import { paymentLogger } from '../utils/logger';

export async function createRazorpayOrder(req: AuthRequest, res: Response) {
  try {
    const { orderId } = req.body as { orderId?: string };
    if (!orderId) {
      return res.status(400).json({ error: 'orderId required' });
    }
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.id },
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const result = await createRazorpayOrderForOrder(orderId);
    res.json(result);
  } catch (e) {
    paymentLogger.error('createRazorpayOrder', { err: String(e) });
    res.status(500).json({ error: (e as Error).message || 'Failed to create Razorpay order' });
  }
}

export async function verifyRazorpayPayment(req: AuthRequest, res: Response) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'razorpay_order_id, razorpay_payment_id, razorpay_signature required' });
    }
    if (!verifyRazorpayPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const payment = await prisma.payment.findFirst({
      where: { gatewayOrderId: razorpay_order_id },
      include: { order: true },
    });
    if (!payment || payment.order.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayPaymentId: razorpay_payment_id,
        status: 'captured',
      },
    });

    await markOrderPaidFromGateway(payment.orderId, 'razorpay', {
      currency: 'INR',
      amountMinorUnits: payment.amountPaise,
    });

    res.json({ verified: true, paymentId: razorpay_payment_id });
  } catch (e) {
    paymentLogger.error('verifyRazorpayPayment', { err: String(e) });
    res.status(500).json({ error: 'Verification failed' });
  }
}

export async function createStripeIntent(req: AuthRequest, res: Response) {
  try {
    const { orderId, currency } = req.body as { orderId?: string; currency?: string };
    if (!orderId) {
      return res.status(400).json({ error: 'orderId required' });
    }
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.id },
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const result = await createStripePaymentIntentForOrder(orderId, currency || 'inr');
    res.json(result);
  } catch (e) {
    paymentLogger.error('createStripeIntent', { err: String(e) });
    res.status(500).json({ error: (e as Error).message || 'Failed to create PaymentIntent' });
  }
}

export async function confirmStripePayment(req: AuthRequest, res: Response) {
  try {
    if (!stripeClient) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }
    const { paymentIntentId, orderId } = req.body as { paymentIntentId?: string; orderId?: string };
    if (!paymentIntentId || !orderId) {
      return res.status(400).json({ error: 'paymentIntentId and orderId required' });
    }
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.id },
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const pi = await stripeClient.paymentIntents.retrieve(paymentIntentId);
    if (pi.metadata?.orderId !== orderId) {
      return res.status(400).json({ error: 'Order mismatch' });
    }
    if (pi.status !== 'succeeded') {
      return res.status(400).json({ error: `Payment not complete: ${pi.status}` });
    }

    const minor = pi.amount_received ?? pi.amount;
    const cur = (pi.currency || 'inr').toUpperCase();

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
      },
      update: {
        gatewayPaymentId: pi.id,
        status: 'captured',
        amountPaise: minor,
        amount: minor / 100,
        currency: cur,
      },
    });

    await markOrderPaidFromGateway(orderId, 'stripe', {
      currency: cur,
      amountMinorUnits: minor,
    });

    res.json({ success: true, paymentIntentId: pi.id });
  } catch (e) {
    paymentLogger.error('confirmStripePayment', { err: String(e) });
    res.status(500).json({ error: 'Confirmation failed' });
  }
}

export async function getStripePublishableKey(_req: AuthRequest, res: Response) {
  const { getStripePublishableKey } = await import('../services/payment/stripe.service');
  const k = getStripePublishableKey();
  if (!k) {
    return res.status(500).json({ error: 'Stripe publishable key not configured' });
  }
  res.json({ publishableKey: k, publishable_key: k });
}

export async function createUpiOrder(req: AuthRequest, res: Response) {
  try {
    const { orderId } = req.body as { orderId?: string };
    if (!orderId) {
      return res.status(400).json({ error: 'orderId required' });
    }
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.id },
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const result = await createUpiOrderBundle(orderId);
    res.json(result);
  } catch (e) {
    paymentLogger.error('createUpiOrder', { err: String(e) });
    res.status(500).json({ error: (e as Error).message || 'UPI order failed' });
  }
}

export async function verifyUpiPayment(req: AuthRequest, res: Response) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing Razorpay fields' });
    }
    const payment = await prisma.payment.findFirst({
      where: { gatewayOrderId: razorpay_order_id },
      include: { order: true },
    });
    if (!payment || payment.order.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const result = await verifyUpiSignatureAndCapture(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    if (!result.verified) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (e) {
    paymentLogger.error('verifyUpiPayment', { err: String(e) });
    res.status(500).json({ error: 'Verification failed' });
  }
}

export async function getUpiPaymentStatus(req: AuthRequest, res: Response) {
  try {
    const { paymentId } = req.params;
    const status = await getUpiPaymentStatusAndMaybeCapture(paymentId, req.user!.id);
    res.json(status);
  } catch (e) {
    if ((e as Error).message === 'Forbidden') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    paymentLogger.error('getUpiPaymentStatus', { err: String(e) });
    res.status(500).json({ error: 'Could not fetch payment status' });
  }
}

export async function postUpiQr(req: AuthRequest, res: Response) {
  try {
    const { orderId } = req.body as { orderId?: string };
    if (!orderId) {
      return res.status(400).json({ error: 'orderId required' });
    }
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.id },
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const result = await generateUpiQrDataUrl(orderId);
    res.json(result);
  } catch (e) {
    paymentLogger.error('postUpiQr', { err: String(e) });
    res.status(500).json({ error: (e as Error).message || 'QR generation failed' });
  }
}

export async function postUpiRegister(req: AuthRequest, res: Response) {
  try {
    const { orderId } = req.body as { orderId?: string };
    if (!orderId) {
      return res.status(400).json({ error: 'orderId required' });
    }
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.id },
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const result = await registerUpiSession(orderId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Register failed' });
  }
}

export async function postUpiTimeout(req: AuthRequest, res: Response) {
  try {
    const { orderId } = req.body as { orderId?: string };
    if (!orderId) {
      return res.status(400).json({ error: 'orderId required' });
    }
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.id },
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const result = await handleUpiTimeout(orderId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Timeout handler failed' });
  }
}

export async function postRefundRequest(req: AuthRequest, res: Response) {
  try {
    const { orderId, message } = req.body as { orderId?: string; message?: string };
    if (!orderId || !message) {
      return res.status(400).json({ error: 'orderId and message required' });
    }
    const ticket = await createRefundSupportTicket(req.user!.id, orderId, message);
    res.json({ ticketId: ticket.id, ticketNumber: ticket.ticketNumber });
  } catch (e) {
    paymentLogger.error('postRefundRequest', { err: String(e) });
    res.status(500).json({ error: (e as Error).message || 'Could not create ticket' });
  }
}

export async function postRefundProcess(req: AuthRequest, res: Response) {
  try {
    const { orderId, force } = req.body as { orderId?: string; force?: boolean };
    if (!orderId) {
      return res.status(400).json({ error: 'orderId required' });
    }
    const result = await processRefundWithAgentGate(orderId, { force });
    res.json(result);
  } catch (e) {
    paymentLogger.error('postRefundProcess', { err: String(e) });
    res.status(500).json({ error: (e as Error).message || 'Refund failed' });
  }
}
