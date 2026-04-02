import 'dotenv/config';

// Global error handlers to catch crashes
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

import { validateEnv } from './config/validateEnv';

console.log('[server] Validating environment...');
validateEnv();
console.log('[server] Environment validated');

console.log('[server] Initializing Sentry (if configured)...');
try {
  if (process.env.SENTRY_DSN && !process.env.SENTRY_DSN.includes('your-sentry-dsn')) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    });
    console.log('[server] Sentry initialized');
  } else {
    console.log('[server] Sentry skipped (not configured)');
  }
} catch (err) {
  console.warn('[server] Sentry init error:', err);
}

console.log('[server] Loading app modules...');
import { createApp } from './app';
import { startScheduledJobs } from './jobs/scheduler';
import { startWorkers, registerRepeatJobs } from './jobs/queue';

console.log('[server] Creating Express app...');
const PORT = Number(process.env.PORT) || 4000;
const app = createApp();

console.log('[server] Starting background services...');
startScheduledJobs();
startWorkers();
registerRepeatJobs().catch(err => console.error('[bullmq] registerRepeatJobs', err));

console.log('[server] Starting HTTP server...');
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✓ ZyloShipping backend running on :${PORT}`);
  console.log(`✓ Health: http://localhost:${PORT}/health\n`);
});

server.on('error', (err) => {
  console.error('[FATAL] Server error:', err);
});
