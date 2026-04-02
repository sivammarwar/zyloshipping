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
  });

// Connection pool management for Railway (prevents ECONNRESET)
prisma.$connect().catch((err) => {
  console.error('[prisma] Initial connection failed:', err);
});

// Handle process signals for clean shutdown
process.on('SIGTERM', async () => {
  console.log('[prisma] SIGTERM received, disconnecting...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[prisma] SIGINT received, disconnecting...');
  await prisma.$disconnect();
  process.exit(0);
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;