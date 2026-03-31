================================================================================
ZYLOSHIPPING - QUICK START GUIDE
================================================================================
Version: 1.5.0
Last Updated: April 1, 2026

Get ZyloShipping running in 15 minutes!

================================================================================
STEP 1: PREREQUISITES (2 minutes)
================================================================================

Install these if you don't have them:
□ Node.js 18+ (https://nodejs.org)
□ PostgreSQL 14+ (https://www.postgresql.org)
□ Redis 7+ (https://redis.io)

Quick install on Mac:
brew install node postgresql redis

Quick install on Ubuntu:
sudo apt install nodejs postgresql redis-server

================================================================================
STEP 2: CLONE & INSTALL (3 minutes)
================================================================================

1. Clone repository:
   git clone <repository-url>
   cd zyloshipping

2. Install backend dependencies:
   cd backend
   npm install

3. Install frontend dependencies:
   cd ../frontend
   npm install

================================================================================
STEP 3: DATABASE SETUP (2 minutes)
================================================================================

1. Create database:
   createdb zyloshipping

2. Copy environment file:
   cd backend
   cp .env.example .env

3. Update DATABASE_URL in .env:
   DATABASE_URL="postgresql://user:password@localhost:5432/zyloshipping"

4. Run migrations:
   npx prisma migrate dev

5. Seed database (optional):
   npx prisma db seed

================================================================================
STEP 4: CONFIGURE ENVIRONMENT (3 minutes)
================================================================================

Edit backend/.env and add minimum required variables:

# Database (already set)
DATABASE_URL="postgresql://user:password@localhost:5432/zyloshipping"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (generate random strings)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"

# Optional but recommended for testing:
GROQ_API_KEY="your-groq-api-key"  # For AI features
RESEND_API_KEY="your-resend-key"  # For emails

Edit frontend/.env.local:
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

================================================================================
STEP 5: START SERVICES (2 minutes)
================================================================================

1. Start Redis (in new terminal):
   redis-server

2. Start PostgreSQL (if not running):
   # Usually starts automatically
   # On Mac: brew services start postgresql
   # On Ubuntu: sudo service postgresql start

3. Start backend (in new terminal):
   cd backend
   npm run dev
   
   ✅ Backend running at http://localhost:4000

4. Start frontend (in new terminal):
   cd frontend
   npm run dev
   
   ✅ Frontend running at http://localhost:3000

================================================================================
STEP 6: VERIFY INSTALLATION (3 minutes)
================================================================================

1. Check backend health:
   Open: http://localhost:4000/health
   Should see: {"status":"healthy"}

2. Check frontend:
   Open: http://localhost:3000
   Should see: ZyloShipping homepage

3. Test admin login (if you ran seed):
   Email: admin@zyloshipping.com
   Password: Admin@123
   (Will redirect to /dashboard after login)

4. Browse products:
   http://localhost:3000/products

================================================================================
WHAT'S WORKING NOW
================================================================================

✅ User registration & login (with Zod validation)
✅ Product browsing (with Algolia search)
✅ Shopping cart (with centralized validation)
✅ Checkout with payment processing (Razorpay, Stripe)
✅ Order management (with validation)
✅ Admin dashboard (protected routes)
✅ Product search (Algolia-powered)
✅ Inventory sync (with Algolia auto-sync)
✅ AI-powered features (Groq AI integrated)
✅ Email notifications (7 templates)
✅ Review system (frontend + backend)
✅ Customer support chat widget
✅ JWT auto-refresh (tokenManager)
✅ Admin alerts on service failure
✅ Customer metrics tracking
✅ Cloudflare R2 image upload
✅ Social media automation
✅ Product comparison tool

================================================================================
NEXT STEPS
================================================================================

1. Add Payment Gateway Keys:
   - Sign up for Razorpay: https://razorpay.com
   - Sign up for Stripe: https://stripe.com
   - Add keys to backend/.env

2. Add Email API Key:
   - Sign up for Resend: https://resend.com
   - Add RESEND_API_KEY to backend/.env

3. Add Search API Key:
   - Sign up for Algolia: https://www.algolia.com
   - Add ALGOLIA_* keys to backend/.env

4. Configure Suppliers:
   - Sign up for CJ Dropshipping
   - Add CJ_EMAIL and CJ_PASSWORD to backend/.env

5. Read Full Documentation:
   - AUTOMATION.md - Learn about automation features
   - FINAL_STATUS_v2.0.md - Check project status
   - README.md - Full project overview

================================================================================
TROUBLESHOOTING
================================================================================

TypeScript Errors:
→ Run: cd backend && npx tsc --noEmit
→ Run: cd frontend && npx tsc --noEmit
→ Most lint warnings are non-breaking

================================================================================
COMMON ISSUES
================================================================================

"Database connection failed":
→ Check PostgreSQL is running: pg_isready
→ Verify DATABASE_URL in .env

"Redis connection failed":
→ Check Redis is running: redis-cli ping
→ Should respond: PONG

"Port already in use":
→ Backend: Change PORT in backend/.env
→ Frontend: Kill process on port 3000

"Prisma errors":
→ Run: npx prisma generate
→ Run: npx prisma migrate dev

================================================================================
TESTING THE PLATFORM
================================================================================

1. Register a new user:
   POST http://localhost:4000/api/auth/register
   {
     "email": "test@example.com",
     "password": "Test@123",
     "name": "Test User"
   }

2. Browse products:
   GET http://localhost:4000/api/products

3. Add to cart:
   POST http://localhost:4000/api/cart
   {
     "productId": "product-id-here",
     "quantity": 1
   }

4. View cart:
   GET http://localhost:4000/api/cart

5. Check health:
   GET http://localhost:4000/health

================================================================================
DEVELOPMENT WORKFLOW
================================================================================

Daily Development:
1. Start Redis: redis-server
2. Start backend: cd backend && npm run dev
3. Start frontend: cd frontend && npm run dev
4. Code and test
5. Commit changes

Database Changes:
1. Edit schema: backend/prisma/schema.prisma
2. Create migration: npx prisma migrate dev
3. Generate client: npx prisma generate

Adding New Features:
1. Backend: Add route in backend/src/routes/
2. Frontend: Add page in frontend/app/
3. Test locally
4. Update documentation

================================================================================
USEFUL COMMANDS
================================================================================

Backend:
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npx prisma studio    # Open database GUI
npx prisma migrate   # Run migrations
npm test             # Run tests

Frontend:
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run linter

Database:
npx prisma studio                    # GUI for database
npx prisma migrate dev               # Create migration
npx prisma migrate reset             # Reset database
npx prisma db seed                   # Seed database
npx prisma generate                  # Generate Prisma client

Redis:
redis-cli ping                       # Check Redis
redis-cli flushall                   # Clear all data
redis-cli monitor                    # Monitor commands

================================================================================
API TESTING
================================================================================

Using curl:

# Health check
curl http://localhost:4000/health

# Register user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'

# Get products
curl http://localhost:4000/api/products

Using Postman:
1. Import collection (if available)
2. Set base URL: http://localhost:4000
3. Test endpoints

================================================================================
MONITORING
================================================================================

View Logs:
- Backend: Check terminal where backend is running
- Frontend: Check terminal where frontend is running
- Redis: redis-cli monitor

Check Database:
- Prisma Studio: npx prisma studio
- PostgreSQL: psql -d zyloshipping

Check Redis:
- CLI: redis-cli
- Keys: redis-cli keys '*'
- Monitor: redis-cli monitor

================================================================================
GETTING HELP
================================================================================

Documentation:
□ QUICK_START.md - This file
□ AUTOMATION.md - Automation features
□ FINAL_STATUS_v2.0.md - Project status & roadmap
□ README.md - Full project overview

Common Issues:
□ Check logs in terminal
□ Verify environment variables
□ Ensure all services running
□ Check database connection
□ Verify Redis connection

Support:
□ Email: support@zyloshipping.com
□ GitHub Issues: [repository-url]/issues

================================================================================
SUCCESS CHECKLIST
================================================================================

After following this guide, you should have:
✅ Backend running on http://localhost:4000
✅ Frontend running on http://localhost:3000
✅ Database connected and migrated
✅ Redis connected
✅ Health check passing
✅ Able to register users
✅ Able to browse products
✅ Admin dashboard accessible

If all checked, you're ready to develop! 🚀

================================================================================
WHAT'S NEXT?
================================================================================

Now that you have ZyloShipping running:

1. Explore the Admin Dashboard:
   http://localhost:3000/dashboard (requires login)

2. Test the Customer Flow:
   - Browse products with comparison
   - Add to cart
   - Checkout (with test payment keys)

3. Configure API Keys:
   - Add payment gateway keys
   - Add email API key
   - Add search API key
   - Add supplier credentials

4. Read the Documentation:
   - AUTOMATION.md - Learn about automation
   - FINAL_STATUS_v2.0.md - Check roadmap

5. Start Developing:
   - Add new features
   - Customize the UI
   - Integrate additional services
   - Deploy to production

================================================================================
CONGRATULATIONS!
================================================================================

You now have a fully functional automated dropshipping platform running
locally. ZyloShipping is ready for development, testing, and customization.

Happy coding! 🎉

================================================================================
END OF QUICK START GUIDE
================================================================================
