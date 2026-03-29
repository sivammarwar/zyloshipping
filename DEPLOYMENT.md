# ZyloShipping Deployment Guide

## Quick Start with Docker Compose

For local development with all services:

```bash
docker-compose up -d
```

This starts PostgreSQL, Redis, backend, and frontend with hot reload enabled.

## Production Deployment

### Backend (Railway / Render / DigitalOcean)

#### 1. Database Setup
- Create PostgreSQL 16+ instance
- Note connection string for `DATABASE_URL`
- Enable connection pooling if available

#### 2. Redis Setup
- Create Redis 7+ instance
- Note connection string for `REDIS_URL`

#### 3. Environment Variables

Set all variables from `backend/.env.example`:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Min 32 characters, cryptographically random
- `JWT_REFRESH_SECRET` - Different from JWT_SECRET
- `GROQ_API_KEY` - Get from https://console.groq.com
- `FRONTEND_URL` - Your frontend URL for CORS

**Payment Gateways:**
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`

**Search & Email:**
- `ALGOLIA_APP_ID`, `ALGOLIA_ADMIN_KEY`, `ALGOLIA_SEARCH_KEY`
- `RESEND_API_KEY`

**Optional but Recommended:**
- `OPENAI_API_KEY` - Fallback when Groq fails
- `AFTERSHIP_API_KEY` - Shipment tracking
- `ALIEXPRESS_API_KEY` - Product sourcing
- `CJ_DROPSHIPPING_API_KEY` - Product sourcing

#### 4. Build & Deploy

**Using Docker:**
```bash
cd backend
docker build -t zyloshipping-backend .
docker run -p 4000:4000 --env-file .env zyloshipping-backend
```

**Using Railway:**
1. Connect GitHub repository
2. Set environment variables in Railway dashboard
3. Railway auto-detects Dockerfile
4. Set health check: `GET /health`
5. Deploy

**Using Render:**
1. Create new Web Service
2. Connect repository
3. Set build command: `cd backend && npm install && npm run build`
4. Set start command: `cd backend && node dist/index.js`
5. Add environment variables
6. Deploy

#### 5. Database Migration

After first deployment:
```bash
npx prisma db push
npx prisma db seed
```

### Frontend (Vercel)

#### 1. Connect Repository
- Import project to Vercel
- Select `frontend` as root directory

#### 2. Environment Variables

Set in Vercel dashboard:
- `NEXT_PUBLIC_BACKEND_URL` - Your backend API URL (e.g., https://api.zyloshipping.com)
- `NEXT_PUBLIC_APP_URL` - Your frontend URL (e.g., https://zyloshipping.com)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Razorpay public key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key

#### 3. Build Settings

Vercel auto-detects Next.js. Verify:
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`

#### 4. Deploy

Click "Deploy" - Vercel handles the rest.

## Post-Deployment Checklist

### Backend
- [ ] Health check returns 200: `curl https://your-api.com/health`
- [ ] Database connected (check health endpoint)
- [ ] Redis connected (check health endpoint)
- [ ] Admin login works: POST `/api/auth/login`
- [ ] Webhook endpoints configured in Stripe/Razorpay dashboards
- [ ] CORS allows frontend domain

### Frontend
- [ ] Homepage loads
- [ ] Products page fetches from API
- [ ] Admin dashboard accessible at `/dashboard`
- [ ] Login redirects properly
- [ ] API calls use correct backend URL

### Security
- [ ] HTTPS enabled on both frontend and backend
- [ ] JWT secrets are strong (32+ chars)
- [ ] Database credentials rotated from defaults
- [ ] Admin password changed from seed default
- [ ] CORS restricted to production domains only
- [ ] Rate limiting active (check Redis)

### Monitoring
- [ ] Set up error tracking (Sentry recommended)
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Database backup schedule configured

## Scaling Considerations

### Backend Horizontal Scaling
The backend is stateless and can scale horizontally:
- Session data in Redis (shared across instances)
- File uploads should use S3/R2, not local filesystem
- Job queue (BullMQ) shares Redis

### Database
- Enable connection pooling (PgBouncer)
- Set `connection_limit=1` in DATABASE_URL for serverless
- Use read replicas for analytics queries

### Redis
- Use Redis Cluster for high availability
- Separate Redis instances for cache vs. queue if needed

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` format
- Verify database accepts connections from your deployment IP
- Check connection pooling settings

### "Redis connection failed"
- Verify `REDIS_URL` format
- Check Redis instance is running
- Verify network access

### "CORS error in browser"
- Add frontend URL to `FRONTEND_URL` env var
- Check backend logs for CORS rejections
- Verify credentials: 'include' in frontend API calls

### "Webhook signature verification failed"
- Ensure `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook endpoint URL in payment gateway dashboard
- Verify webhook is hitting correct endpoint

### "Products not syncing"
- Check supplier API keys are valid
- Verify `ALIEXPRESS_API_KEY` and `CJ_DROPSHIPPING_API_KEY`
- Check backend logs for sync errors
- Manually trigger: POST `/api/admin/products/sync`

## Environment-Specific Notes

### Development
- Use `NODE_ENV=development`
- Webhook signature verification is relaxed
- Detailed error messages shown

### Production
- Use `NODE_ENV=production`
- Strict webhook verification
- Generic error messages to clients
- All secrets required

## Support

For issues:
1. Check backend logs
2. Verify all environment variables are set
3. Test health endpoint
4. Check database and Redis connectivity
