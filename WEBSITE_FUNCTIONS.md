# ZyloShipping — Complete Website Functions Reference

> A full-stack dropshipping platform with AI automation, multi-supplier management, social media marketing, and SEO capabilities.

---

## Table of Contents

1. [Customer Storefront](#1-customer-storefront)
2. [Authentication System](#2-authentication-system)
3. [Cart & Checkout](#3-cart--checkout)
4. [Order Management](#4-order-management)
5. [Payment System](#5-payment-system)
6. [Product System](#6-product-system)
7. [Review System](#7-review-system)
8. [Support System](#8-support-system)
9. [Admin Dashboard](#9-admin-dashboard)
10. [AI Agents](#10-ai-agents)
11. [Background Jobs & Automation](#11-background-jobs--automation)
12. [Social Media Automation](#12-social-media-automation)
13. [Email Notification System](#13-email-notification-system)
14. [Analytics & Reporting](#14-analytics--reporting)
15. [SEO System](#15-seo-system)
16. [Supplier Integration](#16-supplier-integration)
17. [Security & Infrastructure](#17-security--infrastructure)

---

## 1. Customer Storefront

### Homepage (`/`)
- Displays a curated product catalogue with search and category filters.
- Live ticker showing real-time stats (orders processed, delivery speed, etc.).
- Featured products section with pricing, ratings, and discount badges.
- Responsive grid layout with smooth hover effects.

### Product Listing (`/products`)
- Paginated product catalogue with filtering by category, price range, and rating.
- Sorting options: price, rating, newest, best-selling.
- Product cards showing name, price, original price, discount %, and badge labels.

### Product Detail Page (`/products/[slug]`)
- Full product information: title, description, images gallery (thumbnail carousel).
- Price with original price struck-through and discount % badge.
- Quantity selector + Add to Cart button with live total calculation.
- Wishlist button.
- Description / Shipping tabs.
- Trust badges: shipping speed, return policy, secure checkout.
- **Dynamic SEO metadata** generated server-side per product.
- **JSON-LD Product schema** for Google rich snippets (price, rating, availability).
- Live review section (see Review System).

### Category Landing Pages (`/category/[slug]`)
- Dedicated SEO-optimized pages for: Electronics, Home & Garden, Fashion, Beauty, Sports, Toys, Kitchen.
- Keyword-rich H1, intro paragraph, and meta description per category.
- Live product grid fetched from backend filtered by category.
- Related category navigation links.
- JSON-LD CollectionPage schema.

### Blog (`/blog`, `/blog/[slug]`)
- Blog index page with cards for all articles (category colour-coded, read time, date).
- Individual article pages with formatted content (headings, lists, tables, links).
- JSON-LD Article schema on every post.
- 6 pre-seeded US-market articles:
  - Best Dropshipping Products to Sell in the USA in 2026
  - Top 10 AI Tools Americans Are Using in 2026
  - How to Start a Side Hustle in the USA (Step-by-Step)
  - Best Online Shopping Deals in the US Right Now
  - Trending Products in the US Market Right Now
  - How to Save Money Shopping Online in the USA
- Related posts section at the bottom of each article.

### Static Pages
| Page | URL | Purpose |
|---|---|---|
| About | `/about` | Company story and mission |
| Pricing | `/pricing` | Subscription/plan tiers |
| Support | `/support` | Customer help centre |
| Privacy Policy | `/privacy` | GDPR/data privacy |
| Terms of Service | `/terms` | Legal terms |
| Order Tracking | `/track` | Public shipment tracker |

---

## 2. Authentication System

### Customer Auth (`/api/auth`)
- **Register**: Email + password account creation with hashed passwords (bcrypt).
- **Login**: JWT access token + refresh token via secure HTTP-only cookie.
- **Refresh Token**: Silent token renewal without re-login.
- **Logout**: Clears tokens and cookie.
- **Password Reset**: Email-based reset flow with expiring token link.
- **Profile Update**: Update name, email, phone number.

### Admin Auth (`/api/admin/auth`)
- **Admin Login**: Separate login endpoint with stricter rate limiting.
- **MFA Setup** (`/auth/setup-mfa`): Generate TOTP QR code for authenticator apps.
- **MFA Verify** (`/auth/verify-mfa`): Verify 6-digit TOTP code to unlock admin session.
- All admin routes require: valid JWT + admin role + MFA verified.

---

## 3. Cart & Checkout

### Cart (`/cart`, `/api/cart`)
- Add items with quantity.
- Update quantities or remove items.
- Persistent cart (saved to database, survives browser refresh).
- Coupon code application with percentage discount.
- Real-time subtotal, shipping, and total calculation.
- Free shipping threshold support (configurable by admin).

### Checkout (`/checkout`)
- Multi-step checkout: shipping address → payment → confirmation.
- Address form with validation.
- Payment method selection (see Payment System).
- Order summary with itemised breakdown.
- Post-checkout confirmation page with order number.

---

## 4. Order Management

### Customer Orders (`/orders`, `/api/orders`)
- View all past orders with status, date, total, and tracking info.
- Individual order detail page with item breakdown.
- Real-time order status updates via polling.
- Shipment tracking integration (shows carrier + tracking link).

### Order Status Flow
```
PENDING → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
                    ↘ CANCELLED
                    ↘ REFUNDED
```

### Refund Requests
- Customer can request a refund from order detail page.
- AI Refund Agent reviews and auto-approves/rejects based on policy rules.
- Admin can manually override refund decisions.
- Automatic refund via original payment gateway (Stripe/Razorpay).

### Order Tracking (`/track`)
- Public tracking page — enter order ID or tracking number.
- Shows live carrier tracking events and estimated delivery.

---

## 5. Payment System

### Supported Gateways
| Gateway | Use Case |
|---|---|
| **Stripe** | Card payments (US/international) |
| **Razorpay** | Card, netbanking, wallets (India) |
| **UPI** | Direct UPI payments (India) |

### Payment Features
- Secure payment intent creation server-side.
- Webhook handlers for payment confirmation, failure, and refund events.
- Idempotent order creation (no duplicate orders on network retry).
- Commission calculation per order (configurable rate).
- Full refund and partial refund support.

### Refund Emails Sent Automatically
- Refund under review
- Refund approved
- Refund confirmed (processing)
- Refund completed
- Refund rejected (with reason)

---

## 6. Product System

### Product Catalogue (`/api/products`)
- List products with pagination, filters (category, price, status), and search.
- Individual product lookup by ID or slug.
- Product images stored as JSON array (multi-image support).
- Fields: title, description, price, originalPrice, category, rating, totalSales, stock status, SKU.
- Algolia search integration for fast full-text search.

### Product Sync (`/api/admin/products/sync`)
- Pulls latest products from connected suppliers.
- Updates prices, stock, and metadata automatically.
- Pipeline system to review, approve, or reject new supplier products before they go live.

### Product Analytics
- Per-product metrics: views, add-to-cart rate, conversion rate, revenue generated.

---

## 7. Review System

### Customer Reviews (`/api/reviews`)
- Authenticated users can leave a star rating (1–5) + optional text review.
- One review per user per product (duplicate prevention).
- Automatic product average rating recalculation after each review.
- Reviews displayed on product detail pages with star ratings.

### AI Review Replies
- When a new review is submitted, an AI agent automatically generates a personalised reply.
- Tone adapts to rating: enthusiastic (5★), warm (4★), understanding (3★), empathetic (1–2★).
- Reply references the specific product name and invites the customer to shop again.
- Replies stored in database and displayed alongside reviews.

---

## 8. Support System

### Customer Support (`/support`, `/api/support`)
- Customers can submit support tickets with subject and message.
- Ticket categories: order issue, refund, product question, general.
- **AI Customer Support Agent** generates an initial auto-response using GPT-4o.
- Customer receives email confirmation with ticket number.

### Admin Ticket Management
- List all tickets with status filtering (OPEN, IN_PROGRESS, ESCALATED, CLOSED).
- View full ticket thread and respond from admin dashboard.
- Escalate tickets to a senior team member.
- Mark tickets as resolved/closed.

---

## 9. Admin Dashboard

> Requires admin login + MFA verification. All actions are logged to an audit trail.

### Dashboard Home (`/dashboard`)
- Live KPI cards: total revenue, total orders, active customers, pending orders.
- Recent orders table.
- Quick-access navigation to all admin sections.

### Products (`/dashboard/products`)
- List all products with edit/delete controls.
- Sync new products from suppliers.
- Edit title, description, price, category, status.
- View per-product analytics (revenue, sales, conversion).
- Product pipeline: review and approve/reject new products from suppliers.

### Orders (`/dashboard/orders`)
- Full order list with date, customer, total, status, and payment method.
- Update order status manually.
- Trigger refunds directly from order detail view.

### Suppliers (`/dashboard/suppliers`)
- List all connected suppliers.
- View supplier-specific product catalogue.
- Trigger manual product sync per supplier.
- View orders routed to each supplier.

### Analytics (`/dashboard/analytics`)
- **Revenue**: Total revenue chart, daily/weekly/monthly breakdown, payment method split.
- **Products**: Top products by revenue, views, and conversion rate.
- **Customers**: New vs returning, geographic breakdown, lifetime value.
- **Suppliers**: Performance comparison, fulfilment speed, order volumes.
- **Payments**: Gateway breakdown, success/failure rates, refund rate.

### AI Agents (`/dashboard/agents`)
- View status of all running AI agents (enabled/disabled, last run, error count).
- View logs for each agent.
- Toggle agents on/off individually.

### Pricing (`/dashboard/pricing`)
- Manage dynamic pricing rules.
- Set margin multipliers, floor prices, and ceiling prices per category or product.

### Inventory Alerts (`/dashboard/`)
- Low stock alerts with configurable thresholds.
- Dismiss acknowledged alerts.
- Email notifications for low-stock events.

### Support Tickets (`/dashboard/`)
- Full ticket management with respond, escalate, and close controls.

### Social Media (`/dashboard/social-media/`)
- Manage connected social media accounts.
- View, schedule, and manage posts.
- Analytics across platforms.
- Campaign management.
*(See Section 12 for full details)*

### Settings (`/dashboard/settings`)
| Setting | Description |
|---|---|
| Store Name & Tagline | Display name for storefront |
| Contact & Support Email | System notification addresses |
| Timezone & Currency | Localisation |
| Free Shipping Threshold | Minimum order value for free shipping |
| Default Shipping Rate | Fallback shipping cost |
| Processing Days | Displayed fulfilment time |
| Coupon Code | Active discount code + percentage |
| Maintenance Mode | Take site offline for updates |
| Email Notifications | Toggle emails for orders, low stock, refunds |
| SMS Notifications | Toggle SMS for new orders |
| Team Management | Invite/remove team members by role |
| API Keys | Create and revoke API keys |

---

## 10. AI Agents

All agents use GPT-4o and run autonomously in the background.

| Agent | Function |
|---|---|
| **Product Curation Agent** | Evaluates incoming supplier products for quality, pricing, and market fit before listing |
| **Dynamic Pricing Agent** | Adjusts product prices based on demand signals, competitor pricing, and inventory levels |
| **Customer Support Agent** | Generates first-response replies to support tickets automatically |
| **Order Routing Agent** | Selects the optimal supplier for each order based on stock, speed, and cost |
| **Review Reputation Agent** | Writes personalised AI replies to customer reviews, tone-matched by star rating |
| **Refund & Dispute Agent** | Reviews refund requests, applies policy rules, auto-approves/rejects, and escalates edge cases |
| **Content Generation Agent** | Generates product descriptions, social media captions, and marketing copy |
| **Health Monitor Agent** | Monitors system health (DB, Redis, API connections) and triggers alerts on anomalies |

---

## 11. Background Jobs & Automation

All jobs run on a queue-based scheduler (Bull + Redis).

| Job | Frequency | What It Does |
|---|---|---|
| **Abandoned Cart Recovery** | Every hour | Sends email to users who left items in cart without purchasing |
| **Inventory Sync** | Every 4 hours | Pulls latest stock levels from all suppliers |
| **Product Ingestion** | Every 6 hours | Fetches new products from supplier feeds and routes through pipeline |
| **Dynamic Pricing Update** | Every hour | Re-runs pricing agent and updates product prices |
| **Order Completion Check** | Every 30 min | Marks delivered orders as complete, triggers review request email |
| **Refund Processor** | Every 15 min | Processes pending refund decisions and initiates gateway refunds |
| **Review Request Emails** | 3 days after delivery | Sends a post-purchase review request to customer |
| **Tracking Poller** | Every 2 hours | Polls carrier APIs for tracking updates and updates order status |
| **Social Media Automation** | Configurable schedule | Auto-generates and publishes posts to connected platforms |
| **Health Monitor** | Every 5 min | Pings system components and logs health status |

---

## 12. Social Media Automation

### Connected Platforms
- **Instagram** — Product posts, stories, reels captions
- **Facebook** — Page posts, product promotions
- **Twitter / X** — Short-form product tweets, trend-based content
- **Reddit** — Community posts in relevant subreddits

### Admin Pages
| Page | URL | Function |
|---|---|---|
| Accounts | `/dashboard/social-media/accounts` | Connect and manage platform accounts (OAuth / API keys) |
| Posts | `/dashboard/social-media/posts` | View all scheduled and published posts, filter by platform/status |
| Analytics | `/dashboard/social-media/analytics` | Engagement metrics (likes, shares, reach) per platform |
| Campaigns | `/dashboard/social-media/campaigns` | Group posts into campaigns with goals and date ranges |

### Automation Flow
1. Content Generation Agent creates platform-specific copy for a product.
2. Post is scheduled via the social media job queue.
3. At the scheduled time, post is published to the relevant platform API.
4. Engagement data is polled and stored for analytics.

### Content Generation
- Product description → formatted social caption for each platform.
- Tone and length adapted per platform (Instagram: visual + hashtags, Twitter: punchy + concise, Reddit: community-native).
- Supports product image attachment.

---

## 13. Email Notification System

All emails use branded HTML templates.

### Customer Emails
| Trigger | Email Sent |
|---|---|
| Order placed | Order Confirmation (items, total, delivery estimate) |
| Order picked up by supplier | Order Processing update |
| Order shipped | Shipment notification with tracking link |
| Out for delivery | Out for Delivery alert |
| Order delivered | Delivery confirmation + review request |
| Refund requested | Refund Under Review notification |
| Refund approved | Refund Approved (timeline) |
| Refund processing | Refund Confirmed (processing) |
| Refund complete | Refund Completed (amount credited) |
| Refund rejected | Refund Rejected (reason + appeal option) |
| Password reset | Secure reset link (expires in 1 hour) |
| Abandoned cart | Reminder email with cart contents |
| Post-delivery | Review Request (3 days after delivery) |

---

## 14. Analytics & Reporting

### Revenue Analytics
- Total revenue with daily/weekly/monthly trend charts.
- Average order value (AOV).
- Revenue by payment gateway.
- Gross vs net revenue (after refunds and commissions).

### Product Analytics
- Top products by revenue, units sold, and page views.
- Conversion rate per product (views → purchases).
- Cart abandonment data.

### Customer Analytics
- Total customers, new vs returning split.
- Customer lifetime value (CLV).
- Top customers by spend.

### Supplier Analytics
- Revenue and order volume per supplier.
- Average fulfilment speed.
- Return/refund rate per supplier.

### Payment Analytics
- Success vs failure rate by gateway.
- Refund rate and total refunded amount.
- Daily payment volume.

---

## 15. SEO System

### Technical SEO
| Feature | File | Function |
|---|---|---|
| XML Sitemap | `app/sitemap.ts` | Auto-generated, includes all products, blog posts, and categories. Revalidates every hour. |
| Robots.txt | `app/robots.ts` | Allows all public pages, blocks `/dashboard/`, `/api/`, `/checkout/`, `/cart/`, `/orders/` |
| Canonical URLs | All page files | Every page exports a canonical URL in metadata |

### On-Page SEO
- **Dynamic `generateMetadata()`** on product pages — unique title, description, and keywords per product fetched server-side.
- **Open Graph tags** on all key pages — controls appearance when shared on Facebook, WhatsApp, etc.
- **Twitter Card metadata** — summary card with large image on all shareable pages.

### Structured Data (JSON-LD)
| Schema Type | Where Used | Benefit |
|---|---|---|
| `Product` | `/products/[slug]` | Enables Google Shopping rich results: price, rating stars, availability |
| `AggregateRating` | `/products/[slug]` | Star ratings shown directly in Google search results |
| `Article` | `/blog/[slug]` | Eligible for Google's Top Stories and article carousels |
| `CollectionPage` | `/category/[slug]` | Helps Google understand category pages as product collections |

### Blog Content Strategy
- 6 articles targeting high-intent US search keywords:
  - "best dropshipping products USA 2026" → `/blog/best-dropshipping-products-usa-2026`
  - "AI tools Americans using 2026" → `/blog/top-ai-tools-americans-using-2026`
  - "how to start side hustle USA" → `/blog/how-to-start-side-hustle-usa`
  - "best online shopping deals US" → `/blog/best-online-shopping-deals-us`
  - "trending products US market 2026" → `/blog/trending-products-us-market-2026`
  - "how to save money shopping online USA" → `/blog/how-to-save-money-shopping-online-usa`

### Category Landing Pages
Dedicated SEO pages at `/category/[slug]` for:
`electronics` · `home-garden` · `fashion` · `beauty` · `sports` · `toys` · `kitchen`

---

## 16. Supplier Integration

### Supported Supplier Types
- REST API suppliers (JSON product feeds).
- Custom adapter system — new suppliers can be added by implementing the supplier adapter interface.

### Supplier Workflow
1. Admin connects a supplier via the Suppliers dashboard.
2. Product Ingestion Job fetches the supplier's catalogue on schedule.
3. New products enter the **Product Pipeline** with status `PENDING`.
4. Product Curation AI Agent evaluates each product.
5. Admin reviews and approves/rejects pipeline items.
6. Approved products go live on the storefront.

### Order Routing
- When an order is placed, the Order Routing Agent selects the best supplier based on:
  - Stock availability
  - Shipping speed to customer location
  - Supplier fulfilment cost
- Order is submitted to the selected supplier's API automatically.

---

## 17. Security & Infrastructure

### Authentication Security
- Passwords hashed with **bcrypt** (salt rounds: 12).
- JWT with short expiry + refresh token rotation.
- HTTP-only secure cookies for token storage.
- Admin MFA via TOTP (Google Authenticator compatible).
- Role-based access: `CUSTOMER`, `ADMIN`, `OWNER`.

### Rate Limiting
| Route Group | Limit |
|---|---|
| Auth routes | 10 requests / 15 minutes |
| Payment routes | 20 requests / 15 minutes |
| Admin routes | 60 requests / 15 minutes |
| General API | 100 requests / 15 minutes |

### Security Headers (Helmet.js)
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### Infrastructure
| Component | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js + Express, TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Cache / Queue | Redis (Bull job queues) |
| Search | Algolia |
| File Storage | Cloud storage (S3-compatible) |
| Payments | Stripe + Razorpay + UPI |
| AI / LLM | OpenAI GPT-4o |
| Email | Nodemailer (SMTP) |
| Deployment | Docker + Railway / custom server |

### Audit Logging
- Every admin action is logged: action type, admin user ID, affected resource, timestamp.
- Logs accessible via admin health dashboard.

---

*Document generated: March 2026 — ZyloShipping v2.0*
