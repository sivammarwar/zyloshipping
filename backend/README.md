# ZyloShipping backend

Production-oriented Express + TypeScript API for the ZyloShipping storefront and admin dashboard.

## Stack

- **Runtime:** Node.js, Express 4  
- **Database:** PostgreSQL (Supabase) via **Prisma**  
- **Cache / rate limits:** **Upstash Redis** (REST)  
- **Queues:** **BullMQ** + **ioredis** (use `REDIS_URL` TCP endpoint from Upstash)  
- **Search:** Algolia  
- **Storage:** Cloudflare R2 (S3 API)  
- **Email:** Resend  
- **Payments:** Razorpay + Stripe  
- **Tracking:** AfterShip webhooks  
- **AI:** OpenAI GPT-4o (agents log to `ai_logs`)  
- **Monitoring:** Sentry (optional)

## Setup

1. **Install dependencies** (from monorepo root):

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp backend/.env.example backend/.env
   ```

   Fill `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and at least one of: Upstash Redis, payment keys, or OpenAI — depending on which features you use locally.

3. **Database**

   ```bash
   cd backend
   npx prisma migrate dev
   npm run db:seed
   ```

   Seed loads demo suppliers, products (with URL **slugs**), orders, analytics, and an admin user (see seed script output).

4. **Run**

   ```bash
   npm run dev
   ```

   API defaults to `http://localhost:4000`. Health: `GET /health`.

## API overview

| Area        | Base path              | Notes |
|------------|------------------------|--------|
| Auth       | `/api/auth`            | JWT in HTTP-only cookie + `token` in JSON for SPAs |
| Products   | `/api/products`        | `GET /slug/:slug` for PDP; `?q=` uses Algolia when configured |
| Cart       | `/api/cart`            | Redis cache key `cart:{userId}` (7-day TTL) |
| Orders     | `/api/orders`          | `POST /create` alias; `PUT /:orderNumber/cancel` |
| Payments   | `/api/payments`        | Razorpay + Stripe intents / confirm |
| UPI        | `/api/payments/upi`    | Razorpay-backed UPI helpers |
| Webhooks   | `/api/webhooks`        | Raw JSON body; signature verification in handlers |
| Admin      | `/api/admin`           | Requires `ADMIN` or `OWNER` role |
| Support    | `/api/support`         | Tickets + AI reply |
| Reviews    | `/api/reviews`         | |

## Frontend integration

Point the Next.js app at this API:

- `NEXT_PUBLIC_APP_URL` — browser origin (CORS + password-reset links)  
- `BACKEND_URL` — server-side proxy to `http://localhost:4000` (or your deployed URL)

Cookie-based auth uses `credentials: 'include'` from the same site or a configured CORS origin.

## Redis key patterns

- `cart:{user_id}` — cart payload (TTL 7 days)  
- `session:{session_id}` — reserved for session storage  
- `rate_limit:{ip}` — API rate limiting when Upstash is configured  
- `product_cache:{slug}` — product detail cache (1 hour)

## Scripts

| Script        | Description |
|---------------|-------------|
| `npm run dev` | `ts-node-dev` on `src/index.ts` |
| `npm run build` | `tsc` |
| `npm start`   | `node dist/index.js` |
| `npm run db:generate` | Prisma client |
| `npm run db:migrate`  | Migrations |
| `npm run db:seed`     | Seed (see `database/seeds/products.seed.ts`) |

## Security notes

- Webhook routes use `express.raw` for Stripe/Razorpay signature verification.  
- Helmet + CSP is enabled in `app.ts`.  
- Secrets must never be committed; use `.env` locally and your host’s secret manager in production.
