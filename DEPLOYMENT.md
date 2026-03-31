# ZyloShipping - Complete Deployment Guide
# Version: 2.0.0
# Last Updated: April 1, 2026
# Follow this guide step-by-step to deploy ZyloShipping to production

================================================================================
OVERVIEW
================================================================================

This guide will walk you through deploying ZyloShipping without buying a domain
initially. We'll use free subdomains from Vercel and Railway. When you're ready
to use your own domain, there's a section at the end for that.

DEPLOYMENT TIME: 2-3 hours
DIFFICULTY: Beginner to Intermediate
COST: ~$0-5/month (using free tiers)

================================================================================
STEP 1: PREPARE YOUR CODEBASE (10 minutes)
================================================================================

1.1. Ensure all code is committed to Git:
     cd /Users/shivamkumarsingh/Documents/zyloshipping/zyloshipping
     git add .
     git commit -m "Ready for production deployment v2.0.0"
     git push origin main

1.2. Verify your repository is public or properly configured on GitHub/GitLab

1.3. Note your repository URL - you'll need it for deployment

================================================================================
STEP 2: CREATE PRODUCTION ENVIRONMENT FILE (15 minutes)
================================================================================

2.1. Create a new file: backend/.env.production

     cd backend
     touch .env.production

2.2. Add the following configuration (replace all values):

================================================================================
# DATABASE - Use Supabase (recommended) or Railway PostgreSQL
# Get from: https://supabase.com (FREE tier: 500MB)
# After creating project: Settings → Database → Connection string
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# REDIS - Use Upstash (recommended) or Redis Cloud
# Get from: https://upstash.com (FREE tier: 10K commands/day)
# After creating database: Details → Redis URL (select Node.js)
REDIS_URL="rediss://default:[YOUR-PASSWORD]@[YOUR-ENDPOINT]:6379"

# JWT SECRETS - Generate strong random strings (min 32 characters)
# Use: https://randomkeygen.com/ or run: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-this-in-production-min-32-chars"

# FRONTEND URL - Will update after Step 3
# For now, leave as placeholder
FRONTEND_URL="https://your-frontend-url.vercel.app"

# SERVER CONFIG
NODE_ENV="production"
PORT="3000"

================================================================================
STEP 3: DEPLOY FRONTEND TO VERCEL (15 minutes)
================================================================================

3.1. Go to https://vercel.com and sign up/login with GitHub

3.2. Click "Add New Project"

3.3. Import your Git repository:
     - Select your zyloshipping repository
     - Click "Import"

3.4. Configure project:
     - Framework Preset: Next.js
     - Root Directory: frontend
     - Build Command: npm run build (default)
     - Output Directory: .next (default)

3.5. Environment Variables - Add these:
     NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app
     NEXT_PUBLIC_APP_URL=https://your-frontend-url.vercel.app
     
     (Note: We'll update the API URL after Step 4)

3.6. Click "Deploy"

3.7. Wait for deployment to complete (2-3 minutes)

3.8. Note your frontend URL:
     - It will be something like: https://zyloshipping-xxx.vercel.app
     - Copy this URL - you'll need it for backend CORS

================================================================================
STEP 4: DEPLOY BACKEND TO RAILWAY (20 minutes)
================================================================================

4.1. Go to https://railway.app and sign up/login with GitHub

4.2. Click "New Project" → "Deploy from GitHub repo"

4.3. Select your zyloshipping repository

4.4. Railway will auto-detect the backend (it has package.json)

4.5. Configure the service:
     - Click on the deployed service
     - Go to "Settings" tab
     - Under "Root Directory", enter: backend
     - Under "Start Command", enter: npm start
     - Click "Deploy"

4.6. Add environment variables:
     - Go to "Variables" tab
     - Click "New Variable"
     - Add all variables from your .env.production file (Step 2)
     - IMPORTANT: Update FRONTEND_URL with your Vercel URL from Step 3.8

4.7. Generate a domain:
     - Go to "Settings" tab
     - Click "Generate Domain"
     - Railway will give you a URL like: https://zyloshipping-production.up.railway.app
     - Copy this URL - you'll need it for frontend

4.8. Wait for deployment to complete (3-5 minutes)

================================================================================
STEP 5: CONNECT FRONTEND AND BACKEND (10 minutes)
================================================================================

5.1. Update Frontend Environment Variables:
     - Go back to Vercel dashboard
     - Select your project
     - Go to "Settings" → "Environment Variables"
     - Update NEXT_PUBLIC_API_URL with your Railway URL from Step 4.7
     - Click "Save"

5.2. Redeploy frontend:
     - Go to "Deployments" tab
     - Click the three dots on latest deployment
     - Click "Redeploy"
     - Wait for redeployment (2-3 minutes)

5.3. Verify connection:
     - Open your frontend URL in browser
     - Check if it loads without errors
     - Try to access: https://your-frontend-url.vercel.app/products

================================================================================
STEP 6: SET UP DATABASE (15 minutes)
================================================================================

6.1. Using Supabase (Recommended - FREE):

     a. Go to https://supabase.com and sign up
     b. Click "New Project"
     c. Enter project name: zyloshipping-prod
     d. Choose region closest to your users (e.g., Mumbai for India)
     e. Create project (takes 2-3 minutes)
     
     f. Get connection string:
        - Go to Project Settings (gear icon)
        - Click "Database" in left menu
        - Under "Connection string", select "Node.js"
        - Copy the URL
     
     g. Update Railway environment variable:
        - Go back to Railway dashboard
        - Add/update DATABASE_URL with the Supabase connection string
     
     h. Run migrations:
        - In Railway dashboard, click on your service
        - Go to "Deployments" tab
        - Click on latest deployment
        - Click "View Logs"
        - Look for "Deploy Logs" and check for any errors

6.2. Alternative: Using Railway PostgreSQL:
     
     a. In Railway project, click "New" → "Database" → "Add PostgreSQL"
     b. Railway will create a PostgreSQL service
     c. Click on the PostgreSQL service
     d. Go to "Variables" tab
     e. Copy the "DATABASE_URL" value
     f. Add it to your backend service variables

================================================================================
STEP 7: SET UP REDIS (10 minutes)
================================================================================

7.1. Using Upstash (Recommended - FREE):

     a. Go to https://upstash.com and sign up
     b. Click "Create Database"
     c. Name: zyloshipping-redis
     d. Region: Same as your database (e.g., Mumbai)
     e. Click "Create"
     
     f. Get connection details:
        - Click on your database
        - Go to "Details" tab
        - Under "Redis URL", select "Node.js"
        - Copy the URL (starts with rediss://)
     
     g. Update Railway environment variable:
        - Add/update REDIS_URL with the Upstash URL

7.2. Alternative: Using Railway Redis:
     
     a. In Railway project, click "New" → "Database" → "Add Redis"
     b. Copy the REDIS_URL from Redis service variables
     c. Add to your backend service

================================================================================
STEP 8: CONFIGURE PAYMENT GATEWAYS (20 minutes)
================================================================================

8.1. Razorpay Setup (for India):

     a. Go to https://dashboard.razorpay.com and sign up
     b. Complete KYC verification (required for live mode)
     c. Switch to "Live Mode" (toggle in top right)
     
     d. Get API Keys:
        - Settings → API Keys
        - Generate Key
        - Copy "Key ID" and "Key Secret"
        - Add to Railway: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
     
     e. Setup Webhook:
        - Settings → Webhooks → Add New Webhook
        - URL: https://your-backend-url.up.railway.app/webhooks/razorpay
        - Secret: Generate a random string (use: openssl rand -hex 16)
        - Add to Railway: RAZORPAY_WEBHOOK_SECRET
        - Enable Events:
          ☑ payment.captured
          ☑ payment.failed
          ☑ refund.processed
        - Click "Save"

8.2. Stripe Setup (for International):

     a. Go to https://dashboard.stripe.com and sign up
     b. Get API Keys:
        - Developers → API keys
        - Reveal "Secret key" (sk_live_...)
        - Add to Railway: STRIPE_SECRET_KEY
     
     c. Setup Webhook:
        - Developers → Webhooks → Add endpoint
        - Endpoint URL: https://your-backend-url.up.railway.app/webhooks/stripe
        - Select Events:
          ☑ payment_intent.succeeded
          ☑ payment_intent.payment_failed
          ☑ charge.refunded
        - Click "Add endpoint"
        - Click on created webhook → "Signing secret"
        - Copy the secret (whsec_...)
        - Add to Railway: STRIPE_WEBHOOK_SECRET

================================================================================
STEP 9: SET UP EMAIL SERVICE (10 minutes)
================================================================================

9.1. Using Resend (Recommended - FREE: 100 emails/day):

     a. Go to https://resend.com and sign up with GitHub
     b. Complete email verification
     c. Go to "API Keys" → "Create API Key"
     d. Name: zyloshipping-production
     e. Permissions: Sending access
     f. Copy the key (re_...)
     g. Add to Railway: RESEND_API_KEY

9.2. Verify sender domain (optional for testing, required for production):
     
     a. In Resend dashboard, go to "Domains"
     b. Click "Add Domain"
     c. Enter your domain (or skip for now if using Railway subdomain)
     d. Follow DNS verification steps when you have a domain

9.3. Set admin email for alerts:
     - Add to Railway: ADMIN_EMAIL=your-email@gmail.com

================================================================================
STEP 10: SET UP AI SERVICE (5 minutes)
================================================================================

10.1. Using Groq (Recommended - FREE: 14,400 requests/day):

      a. Go to https://console.groq.com and sign up
      b. Go to "API Keys" → "Create API Key"
      c. Name: zyloshipping
      d. Copy the key (gsk_...)
      e. Add to Railway: GROQ_API_KEY

================================================================================
STEP 11: OPTIONAL - SET UP SEARCH (Algolia) (15 minutes)
================================================================================

11.1. Go to https://www.algolia.com and sign up

11.2. Create an application:
      - Click "Create Application"
      - Name: zyloshipping
      - Region: Choose closest to your users

11.3. Get API Keys:
      - Go to "API Keys" in left menu
      - Copy "Application ID"
      - Copy "Admin API Key" (keep this secret!)
      - Add to Railway:
        ALGOLIA_APP_ID=your-app-id
        ALGOLIA_ADMIN_KEY=your-admin-key

11.4. Create index:
      - Go to "Search" → "Indexes"
      - Click "Create Index"
      - Index name: products
      - Click "Create"

================================================================================
STEP 12: OPTIONAL - SET UP IMAGE STORAGE (Cloudflare R2) (15 minutes)
================================================================================

12.1. Go to https://dash.cloudflare.com and sign up

12.2. Create R2 bucket:
      - R2 → Create bucket
      - Name: zyloshipping-images
      - Location: Auto
      - Click "Create bucket"

12.3. Create API token:
      - My Profile → API Tokens → Create Token
      - Template: "R2 Storage Admin"
      - Account Resources: Include your account
      - Zone Resources: All zones
      - Click "Continue"
      - Copy:
        - Access Key ID
        - Secret Access Key
      - Add to Railway:
        CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
        CLOUDFLARE_R2_ACCESS_KEY=your-access-key
        CLOUDFLARE_R2_SECRET_KEY=your-secret-key
        R2_BUCKET_NAME=zyloshipping-images

================================================================================
STEP 13: RUN DATABASE MIGRATIONS (10 minutes)
================================================================================

13.1. Access Railway service shell:
      - Go to Railway dashboard
      - Click on your backend service
      - Click "Shell" tab (or use CLI: railway shell)

13.2. Run migrations:
      npx prisma migrate deploy

13.3. Verify database:
      npx prisma db pull

13.4. (Optional) Seed with sample data:
      npx prisma db seed

================================================================================
STEP 14: TEST DEPLOYMENT (20 minutes)
================================================================================

14.1. Test health endpoint:
      curl https://your-backend-url.up.railway.app/health
      
      Expected: {"status":"healthy","database":"connected","redis":"connected"}

14.2. Test frontend:
      - Open https://your-frontend-url.vercel.app
      - Verify homepage loads
      - Navigate to /products
      - Verify products load

14.3. Test user registration:
      - Go to frontend URL
      - Click "Sign Up"
      - Create a test account
      - Verify you receive welcome email

14.4. Test login:
      - Log in with created account
      - Verify dashboard/profile loads

14.5. Test cart:
      - Add a product to cart
      - Verify cart updates

14.6. Test checkout (use test mode):
      - Go to cart
      - Click checkout
      - Use test card:
        - Razorpay: 5267 3181 8797 5449, any future date, any CVV
        - Stripe: 4242 4242 4242 4242, any future date, any CVV
      - Complete payment
      - Verify order created

14.7. Check admin dashboard:
      - Login as admin (if seeded: admin@zyloshipping.com / Admin@123)
      - Verify orders appear
      - Verify analytics load

================================================================================
STEP 15: VERIFY AUTOMATION IS RUNNING (10 minutes)
================================================================================

15.1. Check BullMQ jobs are processing:
      - In Railway logs, look for "[bullmq]" entries
      - Should see job processing messages

15.2. Verify health monitoring:
      - Check logs for "Health Monitor" runs every 5 minutes
      - Verify no critical errors

15.3. Test email sending:
      - Place an order
      - Check if order confirmation email arrives (check spam too)

15.4. Verify inventory sync:
      - Check logs for "Inventory Sync" every 2 hours

================================================================================
STEP 16: MONITORING & ALERTS SETUP (10 minutes)
================================================================================

16.1. Set up Uptime Monitoring (FREE):
      - Go to https://uptimerobot.com
      - Sign up
      - Add monitor:
        - Type: HTTP(s)
        - URL: https://your-backend-url.up.railway.app/health
        - Interval: 5 minutes
      - Add notification email

16.2. Enable Railway deployment notifications:
      - Railway dashboard → Settings → Notifications
      - Add email for deployment failures

================================================================================
DEPLOYMENT COMPLETE! 🎉
================================================================================

Your ZyloShipping is now LIVE at:
- Frontend: https://your-frontend-url.vercel.app
- Backend API: https://your-backend-url.up.railway.app
- Health Check: https://your-backend-url.up.railway.app/health

================================================================================
BONUS: DEPLOYING TO YOUR OWN DOMAIN (When Ready)
================================================================================

When you buy a domain (e.g., from GoDaddy, Namecheap, Google Domains),
follow these steps:

A. FRONTEND - Custom Domain on Vercel:

    1. Buy domain (e.g., zyloshipping.com)
    
    2. Go to Vercel dashboard:
       - Select your project
       - Settings → Domains
       - Enter your domain: zyloshipping.com
       - Click "Add"
    
    3. Vercel will provide DNS records (A or CNAME)
    
    4. Go to your domain registrar:
       - Find DNS management section
       - Add the records Vercel provided
       - Typically:
         Type: A
         Name: @
         Value: 76.76.21.21 (Vercel's IP)
         
         Type: CNAME
         Name: www
         Value: cname.vercel-dns.com
    
    5. Wait 5-48 hours for DNS propagation
    
    6. Vercel will automatically provision SSL certificate
    
    7. Update Railway environment variable:
       FRONTEND_URL=https://zyloshipping.com

B. BACKEND - Custom Domain on Railway:

    1. In Railway dashboard:
       - Select your backend service
       - Settings → Domains
       - Click "Custom Domain"
       - Enter: api.zyloshipping.com
       - Copy the DNS Target (CNAME record)
    
    2. Go to your domain registrar:
       - Add CNAME record:
         Type: CNAME
         Name: api
         Value: [Railway's DNS Target]
    
    3. Wait for DNS propagation
    
    4. Railway will provision SSL automatically
    
    5. Update Vercel environment variable:
       NEXT_PUBLIC_API_URL=https://api.zyloshipping.com
    
    6. Update payment gateway webhooks:
       - Razorpay: https://api.zyloshipping.com/webhooks/razorpay
       - Stripe: https://api.zyloshipping.com/webhooks/stripe

C. EMAIL - Custom Domain with Resend:

    1. In Resend dashboard:
       - Go to "Domains"
       - Click "Add Domain"
       - Enter: zyloshipping.com
    
    2. Add DNS records provided by Resend:
       - SPF record
       - DKIM record
       - DMARC record
    
    3. Verify domain (takes a few minutes to 24 hours)
    
    4. Update sender in email templates to: noreply@zyloshipping.com

================================================================================
TROUBLESHOOTING
================================================================================

ISSUE: "Database connection failed"
→ Check DATABASE_URL is correct
→ Verify IP allowlist in Supabase/Railway (allow 0.0.0.0/0 for testing)
→ Check logs for specific error

ISSUE: "Redis connection failed"
→ Check REDIS_URL is correct
→ Verify TLS settings (rediss:// vs redis://)

ISSUE: "CORS errors in browser"
→ Update FRONTEND_URL in Railway to match your actual frontend URL
→ Ensure no trailing slash

ISSUE: "Webhooks not working"
→ Verify webhook URL is publicly accessible
→ Check webhook secret matches
→ Test webhook manually with curl

ISSUE: "Emails not sending"
→ Check RESEND_API_KEY is set
→ Verify sender domain is verified (or using default)
→ Check email quota not exceeded

ISSUE: "Payment not processing"
→ Verify using LIVE keys, not TEST keys
→ Check webhook is configured correctly
→ Review payment gateway dashboard for errors

================================================================================
COST BREAKDOWN
================================================================================

FREE TIER DEPLOYMENT:
- Vercel (Frontend): $0 (100GB bandwidth)
- Railway (Backend): $5/month (or $0 with 500 hours)
- Supabase (Database): $0 (500MB)
- Upstash (Redis): $0 (10K commands/day)
- Resend (Email): $0 (100 emails/day)
- Groq (AI): $0 (14,400 requests/day)
- Algolia (Search): $0 (10K searches/month)
- Cloudflare R2 (Images): $0 (10GB)
- Domain: Not purchased yet
- SSL: Free (auto-provisioned)
---
TOTAL: $0-5/month

PAID TIER (When you scale):
- Railway Pro: $20/month
- Supabase Pro: $25/month
- Upstash Pro: $10/month
- Resend Pro: $20/month (50K emails)
- Domain: ~$12/year
---
TOTAL: ~$75/month

================================================================================
NEXT STEPS AFTER DEPLOYMENT
================================================================================

1. Test entire user flow end-to-end
2. Set up Google Analytics for tracking
3. Configure Facebook Pixel if running ads
4. Create social media accounts and link them
5. Set up backup strategy for database
6. Write terms of service and privacy policy
7. Configure customer support email
8. Test mobile responsiveness thoroughly
9. Run a load test (optional)
10. Announce launch! 🚀

================================================================================
SUPPORT
================================================================================

If you encounter issues:
1. Check Railway logs for backend errors
2. Check Vercel deployment logs for frontend errors
3. Review this guide's troubleshooting section
4. Check the documentation files in the repo
5. Email: support@zyloshipping.com

================================================================================
CONGRATULATIONS! YOU'RE LIVE! 🎉
================================================================================

Your automated dropshipping platform is now running in production!
Start adding products and making sales.

Last Updated: April 1, 2026
Guide Version: 1.0.0
