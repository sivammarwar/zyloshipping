# ZyloShipping Testing & Verification Checklist

## Pre-Deployment Testing

### Backend API Tests

#### Authentication
- [ ] POST `/api/auth/register` - Create new user account
- [ ] POST `/api/auth/login` - Login with credentials
- [ ] POST `/api/auth/refresh` - Refresh JWT token
- [ ] GET `/api/auth/me` - Get current user profile
- [ ] POST `/api/auth/logout` - Logout and clear session

#### Products (Public)
- [ ] GET `/api/products` - List all products with pagination
- [ ] GET `/api/products?search=test` - Search products
- [ ] GET `/api/products?category=Electronics` - Filter by category
- [ ] GET `/api/products/slug/:slug` - Get product by slug
- [ ] GET `/api/products/:id` - Get product by ID

#### Cart
- [ ] GET `/api/cart` - Get user cart
- [ ] POST `/api/cart/items` - Add item to cart
- [ ] PATCH `/api/cart/items/:productId` - Update quantity
- [ ] DELETE `/api/cart/items/:productId` - Remove from cart
- [ ] DELETE `/api/cart` - Clear entire cart

#### Orders
- [ ] GET `/api/orders` - List user orders
- [ ] POST `/api/orders` - Create new order
- [ ] GET `/api/orders/:orderNumber` - Get order details
- [ ] GET `/api/orders/:orderNumber/track` - Track order

#### Payments
- [ ] POST `/api/payments/razorpay/create-order` - Create Razorpay order
- [ ] POST `/api/payments/razorpay/verify` - Verify payment
- [ ] POST `/api/payments/stripe/create-payment-intent` - Stripe payment
- [ ] POST `/api/payments/upi/initiate` - UPI payment

#### Admin Dashboard
- [ ] POST `/api/admin/auth/login` - Admin login
- [ ] GET `/api/admin/dashboard/stats` - Dashboard statistics
- [ ] GET `/api/admin/products` - List all products (admin view)
- [ ] POST `/api/admin/products/sync` - Sync products from suppliers
- [ ] GET `/api/admin/orders` - List all orders (admin view)
- [ ] GET `/api/admin/agents/status` - AI agent status

#### Health & Monitoring
- [ ] GET `/health` - Health check endpoint
- [ ] Verify database connection in health response
- [ ] Verify Redis connection in health response

### Frontend Tests

#### Public Pages
- [ ] `/` - Homepage loads with real products
- [ ] `/products` - Products page with filtering/sorting
- [ ] `/products/:slug` - Individual product page
- [ ] `/cart` - Shopping cart page
- [ ] `/checkout` - Checkout flow

#### Authentication
- [ ] `/login` - Login page
- [ ] `/register` - Registration page
- [ ] `/forgot-password` - Password reset
- [ ] Session persistence after refresh

#### Admin Dashboard
- [ ] `/dashboard` - Admin dashboard with stats
- [ ] `/dashboard/products` - Products management
- [ ] `/dashboard/orders` - Orders management
- [ ] `/dashboard/analytics` - Analytics page
- [ ] `/dashboard/settings` - Settings page

#### API Integration
- [ ] Products fetch from backend on homepage
- [ ] Products page uses real API with pagination
- [ ] Admin dashboard shows real statistics
- [ ] Orders display actual data
- [ ] Empty states show when no data

### Security Tests

#### Authentication & Authorization
- [ ] Unauthenticated users redirected from protected routes
- [ ] Non-admin users cannot access `/dashboard`
- [ ] JWT tokens expire correctly
- [ ] Refresh tokens work properly
- [ ] CORS blocks unauthorized origins

#### Input Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] Invalid email formats rejected
- [ ] Password strength requirements enforced
- [ ] Rate limiting prevents brute force

#### Data Protection
- [ ] Passwords hashed with bcrypt (12 rounds)
- [ ] Sensitive data not exposed in API responses
- [ ] HTTPS enforced in production
- [ ] Secure cookies (httpOnly, secure, sameSite)

## Integration Tests

### Payment Gateways
- [ ] Razorpay test payment completes
- [ ] Stripe test payment completes
- [ ] UPI payment flow works
- [ ] Webhook signatures verified
- [ ] Failed payments handled gracefully

### Email Service
- [ ] Order confirmation emails sent
- [ ] Password reset emails delivered
- [ ] Welcome emails for new users
- [ ] Admin notifications work

### Search (Algolia)
- [ ] Products indexed in Algolia
- [ ] Search returns relevant results
- [ ] Filters work correctly
- [ ] Faceted search functions

### Job Queue (BullMQ + Redis)
- [ ] Product sync jobs queue properly
- [ ] Order automation jobs execute
- [ ] Failed jobs retry correctly
- [ ] Job status visible in admin

## Performance Tests

### Backend
- [ ] API response time < 200ms for simple queries
- [ ] Database queries optimized (check with EXPLAIN)
- [ ] Redis caching reduces DB load
- [ ] Concurrent requests handled (100+ users)

### Frontend
- [ ] Page load time < 3s on 3G
- [ ] Images optimized and lazy loaded
- [ ] Code splitting implemented
- [ ] Lighthouse score > 90

## Production Readiness

### Environment Configuration
- [ ] All required env vars set in production
- [ ] Secrets rotated from defaults
- [ ] Admin password changed from seed
- [ ] Database backups configured
- [ ] Redis persistence enabled

### Monitoring & Logging
- [ ] Error tracking configured (Sentry)
- [ ] Application logs aggregated
- [ ] Uptime monitoring active
- [ ] Performance metrics tracked
- [ ] Alert notifications set up

### Deployment
- [ ] Backend deployed and accessible
- [ ] Frontend deployed on Vercel
- [ ] Database migrations applied
- [ ] Seed data loaded
- [ ] Health check returns 200

### Documentation
- [ ] README.md updated
- [ ] DEPLOYMENT.md complete
- [ ] API documentation available
- [ ] Environment variables documented
- [ ] Troubleshooting guide included

## Post-Deployment Verification

### Smoke Tests (Production)
```bash
# Health check
curl https://api.zyloshipping.com/health

# Public product list
curl https://api.zyloshipping.com/api/products

# Admin login
curl -X POST https://api.zyloshipping.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zyloshipping.com","password":"@3088shivA+her"}'
```

### Frontend Verification
- [ ] Visit https://zyloshipping.com
- [ ] Homepage loads without errors
- [ ] Products display correctly
- [ ] Admin dashboard accessible
- [ ] No console errors in browser

### Critical User Flows
1. **Customer Purchase Flow**
   - [ ] Browse products
   - [ ] Add to cart
   - [ ] Checkout
   - [ ] Complete payment
   - [ ] Receive confirmation

2. **Admin Product Management**
   - [ ] Login to dashboard
   - [ ] Sync products from supplier
   - [ ] Edit product details
   - [ ] Update inventory
   - [ ] View analytics

3. **Order Fulfillment**
   - [ ] View new orders
   - [ ] Update order status
   - [ ] Generate shipping label
   - [ ] Send tracking info
   - [ ] Mark as delivered

## Known Issues & Limitations

### Current Limitations
- Product images must be hosted externally (R2/S3)
- Supplier APIs require valid keys for sync
- AI agents need Groq/OpenAI API keys
- Real-time updates require WebSocket setup (future)

### Future Enhancements
- [ ] WebSocket for real-time order updates
- [ ] Advanced analytics dashboard
- [ ] Multi-currency support
- [ ] Internationalization (i18n)
- [ ] Mobile app (React Native)

## Testing Commands

### Backend
```bash
cd backend

# Run API tests
npm run test:api

# Check TypeScript
npm run type-check

# Lint code
npm run lint

# Database migration dry run
npx prisma migrate dev --create-only
```

### Frontend
```bash
cd frontend

# Type check
npm run type-check

# Lint
npm run lint

# Build production
npm run build

# Test production build locally
npm run start
```

## Success Criteria

✅ **Application is production-ready when:**
- All critical API endpoints return 200
- Frontend loads without errors
- Admin can login and manage products/orders
- Customers can browse and purchase
- Payments process successfully
- Email notifications send
- Health check passes
- No TypeScript errors
- All security headers present
- HTTPS enforced
- Database backups configured
- Monitoring active
