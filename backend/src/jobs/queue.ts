import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { handleOrderSubmissionJob } from './orderSubmission.job';
import { runInventorySyncJob } from './inventorySync.job';
import { runProductIngestionJob } from './productIngestion.job';
import { runReviewRequestJob } from './reviewRequest.job';
import { runOrderCompletionJob } from './orderCompletion.job';
import { runHealthMonitorJob } from './healthMonitor.job';
import { runPricingUpdateJob } from './pricingUpdate.job';
import { runTrackingPollerJob } from './trackingPoller.job';
import { runAbandonedCartJob } from './abandonedCart.job';

const url = process.env.REDIS_URL;
const connection = url
  ? new IORedis(url, { maxRetriesPerRequest: null })
  : null;

const QUEUE_NAME = 'zylo';

export const productQueue = connection ? new Queue('products', { connection }) : null;
export const emailQueue = connection ? new Queue('emails', { connection }) : null;

let automationQueue: Queue | null = null;

export function getOrderAutomationQueue(): Queue | null {
  if (!connection) return null;
  if (!automationQueue) {
    automationQueue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnFail: false,
      },
    });
  }
  return automationQueue;
}

async function processAutomationJob(job: {
  name: string;
  data: { orderId?: string; supplierId?: string; userId?: string; cartId?: string };
}): Promise<void> {
  switch (job.name) {
    case 'orderSubmission':
      if (job.data.orderId) await handleOrderSubmissionJob(job.data.orderId);
      break;
    case 'reviewRequest':
      if (job.data.orderId) await runReviewRequestJob(job.data.orderId);
      break;
    case 'orderCompletion':
      if (job.data.orderId) await runOrderCompletionJob(job.data.orderId);
      break;
    case 'inventorySync':
      await runInventorySyncJob(job.data.supplierId);
      break;
    case 'productIngestion':
      await runProductIngestionJob();
      break;
    case 'healthMonitor':
      await runHealthMonitorJob();
      break;
    case 'pricingUpdate':
      await runPricingUpdateJob();
      break;
    case 'trackingPoller':
      await runTrackingPollerJob();
      break;
    case 'abandonedCart':
      if (job.data.userId && job.data.cartId) {
        await runAbandonedCartJob(job.data.userId, job.data.cartId);
      }
      break;
    default:
      console.warn('[bullmq] unknown job', job.name);
  }
}

export async function registerRepeatJobs(): Promise<void> {
  const q = getOrderAutomationQueue();
  if (!q) return;

  const every = (min: number) => min * 60 * 1000;
  const hour = 60 * 60 * 1000;

  await q.add('inventorySync', {}, { repeat: { every: 2 * hour }, jobId: 'repeat-inventory-sync' });
  await q.add('productIngestion', {}, { repeat: { every: 6 * hour }, jobId: 'repeat-product-ingestion' });
  await q.add('healthMonitor', {}, { repeat: { every: every(5) }, jobId: 'repeat-health' });
  await q.add('pricingUpdate', {}, { repeat: { every: hour }, jobId: 'repeat-pricing' });
  await q.add('trackingPoller', {}, { repeat: { every: 30 * 60 * 1000 }, jobId: 'repeat-tracking-poller' });
}

export function startWorkers() {
  if (!connection) {
    console.warn('[bullmq] REDIS_URL not set — background workers disabled');
    return;
  }

  new Worker(
    'products',
    async job => {
      console.log('[worker] product job', job.name, job.id);
    },
    { connection }
  );

  new Worker(
    QUEUE_NAME,
    async job => {
      await processAutomationJob(job as { name: string; data: { orderId?: string; supplierId?: string } });
    },
    { connection }
  );

  const ev = new QueueEvents(QUEUE_NAME, { connection });
  ev.on('failed', ({ jobId, failedReason }) => {
    console.error('[bullmq] job failed', jobId, failedReason);
  });
}
