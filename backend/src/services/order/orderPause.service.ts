import { prisma } from '../../db/prisma';
import { sendAlertEmail } from '../email.service';

export async function pauseOrderAutomation(orderId: string, detail: string): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: { automationPausedAt: new Date() },
  });
  await sendAlertEmail(`Order automation paused: ${orderId}`, detail).catch(() => {});
}

export async function resumeOrderAutomation(orderId: string): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: { automationPausedAt: null },
  });
  const { getOrderAutomationQueue } = await import('../../jobs/queue');
  const q = getOrderAutomationQueue();
  if (q) {
    await q.add(
      'orderSubmission',
      { orderId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnFail: false,
      }
    );
  }
}
