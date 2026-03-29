import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';

import { apiLimiter } from './middleware/rateLimiter.middleware';
import { redisApiLimiter } from './middleware/redisRateLimiter.middleware';
import { requestIdMiddleware, RequestWithId } from './middleware/requestId.middleware';
import { getPublicHealthPayload } from './services/health/publicHealth.service';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/products.routes';
import orderRoutes from './routes/orders.routes';
import cartRoutes from './routes/cart.routes';
import paymentRoutes from './routes/payment.routes';
import supplierRoutes from './routes/suppliers.routes';
import webhookRoutes from './routes/webhook.routes';
import adminRoutes from './routes/admin.routes';
import supportRoutes from './routes/support.routes';
import reviewRoutes from './routes/reviews.routes';

function parseOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS || process.env.NEXT_PUBLIC_APP_URL || '';
  const list = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const defaults = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  return [...new Set([...list, ...defaults])];
}

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);

  app.use(requestIdMiddleware);

  const cspDirectives = {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: [
      "'self'",
      ...(parseOrigins().filter(o => o.startsWith('http'))),
    ].filter(Boolean),
  };

  app.use(
    helmet({
      contentSecurityPolicy: { directives: cspDirectives as Record<string, string[]> },
      crossOriginEmbedderPolicy: false,
    })
  );

  const allowedOrigins = parseOrigins();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Request-Id',
        'X-Admin',
        'Cookie',
      ],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 86400,
    })
  );

  app.use(compression());

  morgan.token('req-id', (req: Request) => (req as RequestWithId).requestId || '-');
  app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms :req-id', {
      skip: (req: Request) => req.path === '/health',
    })
  );

  app.use('/api/webhooks', express.raw({ type: 'application/json' }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/health', async (_req, res, next) => {
    try {
      const payload = await getPublicHealthPayload();
      res.json(payload);
    } catch (e) {
      next(e);
    }
  });

  const limiter = process.env.UPSTASH_REDIS_REST_URL ? redisApiLimiter : apiLimiter;
  app.use('/api', limiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/suppliers', supplierRoutes);
  app.use('/api/webhooks', webhookRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/reviews', reviewRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

  app.use((err: Error, _req: express.Request, res: express.Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
      error: 'Internal server error',
      ...(isDev ? { message: err.message } : {}),
    });
  });

  return app;
}
