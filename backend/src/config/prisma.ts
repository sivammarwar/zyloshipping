// backend/src/db/prisma.ts
// Singleton Prisma client — import this everywhere instead of new PrismaClient()
// Prevents connection pool exhaustion in development hot-reloads

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Use DATABASE_URL as provided by Railway (already includes SSL if needed)
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[prisma] CRITICAL: DATABASE_URL not set!');
} else {
  console.log('[prisma] DATABASE_URL configured (length:', DATABASE_URL.length, ')');
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

// Connection pool management for Railway (prevents ECONNRESET)
console.log('[prisma] Connecting to database...');
prisma.$connect()
  .then(() => console.log('[prisma] Database connected successfully'))
  .catch((err) => {
    console.error('[prisma] Initial connection failed:', err.message);
    console.error('[prisma] Error code:', err.code);
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