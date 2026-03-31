import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from './queue';
import { processScheduledRefunds } from '../services/refund/refundProcessor.service';

export const refundProcessorQueue = redisConnection
  ? new Queue('refund-processor', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: false,
      },
    })
  : null;

/**
 * Worker to process scheduled refunds
 */
export function startRefundProcessorWorker() {
  if (!redisConnection) {
    console.warn('[Refund Processor] Redis not available — worker disabled');
    return null;
  }

  const worker = new Worker(
    'refund-processor',
    async (job: Job) => {
      console.log(`[Refund Processor] Starting job ${job.id}`);
      await processScheduledRefunds();
      console.log(`[Refund Processor] Completed job ${job.id}`);
    },
    {
      connection: redisConnection,
      concurrency: 1,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Refund Processor] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Refund Processor] Job ${job?.id} failed:`, err);
  });

  return worker;
}

/**
 * Register repeat job to run every hour
 */
export async function registerRefundProcessorJob() {
  if (!refundProcessorQueue) {
    console.warn('[Refund Processor] Redis not available — skipping job registration');
    return;
  }

  const repeatJobs = await refundProcessorQueue.getRepeatableJobs();
  for (const job of repeatJobs) {
    await refundProcessorQueue.removeRepeatableByKey(job.key);
  }

  await refundProcessorQueue.add(
    'process-scheduled-refunds',
    {},
    {
      repeat: {
        pattern: '0 * * * *',
      },
    }
  );

  console.log('[Refund Processor] Scheduled job registered (runs hourly)');
}
