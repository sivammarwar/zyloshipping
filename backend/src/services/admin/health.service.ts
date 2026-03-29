import algoliasearch from 'algoliasearch';
import { prisma } from '../../db/prisma';
import { redis } from '../../utils/redis';
import { getOrderAutomationQueue } from '../../jobs/queue';

export type ServiceHealth = 'UP' | 'DOWN' | 'DEGRADED';

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p.then(v => v),
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
  ]);
}

async function pingHttp(url: string, init?: RequestInit): Promise<ServiceHealth> {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 2500);
    const r = await fetch(url, { ...init, signal: ac.signal });
    clearTimeout(t);
    return r.ok || r.status === 401 || r.status === 403 ? 'UP' : 'DEGRADED';
  } catch {
    return 'DOWN';
  }
}

export async function getAdminHealthSnapshot() {
  const lastChecked = new Date();

  const [dbOk, redisOk, algoliaOk, rzOk, stOk, aeOk, cjOk, ashOk, resendOk, oaiOk] =
    await Promise.all([
      withTimeout(
        prisma.$queryRaw`SELECT 1`.then(() => true),
        3000
      ).then(v => (v ? 'UP' : 'DOWN') as ServiceHealth),
      withTimeout(
        (async () => {
          if (!redis) return null;
          await redis.set('__zylo_health__', '1', { ex: 5 });
          return true;
        })(),
        3000
      ).then(v => (v === true ? 'UP' : v === null ? 'DEGRADED' : 'DOWN') as ServiceHealth),
      withTimeout(
        (async () => {
          const appId = process.env.ALGOLIA_APP_ID;
          const key = process.env.ALGOLIA_ADMIN_KEY;
          if (!appId || !key) return 'DEGRADED' as const;
          const c = algoliasearch(appId, key);
          const indexName = process.env.ALGOLIA_INDEX_NAME || 'products';
          await c.initIndex(indexName).search('', { hitsPerPage: 1 });
          return 'UP' as const;
        })(),
        4000
      ).then(v => v ?? ('DOWN' as const)),
      process.env.RAZORPAY_KEY_ID
        ? pingHttp('https://api.razorpay.com/v1/payments?count=1', {
            headers: {
              Authorization:
                'Basic ' +
                Buffer.from(
                  `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET || ''}`
                ).toString('base64'),
            },
          })
        : Promise.resolve('DEGRADED' as ServiceHealth),
      process.env.STRIPE_SECRET_KEY
        ? pingHttp('https://api.stripe.com/v1/charges?limit=1', {
            headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
          })
        : Promise.resolve('DEGRADED' as ServiceHealth),
      process.env.ALIEXPRESS_API_KEY || process.env.ALIEXPRESS_APP_KEY
        ? pingHttp('https://api-sg.aliexpress.com/sync', { method: 'HEAD' }).catch(() =>
            pingHttp('https://api-sg.aliexpress.com')
          )
        : Promise.resolve('DEGRADED' as ServiceHealth),
      process.env.CJ_API_KEY ? pingHttp('https://developers.cjdropshipping.com') : Promise.resolve('DEGRADED' as ServiceHealth),
      process.env.AFTERSHIP_API_KEY
        ? pingHttp('https://api.aftership.com/v4/trackings', {
            headers: { 'aftership-api-key': process.env.AFTERSHIP_API_KEY },
          })
        : Promise.resolve('DEGRADED' as ServiceHealth),
      process.env.RESEND_API_KEY
        ? pingHttp('https://api.resend.com/domains', {
            headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          })
        : Promise.resolve('DEGRADED' as ServiceHealth),
      process.env.OPENAI_API_KEY
        ? pingHttp('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          })
        : Promise.resolve('DEGRADED' as ServiceHealth),
    ]);

  const q = getOrderAutomationQueue();
  let activeJobs = 0;
  let failedJobs = 0;
  const queueDepths: Record<string, number> = {};

  if (q) {
    const c = await q.getJobCounts('active', 'delayed', 'waiting', 'failed', 'completed');
    activeJobs = (c.active ?? 0) + (c.delayed ?? 0) + (c.waiting ?? 0);
    failedJobs = c.failed ?? 0;
    queueDepths.zylo = activeJobs;
  }

  return {
    services: {
      database: dbOk,
      redis: redisOk,
      algolia: algoliaOk,
      aliexpress: aeOk,
      cjDropshipping: cjOk,
      razorpay: rzOk,
      stripe: stOk,
      aftership: ashOk,
      resend: resendOk,
      openai: oaiOk,
    },
    uptime: Math.floor(process.uptime()),
    lastChecked,
    activeJobs,
    failedJobs,
    queueDepths,
  };
}
