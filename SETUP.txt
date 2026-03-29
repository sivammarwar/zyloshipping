================================================================================
ZYLOSHIPPING - COMPLETE SETUP GUIDE
================================================================================
Version: 1.3.1
Last Updated: March 29, 2026

This guide will help you set up the ZyloShipping platform from scratch.

================================================================================
SECTION 1: PREREQUISITES
================================================================================

Required Software:
- Node.js 18+ (LTS recommended)
- PostgreSQL 14+
- Redis 7+
- npm or yarn package manager
- Git

Required Accounts:
- Groq API (for AI agents)
- Razorpay account (for payments)
- Stripe account (for payments)
- Resend account (for emails)
- Algolia account (for search)
- CJ Dropshipping account (for products)
- AliExpress API access (optional)
- AfterShip account (for tracking)
- Cloudflare R2 (optional, for image storage)

================================================================================
SECTION 2: INITIAL SETUP
================================================================================

1. Clone the Repository:
   git clone <repository-url>
   cd zyloshipping

2. Install Dependencies:
   
   Backend:
   cd backend
   npm install
   
   Frontend:
   cd ../frontend
   npm install

3. Database Setup:
   
   Create PostgreSQL database:
   createdb zyloshipping
   
   Or using psql:
   psql -U postgres
   CREATE DATABASE zyloshipping;
   \q

4. Redis Setup:
   
   Start Redis server:
   redis-server
   
   Or using Docker:
   docker run -d -p 6379:6379 redis:7-alpine

================================================================================
SECTION 3: ENVIRONMENT CONFIGURATION
================================================================================

Backend Environment Variables (.env):
Copy backend/.env.example to backend/.env and configure:

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/zyloshipping"

# Redis
REDIS_URL="redis://localhost:6379"
UPSTASH_REDIS_REST_URL="" # Optional: Upstash Redis for serverless

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-this"

# AI - Groq API
GROQ_API_KEY="your-groq-api-key"

# Payment Gateways
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"
RAZORPAY_WEBHOOK_SECRET="your-razorpay-webhook-secret"

STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# Email - Resend
RESEND_API_KEY="your-resend-api-key"

# Search - Algolia
ALGOLIA_APP_ID="your-algolia-app-id"
ALGOLIA_ADMIN_KEY="your-algolia-admin-key"
ALGOLIA_SEARCH_KEY="your-algolia-search-key"

# Suppliers
CJ_EMAIL="your-cj-email"
CJ_PASSWORD="your-cj-password"

ALIEXPRESS_APP_KEY="" # Optional
ALIEXPRESS_APP_SECRET="" # Optional

# Tracking
AFTERSHIP_API_KEY="your-aftership-api-key"

# Image Storage (Optional)
R2_ACCOUNT_ID="" # Cloudflare R2
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""

# Application
NODE_ENV="development"
PORT="4000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

Frontend Environment Variables (.env.local):
Copy frontend/.env.example to frontend/.env.local:

NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"

================================================================================
SECTION 4: DATABASE MIGRATION
================================================================================

1. Generate Prisma Client:
   cd backend
   npx prisma generate

2. Run Database Migrations:
   npx prisma migrate dev
   
   This will:
   - Create all database tables
   - Set up relationships
   - Create indexes

3. Seed Database (Optional):
   npx prisma db seed
   
   This will create:
   - Sample admin user
   - Sample products
   - Sample categories
   - Test data

4. Verify Database:
   npx prisma studio
   
   Opens Prisma Studio at http://localhost:5555
   Browse and verify your database tables

================================================================================
SECTION 5: STARTING THE APPLICATION
================================================================================

Development Mode:

1. Start Backend:
   cd backend
   npm run dev
   
   Backend runs at: http://localhost:4000
   API endpoints: http://localhost:4000/api/*

2. Start Frontend (in new terminal):
   cd frontend
   npm run dev
   
   Frontend runs at: http://localhost:3000

3. Verify Services:
   - Backend health: http://localhost:4000/health
   - Frontend: http://localhost:3000
   - Admin dashboard: http://localhost:3000/dashboard

Production Mode:

1. Build Backend:
   cd backend
   npm run build
   npm start

2. Build Frontend:
   cd frontend
   npm run build
   npm start

================================================================================
SECTION 6: INITIAL CONFIGURATION
================================================================================

1. Create Admin Account:
   
   Option A - Using seed data:
   Email: admin@zyloshipping.com
   Password: Admin@123
   
   Option B - Manual creation:
   POST http://localhost:4000/api/auth/register
   {
     "email": "your-admin@email.com",
     "password": "SecurePassword123!",
     "name": "Admin Name"
   }
   
   Then update user role in database:
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-admin@email.com';

2. Configure Payment Webhooks:
   
   Razorpay:
   - Go to Razorpay Dashboard → Webhooks
   - Add webhook URL: https://your-domain.com/api/webhooks/razorpay
   - Select events: payment.captured, payment.failed, refund.processed
   - Copy webhook secret to RAZORPAY_WEBHOOK_SECRET
   
   Stripe:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: https://your-domain.com/api/webhooks/stripe
   - Select events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
   - Copy signing secret to STRIPE_WEBHOOK_SECRET

3. Configure Email Templates:
   - Verify RESEND_API_KEY is set
   - Test email sending:
     POST http://localhost:4000/api/auth/forgot-password
     { "email": "test@example.com" }

4. Set Up Algolia Search:
   - Create index named "products"
   - Configure searchable attributes in Algolia dashboard
   - Run initial product sync:
     POST http://localhost:4000/api/admin/products/sync

5. Configure Suppliers:
   - Log in to CJ Dropshipping
   - Verify credentials work
   - Run initial product ingestion:
     Trigger job manually or wait for scheduled run

================================================================================
SECTION 7: SCHEDULED JOBS
================================================================================

The following jobs run automatically via BullMQ:

Every 5 minutes:
- Health Monitor (checks database, Redis, suppliers)

Every 30 minutes:
- Tracking Poller (updates order tracking status)

Every 1 hour:
- Dynamic Pricing (adjusts product prices)

Every 2 hours:
- Inventory Sync (updates stock from suppliers)
- Hide Out of Stock (updates product status)

Every 24 hours:
- Order Completion (marks delivered orders as complete)

Delayed Jobs:
- Abandoned Cart Email (2 hours after cart creation)
- Review Request Email (3 days after delivery)

To manually trigger a job:
POST http://localhost:4000/api/admin/jobs/trigger
{
  "jobName": "inventorySync",
  "data": {}
}

================================================================================
SECTION 8: TESTING
================================================================================

1. Run Backend Tests:
   cd backend
   npm test

2. Run Frontend Tests:
   cd frontend
   npm test

3. TypeScript Type Checking:
   cd backend && npx tsc --noEmit
   cd frontend && npx tsc --noEmit

4. Linting:
   cd backend && npm run lint
   cd frontend && npm run lint

5. Test API Endpoints:
   Use the provided Postman collection or:
   
   Health Check:
   GET http://localhost:4000/health
   
   Register User:
   POST http://localhost:4000/api/auth/register
   
   Login:
   POST http://localhost:4000/api/auth/login
   
   Get Products:
   GET http://localhost:4000/api/products

================================================================================
SECTION 9: TROUBLESHOOTING
================================================================================

Database Connection Issues:
- Verify PostgreSQL is running: pg_isready
- Check DATABASE_URL format
- Ensure database exists: psql -l
- Check user permissions

Redis Connection Issues:
- Verify Redis is running: redis-cli ping
- Check REDIS_URL format
- Test connection: redis-cli

Port Already in Use:
- Backend: Change PORT in .env
- Frontend: Change port in package.json dev script

Migration Errors:
- Reset database: npx prisma migrate reset
- Generate client: npx prisma generate
- Run migrations: npx prisma migrate dev

Build Errors:
- Clear node_modules: rm -rf node_modules && npm install
- Clear build cache: rm -rf .next (frontend) or dist (backend)
- Update dependencies: npm update

API Key Issues:
- Verify all API keys are valid
- Check API key permissions
- Test keys individually using curl or Postman

================================================================================
SECTION 10: NEXT STEPS
================================================================================

After setup is complete:

1. Configure your domain and SSL certificate
2. Set up monitoring (see DEPLOYMENT.txt)
3. Configure backups (database and Redis)
4. Review security settings
5. Set up CI/CD pipeline
6. Configure error tracking (Sentry, etc.)
7. Set up analytics (Google Analytics, etc.)
8. Review and customize email templates
9. Configure rate limiting thresholds
10. Test payment flows end-to-end

For deployment instructions, see DEPLOYMENT.txt
For automation details, see AUTOMATION.txt

================================================================================
SUPPORT
================================================================================

Documentation: /COMPLETE_DOCUMENTATION.txt
Automation Guide: /AUTOMATION.txt
Deployment Guide: /DEPLOYMENT.txt
Scaling Guide: /SCALING.txt

For issues or questions:
Email: support@zyloshipping.com
GitHub: [repository-url]/issues

================================================================================
END OF SETUP GUIDE
================================================================================
