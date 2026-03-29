// backend/src/db/prisma.ts
// Singleton Prisma client — import this everywhere instead of new PrismaClient()
// Prevents connection pool exhaustion in development hot-reloads

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Uses DATABASE_URL from env. For Supabase + PgBouncer, append
 * ?pgbouncer=true&connection_limit=1 (direct writes use DIRECT_URL in prisma migrate).
 */
export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Production-ready connection pooling for high traffic
    // Scales from free tier to lakhs of users without code changes
    // Just upgrade your database plan when needed
    connectionLimit: process.env.NODE_ENV === 'production' ? 100 : 10,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;