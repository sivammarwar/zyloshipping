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
import { 
  rateLimitGeneral, 
  rateLimitAuth, 
  rateLimitPayment, 
  rateLimitAdmin 
} from './middleware/rateLimit.middleware';
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
import socialMediaRoutes from './routes/socialMedia.routes';

function parseOrigins(): string[] {
  const raw = [
    process.env.CORS_ORIGINS,
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ]
    .filter(Boolean)
    .join(',');

  const list = raw
    .split(',')
    .map(s => s.trim().replace(/\/$/, '')) // strip trailing slashes
    .filter(Boolean);

  const defaults = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  const origins = [...new Set([...list, ...defaults])];
  console.log('[cors] allowedOrigins:', origins);
  return origins;
}

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);

  app.use(requestIdMiddleware);

  const allowedOrigins = parseOrigins();

  const cspDirectives = {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: [
      "'self'",
      ...(allowedOrigins.filter(o => o.startsWith('http'))),
    ].filter(Boolean),
  };

  app.use(
    helmet({
      contentSecurityPolicy: { directives: cspDirectives as Record<string, string[]> },
      crossOriginEmbedderPolicy: false,
    })
  );

  // Handle OPTIONS preflight explicitly before cors middleware
  app.options('*', (req: Request, res: Response) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-Id,X-Admin,Cookie');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    res.sendStatus(204);
  });

  app.use(
    cors({
      origin(origin, callback) {
        // Allow requests with no origin (server-to-server, curl, mobile)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.warn('[cors] Blocked origin:', origin);
        return callback(new Error(`CORS: origin ${origin} not allowed`));
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

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Apply specific rate limiters to different route groups
  app.use('/api/auth', rateLimitAuth, authRoutes);
  app.use('/api/payments', rateLimitPayment, paymentRoutes);
  app.use('/api/admin', rateLimitAdmin, adminRoutes);
  app.use('/api/admin/social-media', rateLimitAdmin, socialMediaRoutes);
  app.use('/api/webhooks', webhookRoutes); // No rate limit on webhooks
  
  // General rate limiter for all other routes
  app.use('/api/products', rateLimitGeneral, productRoutes);
  app.use('/api/orders', rateLimitGeneral, orderRoutes);
  app.use('/api/cart', rateLimitGeneral, cartRoutes);
  app.use('/api/suppliers', rateLimitGeneral, supplierRoutes);
  app.use('/api/support', rateLimitGeneral, supportRoutes);
  app.use('/api/reviews', rateLimitGeneral, reviewRoutes);

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