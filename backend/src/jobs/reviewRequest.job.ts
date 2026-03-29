import { prisma } from '../db/prisma';
import { sendReviewRequestEmail } from '../services/notification/email.service';

export async function runReviewRequestJob(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });
  if (!order) return;
  if (!order.items?.length) return;
  await sendReviewRequestEmail(order);
}
