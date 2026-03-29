import { prisma } from '../../db/prisma';
import { redis } from '../../utils/redis';
import algoliasearch from 'algoliasearch';

export type ServiceProbe = 'connected' | 'error';

export async function getPublicHealthPayload(): Promise<{
  status: string;
  timestamp: string;
  version: string;
  services: {
    database: ServiceProbe;
    redis: ServiceProbe;
    algolia: ServiceProbe;
  };
}> {
  const services = {
    database: 'error' as ServiceProbe,
    redis: 'error' as ServiceProbe,
    algolia: 'error' as ServiceProbe,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    services.database = 'connected';
  } catch {
    services.database = 'error';
  }

  try {
    if (redis) {
      await redis.set('__health__', '1', { ex: 5 });
      services.redis = 'connected';
    } else {
      services.redis = 'error';
    }
  } catch {
    services.redis = 'error';
  }

  try {
    const appId = process.env.ALGOLIA_APP_ID;
    const key = process.env.ALGOLIA_ADMIN_KEY || process.env.ALGOLIA_API_KEY;
    if (appId && key) {
      const c = algoliasearch(appId, key);
      const indexName = process.env.ALGOLIA_INDEX_NAME || 'products';
      await c.initIndex(indexName).search('', { hitsPerPage: 1 });
      services.algolia = 'connected';
    }
  } catch {
    services.algolia = 'error';
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services,
  };
}
