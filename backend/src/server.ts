import 'dotenv/config';
import { validateEnv } from './config/validateEnv';

validateEnv();

try {
  if (process.env.SENTRY_DSN) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    });
  }
} catch {
  console.warn('[sentry] optional package not installed');
}

import { createApp } from './app';
import { startScheduledJobs } from './jobs/scheduler';
import { startWorkers, registerRepeatJobs } from './jobs/queue';

const PORT = Number(process.env.PORT) || 4000;

const app = createApp();

startScheduledJobs();
startWorkers();
registerRepeatJobs().catch(err => console.error('[bullmq] registerRepeatJobs', err));

app.listen(PORT, () => {
  console.log(`\nZyloShipping backend running on :${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health\n`);
});
