import { prisma } from '../../db/prisma';
import Razorpay from 'razorpay';
import Stripe from 'stripe';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * Calculate 2 working days from approval date (excluding weekends)
 */
export function calculateScheduledDate(approvalDate: Date): Date {
  const scheduled = new Date(approvalDate);
  let workingDaysAdded = 0;

  while (workingDaysAdded < 2) {
    scheduled.setDate(scheduled.getDate() + 1);
    const dayOfWeek = scheduled.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDaysAdded++;
    }
  }

  // Set to 10 AM on the scheduled day
  scheduled.setHours(10, 0, 0, 0);
  return scheduled;
}

/**
 * Process refund via Razorpay
 */
async function processRazorpayRefund(
  paymentId: string,
  amount: number
): Promise<{ refundId: string; status: string }> {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // Convert to paise
      speed: 'normal',
    });

    return {
      refundId: refund.id,
      status: refund.status,
    };
  } catch (error: any) {
    console.error('[Razorpay Refund] Error:', error);
    throw new Error(`Razorpay refund failed: ${error.message}`);
  }
}

/**
 * Process refund via Stripe
 */
async function processStripeRefund(
  paymentIntentId: string,
  amount: number
): Promise<{ refundId: string; status: string }> {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100), // Convert to cents
    });

    return {
      refundId: refund.id,
      status: refund.status ?? 'pending',
    };
  } catch (error: any) {
    console.error('[Stripe Refund] Error:', error);
    throw new Error(`Stripe refund failed: ${error.message}`);
  }
}

/**
 * Process a single refund request
 */
export async function processRefundRequest(refundRequestId: string): Promise<void> {
  const refundRequest = await prisma.refundRequest.findUnique({
    where: { id: refundRequestId },
  });

  if (!refundRequest) {
    throw new Error('Refund request not found');
  }

  if (refundRequest.status !== 'APPROVED' && refundRequest.status !== 'SCHEDULED') {
    throw new Error(`Cannot process refund with status: ${refundRequest.status}`);
  }

  // Update status to PROCESSING
  await prisma.refundRequest.update({
    where: { id: refundRequestId },
    data: { status: 'PROCESSING' },
  });

  try {
    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { orderId: refundRequest.orderId },
    });

    if (!payment) {
      throw new Error('Payment not found for order');
    }

    let refundResult: { refundId: string; status: string };

    // Process refund based on gateway
    if (payment.gateway === 'razorpay') {
      refundResult = await processRazorpayRefund(
        payment.gatewayPaymentId,
        refundRequest.amount
      );
    } else if (payment.gateway === 'stripe') {
      refundResult = await processStripeRefund(
        payment.gatewayPaymentId,
        refundRequest.amount
      );
    } else {
      throw new Error(`Unsupported payment gateway: ${payment.gateway}`);
    }

    // Update refund request as completed
    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: 'COMPLETED',
        refundId: refundResult.refundId,
        processedAt: new Date(),
      },
    });

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'refunded',
        refundId: refundResult.refundId,
        refundAmount: refundRequest.amount,
        refundedAt: new Date(),
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: refundRequest.orderId },
      data: { status: 'REFUNDED' },
    });

    // Reverse commission
    const commission = await prisma.commission.findUnique({
      where: { orderId: refundRequest.orderId },
    });

    if (commission) {
      await prisma.commission.update({
        where: { id: commission.id },
        data: {
          netCommission: 0,
          revenue: 0,
        },
      });
    }

    // Restore stock for order items
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: refundRequest.orderId },
    });

    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: { increment: item.quantity },
        },
      });
    }

    console.log(`[Refund] Successfully processed refund ${refundRequestId}`);

    // Send refund completed email
    try {
      const { sendRefundCompletedEmail } = await import('../email/refundCompleted');
      await sendRefundCompletedEmail(refundRequest.orderId, refundRequest.amount);
    } catch (emailError) {
      console.error('[Refund] Email notification failed:', emailError);
    }
  } catch (error: any) {
    console.error(`[Refund] Processing failed for ${refundRequestId}:`, error);

    // Update status to FAILED
    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: 'FAILED',
        adminNotes: `Processing failed: ${error.message}`,
      },
    });

    throw error;
  }
}

/**
 * Process all scheduled refunds (called by cron job)
 */
export async function processScheduledRefunds(): Promise<void> {
  const now = new Date();

  // Find all approved/scheduled refunds that are due for processing
  const dueRefunds = await prisma.refundRequest.findMany({
    where: {
      status: { in: ['APPROVED', 'SCHEDULED'] },
      scheduledFor: { lte: now },
    },
    orderBy: { scheduledFor: 'asc' },
    take: 50, // Process in batches
  });

  console.log(`[Refund Processor] Found ${dueRefunds.length} refunds to process`);

  for (const refund of dueRefunds) {
    try {
      await processRefundRequest(refund.id);
    } catch (error) {
      console.error(`[Refund Processor] Failed to process ${refund.id}:`, error);
      // Continue with next refund
    }
  }
}
