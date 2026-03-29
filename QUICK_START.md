================================================================================
ZYLOSHIPPING - QUICK START GUIDE
================================================================================
Version: 1.3.1
Last Updated: March 29, 2026

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

4. Browse products:
   http://localhost:3000/products

================================================================================
WHAT'S WORKING NOW
================================================================================

✅ User registration & login
✅ Product browsing
✅ Shopping cart
✅ Checkout (needs payment keys)
✅ Order management
✅ Admin dashboard
✅ Product search
✅ Inventory sync
✅ AI-powered features (needs GROQ_API_KEY)
✅ Email notifications (needs RESEND_API_KEY)

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
   - SETUP.txt - Complete setup guide
   - AUTOMATION.txt - Automation features
   - DEPLOYMENT.txt - Production deployment
   - IMPLEMENTATION.txt - Feature inventory

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
□ SETUP.txt - Full setup guide
□ AUTOMATION.txt - Automation features
□ DEPLOYMENT.txt - Production deployment
□ IMPLEMENTATION.txt - Feature inventory
□ FINAL_SUMMARY.txt - Project overview

Common Issues:
□ Check logs in terminal
□ Verify environment variables
□ Ensure all services running
□ Check database connection
□ Verify Redis connection

Support:
□ Email: support@zyloshipping.com
□ GitHub Issues: [repository-url]/issues
□ Documentation: See above files

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
   http://localhost:3000/dashboard

2. Test the Customer Flow:
   - Browse products
   - Add to cart
   - Checkout (with test payment keys)

3. Configure API Keys:
   - Add payment gateway keys
   - Add email API key
   - Add search API key
   - Add supplier credentials

4. Read the Documentation:
   - AUTOMATION.txt - Learn about automation features
   - DEPLOYMENT.txt - Plan production deployment
   - IMPLEMENTATION.txt - Understand the codebase

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
