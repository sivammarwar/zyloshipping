import { Queue } from 'bullmq';

// Redis disabled for Railway - no REDIS_URL configured
const connection = null;
export const redisConnection = connection;

export const productQueue: Queue | null = null;
export const emailQueue: Queue | null = null;

export function getOrderAutomationQueue(): Queue | null {
  return null;
}

export async function registerRepeatJobs(): Promise<void> {
  // Jobs disabled - no Redis
  console.log('[Queue] Background jobs disabled (no Redis)');
}

export function startWorkers(): void {
  console.log('[bullmq] Workers disabled (no Redis)');
}
