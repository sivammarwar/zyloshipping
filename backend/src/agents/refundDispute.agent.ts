import { prisma } from '../db/prisma';
import { invokeGpt4o } from './llm';

export async function runRefundDisputeAgent(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true, items: true },
  });
  if (!order) return { approve: false, reason: 'Order not found' };

  const { text } = await invokeGpt4o(
    'refund_dispute',
    'Decide if refund should be auto-approved. Return JSON { approve: boolean, reason: string }.',
    JSON.stringify({ status: order.status, total: order.totalAmount, hasPayment: !!order.payment })
  );
  try {
    return JSON.parse(text) as { approve: boolean; reason: string };
  } catch {
    return { approve: false, reason: 'parse error' };
  }
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
