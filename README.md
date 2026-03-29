# ZyloShipping

Monorepo for a dropshipping storefront (Next.js 14) and Express API (Prisma + PostgreSQL/Supabase), payments (Razorpay + Stripe), suppliers (AliExpress + CJ Dropshipping), AfterShip tracking, Algolia search, and BullMQ jobs.

## Architecture

| Package | Role |
|--------|------|
| `frontend/` | Next.js app — UI, BFF routes under `app/api/*` that proxy to the backend |
| `backend/` | Express API on port **4000** — auth (JWT cookies), orders, cart, payments, webhooks, admin |
| `shared/` | Shared TypeScript types and constants (`@zyloshipping/shared`) |

## Prerequisites

- Node **20+**
- PostgreSQL (e.g. Supabase)
- Redis (for caching, sessions, job queue)
- Accounts: Groq (primary LLM, free tier), OpenAI (optional fallback), Razorpay, Stripe, Algolia, Resend, CJ Dropshipping, AliExpress

## Environment variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and fill every **required** value. Comments in `.env.example` describe each key and where to obtain it.

**Strict startup:** On boot, `src/config/validateEnv.ts` checks required variables and **exits** if any are missing. Optional integrations (AliExpress, AfterShip, webhook secrets in development) only emit warnings.

**Local development without full secrets:** set `ZYLO_SKIP_ENV_VALIDATION=true` (not for production).

**Aliases:**

- `ALGOLIA_API_KEY` → used as `ALGOLIA_ADMIN_KEY` if the latter is unset  
- `CJ_ACCESS_TOKEN` → used as `CJ_API_KEY` if unset  
- `SUPABASE_SERVICE_ROLE_KEY` ↔ `SUPABASE_SERVICE_KEY` (either may be set)

### Frontend (`frontend/.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Browser origin (e.g. `http://localhost:3000`) — CORS + links |
| `NEXT_PUBLIC_BACKEND_URL` | Public API URL for browser `fetch` (e.g. `http://localhost:4000`) |
| `BACKEND_URL` | Optional; used by **server** Route Handlers to reach the API (Railway private URL, etc.) |

## Setup (step by step)

1. **Install dependencies** (from repo root):

   ```bash
   npm install
   ```

2. **Configure env** — `backend/.env` and `frontend/.env.local` as above.

3. **Prisma** (from `backend/`):

   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

4. **Seed** (admin + suppliers + 10 products + agent states):

   ```bash
   npx prisma db seed
   ```

   Default admin: `admin@zyloshipping.com` / `@3088shivA+her`

5. **Run in development**

   ```bash
   # terminal 1
   cd backend && npm run dev

   # terminal 2
   cd frontend && npm run dev
   ```

   Or from root: `npm run dev` (concurrently) if configured.

## API smoke tests

With the backend running:

```bash
cd backend
ZYLO_SKIP_ENV_VALIDATION=true npm run test:api
```

Uses `BASE_URL` (default `http://127.0.0.1:4000`). Extend `scripts/testApi.ts` as needed.

## Production behaviour

- **Compression** (gzip), **Helmet**, **Morgan** (with `X-Request-Id`), structured CORS, credentials for cookies.
- **GET `/health`** returns `{ status, timestamp, version, services: { database, redis, algolia } }` with `connected` | `error`.
- **Webhooks:** In **production**, missing `STRIPE_WEBHOOK_SECRET` or `RAZORPAY_WEBHOOK_SECRET` causes startup to **fail**. In **development**, signature verification is skipped with a warning (unsafe — only for local testing).
- **AliExpress:** If `ALIEXPRESS_APP_KEY` is missing, the adapter is skipped, orders route to **CJ only**, and inventory sync skips AliExpress SKUs.
- **AfterShip:** If `AFTERSHIP_API_KEY` is missing, tracking numbers are still stored; AfterShip registration is skipped (warning logged).

## Deploying to Railway

1. Create a **PostgreSQL** plugin and set `DATABASE_URL` + `DIRECT_URL` (non-pooler for migrations).
2. Add **Redis** (TCP) for `REDIS_URL`; add **Upstash** REST for rate limits / cart cache.
3. Set all required env vars from `backend/.env.example`.
4. Build with the root **Dockerfile** (multi-stage, Node 20 Alpine).  
   `railway.toml` points at that Dockerfile and health check **`GET /health`**.
5. Expose port **4000** (or set `PORT`).

Frontend can live on Vercel: set `NEXT_PUBLIC_BACKEND_URL` to the Railway API URL and add that origin to backend CORS via `NEXT_PUBLIC_APP_URL` or comma-separated `CORS_ORIGINS`.

## Adding missing keys later (no code changes)

When you set these in production, behaviour turns on automatically:

- `ALIEXPRESS_APP_KEY` (+ `ALIEXPRESS_APP_SECRET` as needed) — AliExpress adapter and AE inventory sync  
- `AFTERSHIP_API_KEY` — AfterShip tracking registration  
- `STRIPE_WEBHOOK_SECRET` / `RAZORPAY_WEBHOOK_SECRET` — verified webhooks (required in prod anyway)

## API overview (backend)

Base URL: `/api` on the Express host.

| Area | Examples |
|------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` |
| Products | `GET /products`, `GET /products/slug/:slug`, `GET /products/:id` |
| Cart | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId` |
| Orders | `GET /orders`, `POST /orders`, `GET /orders/:orderNumber`, … |
| Payments | `POST /payments/razorpay/create-order`, UPI routes under `/payments/upi/*` |
| Webhooks | `POST /webhooks/stripe`, `POST /webhooks/razorpay`, `POST /webhooks/aftership` |
| Admin | `/admin/*` (JWT + admin role + MFA when enabled) |

Full admin surface is under `backend/src/routes/admin.routes.ts`.

## Frontend ↔ backend

- Browser calls: `frontend/lib/api/*.ts` using `NEXT_PUBLIC_BACKEND_URL` and `credentials: 'include'`.
- Next.js server proxies: `frontend/lib/server/backendUrl.ts` (`BACKEND_URL` || `NEXT_PUBLIC_BACKEND_URL`).

## Database & Prisma

- Connection pooling: prefer Supabase **pooler** on `DATABASE_URL` with `?pgbouncer=true&connection_limit=1` for serverless-style pools; use **direct** `DIRECT_URL` for `prisma migrate` / `db push`.
- Extra indexes were added on `orders`, `products`, and `ai_logs` for common query patterns.

## License

Private / proprietary — adjust as needed.
# zyloshipping
