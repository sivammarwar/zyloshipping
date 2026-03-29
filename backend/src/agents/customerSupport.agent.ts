import { prisma } from '../db/prisma';
import { invokeGpt4o } from './llm';

export async function runCustomerSupportAgent(input: { message: string; userId: string; orderId?: string }) {
  let ctx = '';
  if (input.orderId) {
    const o = await prisma.order.findFirst({
      where: { id: input.orderId, userId: input.userId },
      select: { orderNumber: true, status: true, totalAmount: true },
    });
    if (o) ctx = JSON.stringify(o);
  }
  const { text } = await invokeGpt4o(
    'customer_support',
    'ZyloShipping AI support. Use store policies: 7-day returns, tracked shipping, SSL checkout. Reply in under 120 words.',
    `Order context: ${ctx}\nUser message: ${input.message}`
  );
  return text;
}
