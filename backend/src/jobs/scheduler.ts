import cron from 'node-cron';
import { ProductStatus } from '@prisma/client';
import { prisma } from '../db/prisma';

/**
 * Lightweight cron for tasks not moved to BullMQ repeat jobs.
 * Heavy automation uses REDIS_URL + registerRepeatJobs in queue.ts.
 */
export function startScheduledJobs() {
  cron.schedule('0 */2 * * *', async () => {
    await prisma.product.updateMany({
      where: { stockQuantity: 0 },
      data: { status: ProductStatus.HIDDEN },
    });
  });
}
