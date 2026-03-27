import express    from 'express';
import cors       from 'cors';
import helmet     from 'helmet';
import dotenv     from 'dotenv';
dotenv.config();

import productRoutes  from './routes/products.routes';
import orderRoutes    from './routes/orders.routes';
import paymentRoutes  from './routes/payments.routes';
import upiRoutes      from './routes/upi.routes';
import supplierRoutes from './routes/suppliers.routes';
import webhookRoutes  from './routes/webhooks.routes';
import adminRoutes    from './routes/admin.routes';
import authRoutes     from './routes/auth.routes';
import supportRoutes  from './routes/support.routes';

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.NEXT_PUBLIC_APP_URL }));

// Raw body needed for webhook signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'zyloshipping-backend', timestamp: new Date() })
);

app.use('/api/auth',      authRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/payments/upi', upiRoutes);   // UPI-specific routes
app.use('/api/suppliers', supplierRoutes);
app.use('/api/webhooks',  webhookRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/support',   supportRoutes);

app.listen(PORT, () =>
  console.log(`ZyloShipping backend running on :${PORT}`)
);

export default app;
