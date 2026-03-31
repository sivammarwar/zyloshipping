import { prisma } from '../db/prisma';
import { invokeGpt4o } from './llm';
import { calculateScheduledDate } from '../services/refund/refundProcessor.service';

interface RefundEvaluationResult {
  decision: 'AUTO_APPROVE' | 'AUTO_REJECT' | 'MANUAL_REVIEW';
  reason: string;
  riskScore: number;
}

/**
 * Evaluate refund request with AI and fraud detection
 */
export async function evaluateRefundRequest(
  orderId: string,
  reason: string
): Promise<RefundEvaluationResult> {
  // Fetch order with all related data
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true,
      items: { include: { product: true } },
      user: true,
    },
  });

  if (!order) {
    return {
      decision: 'AUTO_REJECT',
      reason: 'Order not found',
      riskScore: 100,
    };
  }

  // Check if order is eligible for refund
  if (!order.payment || order.payment.status !== 'captured') {
    return {
      decision: 'AUTO_REJECT',
      reason: 'Payment not captured or not found',
      riskScore: 100,
    };
  }

  // Check if already refunded
  if (order.status === 'REFUNDED') {
    return {
      decision: 'AUTO_REJECT',
      reason: 'Order already refunded',
      riskScore: 100,
    };
  }

  // Calculate days since order
  const daysSinceOrder = Math.floor(
    (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Auto-reject if beyond 30-day window
  if (daysSinceOrder > 30) {
    return {
      decision: 'AUTO_REJECT',
      reason: 'Refund request beyond 30-day window',
      riskScore: 80,
    };
  }

  // Check user refund history (fraud detection)
  const userRefundCount = await prisma.refundRequest.count({
    where: {
      userId: order.userId,
      status: { in: ['APPROVED', 'COMPLETED'] },
      createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
    },
  });

  // Flag suspicious patterns
  if (userRefundCount >= 3) {
    return {
      decision: 'MANUAL_REVIEW',
      reason: 'Multiple refunds in last 90 days - requires manual review',
      riskScore: 75,
    };
  }

  // Check if order was delivered recently (within 7 days)
  if (order.deliveredAt) {
    const daysSinceDelivery = Math.floor(
      (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDelivery > 14) {
      return {
        decision: 'MANUAL_REVIEW',
        reason: 'Refund requested more than 14 days after delivery',
        riskScore: 60,
      };
    }
  }

  // Use AI to evaluate refund reason
  const prompt = `You are a refund evaluation AI. Analyze this refund request and decide if it should be auto-approved.

Order Details:
- Order ID: ${order.orderNumber}
- Total Amount: ₹${order.totalAmount}
- Status: ${order.status}
- Days Since Order: ${daysSinceOrder}
- Delivered: ${order.deliveredAt ? 'Yes' : 'No'}
- User Refund History: ${userRefundCount} refunds in last 90 days

Refund Reason: "${reason}"

Rules for AUTO_APPROVE:
1. Order not yet shipped or delivered
2. Valid reason (damaged, wrong item, not as described)
3. Within 7 days of delivery
4. User has good history (< 3 refunds in 90 days)

Rules for AUTO_REJECT:
1. Frivolous reason (changed mind after 7 days)
2. Order completed > 14 days ago
3. Suspicious pattern

Rules for MANUAL_REVIEW:
1. High-value orders (> ₹5000)
2. Ambiguous reason
3. Borderline cases

Return JSON: { "decision": "AUTO_APPROVE" | "AUTO_REJECT" | "MANUAL_REVIEW", "reason": "explanation", "riskScore": 0-100 }`;

  try {
    const { text } = await invokeGpt4o(
      'refund_evaluation',
      'You are a refund evaluation AI. Analyze refund requests and make decisions.',
      prompt
    );

    const aiResult = JSON.parse(text) as RefundEvaluationResult;

    // Override AI decision for high-value orders
    if (order.totalAmount > 5000 && aiResult.decision === 'AUTO_APPROVE') {
      return {
        decision: 'MANUAL_REVIEW',
        reason: 'High-value order requires manual approval',
        riskScore: aiResult.riskScore,
      };
    }

    return aiResult;
  } catch (error) {
    console.error('[Refund Agent] AI evaluation failed:', error);
    // Default to manual review on error
    return {
      decision: 'MANUAL_REVIEW',
      reason: 'AI evaluation failed - requires manual review',
      riskScore: 50,
    };
  }
}

/**
 * Process refund request (called when user submits refund)
 */
export async function processRefundRequest(
  orderId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; message: string; refundRequestId?: string }> {
  // Check if refund request already exists
  const existingRequest = await prisma.refundRequest.findFirst({
    where: {
      orderId,
      status: { notIn: ['REJECTED', 'COMPLETED'] },
    },
  });

  if (existingRequest) {
    return {
      success: false,
      message: 'A refund request already exists for this order',
    };
  }

  // Get order details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });

  if (!order) {
    return { success: false, message: 'Order not found' };
  }

  // Evaluate refund request
  const evaluation = await evaluateRefundRequest(orderId, reason);

  // Create refund request
  const refundRequest = await prisma.refundRequest.create({
    data: {
      orderId,
      userId,
      reason,
      amount: order.totalAmount,
      status: evaluation.decision === 'AUTO_APPROVE' ? 'APPROVED' : 
              evaluation.decision === 'AUTO_REJECT' ? 'REJECTED' : 'MANUAL_REVIEW',
      approvalType: evaluation.decision === 'AUTO_APPROVE' ? 'AUTO' : undefined,
      approvedAt: evaluation.decision === 'AUTO_APPROVE' ? new Date() : undefined,
      scheduledFor: evaluation.decision === 'AUTO_APPROVE' 
        ? calculateScheduledDate(new Date()) 
        : undefined,
      gateway: order.payment?.gateway,
      rejectionReason: evaluation.decision === 'AUTO_REJECT' ? evaluation.reason : undefined,
      adminNotes: `AI Evaluation: ${evaluation.reason} (Risk Score: ${evaluation.riskScore})`,
    },
  });

  // Update order status
  if (evaluation.decision === 'AUTO_APPROVE') {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'REFUND_REQUESTED' },
    });
  }

  // Send appropriate email
  try {
    if (evaluation.decision === 'AUTO_APPROVE') {
      const { sendRefundApprovedEmail } = await import('../services/email/refundApproved');
      await sendRefundApprovedEmail(orderId, refundRequest.scheduledFor!);
    } else if (evaluation.decision === 'AUTO_REJECT') {
      const { sendRefundRejectedEmail } = await import('../services/email/refundRejected');
      await sendRefundRejectedEmail(orderId, evaluation.reason);
    } else {
      const { sendRefundUnderReviewEmail } = await import('../services/email/refundUnderReview');
      await sendRefundUnderReviewEmail(orderId);
    }
  } catch (emailError) {
    console.error('[Refund] Email notification failed:', emailError);
  }

  // Return result
  const messages = {
    AUTO_APPROVE: `Your refund has been approved! The amount will be refunded to your original payment method within 2 working days (by ${refundRequest.scheduledFor?.toLocaleDateString()}).`,
    AUTO_REJECT: `Your refund request has been rejected. Reason: ${evaluation.reason}`,
    MANUAL_REVIEW: 'Your refund request is under review. Our team will respond within 24 hours.',
  };

  return {
    success: true,
    message: messages[evaluation.decision],
    refundRequestId: refundRequest.id,
  };
}

/**
 * Legacy function for backward compatibility
 */
export async function runRefundDisputeAgent(orderId: string) {
  const evaluation = await evaluateRefundRequest(orderId, 'Customer requested refund');
  return {
    approve: evaluation.decision === 'AUTO_APPROVE',
    reason: evaluation.reason,
  };
}

/** Stripe Radar / chargebacks — draft merchant response (logged to ai_logs via invokeGpt4o). */
export async function runStripeDisputeDraftAgent(payload: {
  disputeId: string;
  chargeId: string;
  paymentIntentId?: string;
  reason: string | null;
  amount: number;
  currency: string;
}) {
  const { text } = await invokeGpt4o(
    'refund_dispute',
    'You are the Refund & Dispute Agent. Draft a concise chargeback response outline. Return JSON { draft: string, evidencePoints: string[] }.',
    JSON.stringify(payload)
  );
  try {
    return JSON.parse(text) as { draft: string; evidencePoints: string[] };
  } catch {
    return {
      draft: text,
      evidencePoints: [] as string[],
    };
  }
}
