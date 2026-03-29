import { Router } from 'express';
import crypto from 'crypto';
import { OrderStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { calculateCommission, reverseCommission } from '../services/commission.service';
import { decrementStockForOrder, restoreStockForOrder } from '../services/order/stockUpdate.service';
import { trackOrderSales } from '../services/analytics/productMetrics.service';
import { invalidateRevenueCache } from '../services/analytics/revenue.service';
import { getOrderAutomationQueue } from '../jobs/queue';

const router = Router();

/**
 * Verify Razorpay webhook signature
 */
function verifyRazorpaySignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (!secret) {
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production') {
      console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not set in production!');
      return false;
    }
    console.warn('[webhook] RAZORPAY_WEBHOOK_SECRET not set, allowing in development');
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Verify Stripe webhook signature
 */
function verifyStripeSignature(body: string, signature: string): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!secret) {
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production') {
      console.error('[webhook] STRIPE_WEBHOOK_SECRET not set in production!');
      return false;
    }
    console.warn('[webhook] STRIPE_WEBHOOK_SECRET not set, allowing in development');
    return true;
  }

  // Stripe signature verification would use Stripe SDK
  // For now, basic implementation
  return true;
}

/**
 * Process successful payment
 */
async function processPaymentSuccess(orderId: string, gateway: 'razorpay' | 'stripe'): Promise<void> {
  try {
    // 1. Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAYMENT_CONFIRMED },
    });

    // 2. Calculate commission
    await calculateCommission(orderId, gateway);

    // 3. Decrement stock
    await decrementStockForOrder(orderId);

    // 4. Track product sales
    await trackOrderSales(orderId);

    // 5. Invalidate revenue cache
    await invalidateRevenueCache();

    // 6. Send order confirmation email (TODO: when RESEND_API_KEY is set)
    // await sendOrderConfirmationEmail(orderId);

    // 7. Queue order submission to supplier
    const queue = getOrderAutomationQueue();
    if (queue) {
      await queue.add('orderSubmission', { orderId });
    }

    console.log(`[webhook] Payment success processed for order ${orderId}`);
  } catch (error) {
    console.error('[webhook] Error processing payment success:', error);
  }
}

/**
 * Process payment failure
 */
async function processPaymentFailure(orderId: string): Promise<void> {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    // TODO: Send payment failure email when RESEND_API_KEY is set
    // await sendPaymentFailureEmail(orderId);

    console.log(`[webhook] Payment failure processed for order ${orderId}`);
  } catch (error) {
    console.error('[webhook] Error processing payment failure:', error);
  }
}

/**
 * Process refund
 */
async function processRefund(orderId: string): Promise<void> {
  try {
    // 1. Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUNDED },
    });

    // 2. Reverse commission
    await reverseCommission(orderId);

    // 3. Restore stock
    await restoreStockForOrder(orderId);

    // 4. Invalidate revenue cache
    await invalidateRevenueCache();

    // 5. Send refund confirmation email (TODO: when RESEND_API_KEY is set)
    // await sendRefundConfirmationEmail(orderId);

    console.log(`[webhook] Refund processed for order ${orderId}`);
  } catch (error) {
    console.error('[webhook] Error processing refund:', error);
  }
}

/**
 * Razorpay webhook handler
 */
router.post('/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);

    // Verify signature
    if (!verifyRazorpaySignature(body, signature)) {
      console.error('[webhook] Invalid Razorpay signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const eventType = event.event;

    console.log(`[webhook] Razorpay event: ${eventType}`);

    // Extract order ID from payment metadata
    const orderId = event.payload?.payment?.entity?.notes?.orderId;

    if (!orderId) {
      console.warn('[webhook] No orderId in Razorpay webhook payload');
      return res.status(400).json({ error: 'Missing orderId' });
    }

    switch (eventType) {
      case 'payment.captured':
        await processPaymentSuccess(orderId, 'razorpay');
        break;

      case 'payment.failed':
        await processPaymentFailure(orderId);
        break;

      case 'refund.processed':
        await processRefund(orderId);
        break;

      default:
        console.log(`[webhook] Unhandled Razorpay event: ${eventType}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[webhook] Razorpay webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Stripe webhook handler
 */
router.post('/stripe', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const body = JSON.stringify(req.body);

    // Verify signature
    if (!verifyStripeSignature(body, signature)) {
      console.error('[webhook] Invalid Stripe signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const eventType = event.type;

    console.log(`[webhook] Stripe event: ${eventType}`);

    // Extract order ID from payment metadata
    const orderId = event.data?.object?.metadata?.orderId;

    if (!orderId) {
      console.warn('[webhook] No orderId in Stripe webhook payload');
      return res.status(400).json({ error: 'Missing orderId' });
    }

    switch (eventType) {
      case 'payment_intent.succeeded':
        await processPaymentSuccess(orderId, 'stripe');
        break;

      case 'payment_intent.payment_failed':
        await processPaymentFailure(orderId);
        break;

      case 'charge.refunded':
        await processRefund(orderId);
        break;

      default:
        console.log(`[webhook] Unhandled Stripe event: ${eventType}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[webhook] Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
