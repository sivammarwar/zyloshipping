import { Queue, Worker } from 'bullmq';
import { Redis }         from '@upstash/redis';

const connection = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const productQueue  = new Queue('products',  { connection });
export const orderQueue    = new Queue('orders',    { connection });
export const emailQueue    = new Queue('emails',    { connection });
export const agentQueue    = new Queue('agents',    { connection });
export const trackingQueue = new Queue('tracking',  { connection });
