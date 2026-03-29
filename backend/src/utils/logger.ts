type Level = 'info' | 'warn' | 'error' | 'debug';

function log(level: Level, scope: string, msg: string, meta?: Record<string, unknown>) {
  const line = `[${new Date().toISOString()}] [${scope}] ${msg}`;
  if (meta && Object.keys(meta).length) {
    console[level === 'debug' ? 'log' : level](line, meta);
  } else {
    console[level === 'debug' ? 'log' : level](line);
  }
}

export const paymentLogger = {
  info: (msg: string, meta?: Record<string, unknown>) => log('info', 'payment', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', 'payment', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', 'payment', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) =>
    process.env.NODE_ENV === 'development' ? log('debug', 'payment', msg, meta) : undefined,
};
