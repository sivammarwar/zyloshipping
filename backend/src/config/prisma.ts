// backend/src/db/prisma.ts
// Singleton Prisma client — import this everywhere instead of new PrismaClient()
// Prevents connection pool exhaustion in development hot-reloads

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Uses DATABASE_URL from env. Railway PostgreSQL requires SSL.
 */
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  
  // Railway PostgreSQL requires SSL
  if (url.includes('railway.app') || process.env.RAILWAY_ENVIRONMENT) {
    // Append sslmode=require if not already present
    if (!url.includes('sslmode=')) {
      return url.includes('?') ? `${url}&sslmode=require` : `${url}?sslmode=require`;
    }
  }
  return url;
};

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
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