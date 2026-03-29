// backend/prisma/seed.ts
// Seeds the database with realistic data matching all dashboard mock data
// Run: npx prisma db seed

import { PrismaClient, OrderStatus, ProductStatus, AgentStatus, CartStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ZyloShipping database...');

  // ── Clean slate ──────────────────────────────────────────────
  await prisma.$executeRaw`TRUNCATE TABLE 
    agent_logs, agent_runs, agent_states,
    ai_logs,
    geo_daily_stats, product_daily_stats, daily_analytics,
    abandoned_cart_snapshots, admin_cart_items, admin_carts,
    cart_items, carts,
    commissions, payments,
    order_tracking, order_items, orders,
    product_pipeline, reviews, support_tickets,
    sessions, password_reset_tokens, api_keys, team_members,
    products, suppliers,
    users, store_settings
    CASCADE`;

  // ── Store settings ────────────────────────────────────────────
  await prisma.storeSettings.create({
    data: { id: 'singleton' }
  });
  console.log('  ✓ Store settings');

  // ── Suppliers ─────────────────────────────────────────────────
  const aliexpress = await prisma.supplier.create({
    data: {
      id: 'aliexpress',
      name: 'AliExpress',
      logo: 'AE',
      logoColor: '#FF6600',
      status: 'connected',
      totalProducts: 6840,
      activeProducts: 4120,
      pendingOrders: 38,
      totalOrders: 2341,
      avgDeliveryDays: 14,
      rating: 4.3,
      responseTimeMs: 1200,
      uptimePercent: 99.7,
      lastSyncAt: new Date(Date.now() - 3 * 60 * 1000), // 3m ago
    }
  });

  const cj = await prisma.supplier.create({
    data: {
      id: 'cj',
      name: 'CJ Dropshipping',
      logo: 'CJ',
      logoColor: '#2563eb',
      status: 'connected',
      totalProducts: 3210,
      activeProducts: 2180,
      pendingOrders: 24,
      totalOrders: 1560,
      avgDeliveryDays: 10,
      rating: 4.6,
      responseTimeMs: 1800,
      uptimePercent: 98.9,
      lastSyncAt: new Date(Date.now() - 12 * 60 * 1000), // 12m ago
    }
  });
  console.log('  ✓ Suppliers (AliExpress + CJ)');

  // ── Products (exactly matching dashboard mock data) ───────────
  const productData = [
    { id: 'prod_1',  slug: 'smart-wireless-crossbody-midnight', supplierId: 'aliexpress', sku: 'ZY-ELEC-001', title: 'Smart Wireless Crossbody — Midnight',  category: 'Electronics', supplierCost: 32.00, price: 89.00, stockQuantity: 340, status: ProductStatus.ACTIVE,  rating: 4.9, totalSales: 2341 },
    { id: 'prod_2',  slug: 'minimalist-desk-lamp',               supplierId: 'cj',         sku: 'ZY-HOME-001', title: 'Minimalist Desk Lamp',                  category: 'Home Decor',  supplierCost: 14.50, price: 39.00, stockQuantity: 88,  status: ProductStatus.ACTIVE,  rating: 4.2, totalSales: 849  },
    { id: 'prod_3',  slug: 'portable-power-bank-20k',            supplierId: 'aliexpress', sku: 'ZY-GADG-001', title: 'Portable Power Bank 20K',               category: 'Gadgets',     supplierCost: 19.00, price: 55.00, stockQuantity: 4,   status: ProductStatus.LOW,     rating: 4.8, totalSales: 1203 },
    { id: 'prod_4',  slug: 'breathable-sports-watch',            supplierId: 'cj',         sku: 'ZY-FASH-001', title: 'Breathable Sports Watch',               category: 'Fashion',     supplierCost: 24.00, price: 69.00, stockQuantity: 175, status: ProductStatus.ACTIVE,  rating: 4.1, totalSales: 672  },
    { id: 'prod_5',  slug: 'resistance-band-set-pro',            supplierId: 'aliexpress', sku: 'ZY-FIT-001',  title: 'Resistance Band Set (Pro)',             category: 'Fitness',     supplierCost: 8.00,  price: 28.00, stockQuantity: 620, status: ProductStatus.ACTIVE,  rating: 4.9, totalSales: 3100 },
    { id: 'prod_6',  slug: 'ceramic-pour-over-kit',              supplierId: 'cj',         sku: 'ZY-HOME-002', title: 'Ceramic Pour-Over Coffee Kit',          category: 'Home Decor',  supplierCost: 17.00, price: 44.00, stockQuantity: 0,   status: ProductStatus.HIDDEN,  rating: 4.7, totalSales: 540  },
    { id: 'prod_7',  slug: 'noise-cancelling-buds',              supplierId: 'aliexpress', sku: 'ZY-ELEC-002', title: 'Noise Cancelling Earbuds Pro',          category: 'Electronics', supplierCost: 28.00, price: 79.00, stockQuantity: 212, status: ProductStatus.ACTIVE,  rating: 4.8, totalSales: 4120 },
    { id: 'prod_8',  slug: 'foldable-yoga-mat',                  supplierId: 'cj',         sku: 'ZY-FIT-002',  title: 'Foldable Travel Yoga Mat',             category: 'Fitness',     supplierCost: 11.00, price: 32.00, stockQuantity: 290, status: ProductStatus.ACTIVE,  rating: 4.3, totalSales: 980  },
    { id: 'prod_9',  slug: 'leather-card-wallet',                supplierId: 'aliexpress', sku: 'ZY-FASH-002', title: 'Slim Leather Card Wallet',             category: 'Fashion',     supplierCost: 7.00,  price: 24.00, stockQuantity: 512, status: ProductStatus.ACTIVE,  rating: 4.2, totalSales: 1560 },
    { id: 'prod_10', slug: 'led-ring-light',                     supplierId: 'cj',         sku: 'ZY-GADG-002', title: 'LED Ring Light 10"',                   category: 'Gadgets',     supplierCost: 13.00, price: 36.00, stockQuantity: 0,   status: ProductStatus.DRAFT,   rating: 0,   totalSales: 0    },
  ];

  const products: Record<string, any> = {};
  for (const p of productData) {
    products[p.id] = await prisma.product.create({
      data: {
        ...p,
        description: `High-quality ${p.title}. AI-generated description pending.`,
        imagesJson: [],
        supplierSku: `${p.supplierId === 'aliexpress' ? 'AE' : 'CJ'}-${Math.floor(10000 + Math.random() * 90000)}`,
      }
    });
  }
  console.log('  ✓ Products (10)');

  // ── Product pipeline (Suppliers → Pipeline tab) ────────────────
  const pipelineData = [
    { productId: 'prod_pipeline_1', supplierSku: 'AE-78432', supplierName: 'AliExpress', name: 'Smart LED Desk Organizer',   category: 'Home Decor',  cost: 11.20, suggestedPrice: 32.00, margin: 65, status: 'PENDING_REVIEW' },
    { productId: 'prod_pipeline_2', supplierSku: 'CJ-21093', supplierName: 'CJ',         name: 'Portable Neck Massager',     category: 'Wellness',    cost: 19.50, suggestedPrice: 55.00, margin: 64, status: 'PENDING_REVIEW' },
    { productId: 'prod_pipeline_3', supplierSku: 'AE-78319', supplierName: 'AliExpress', name: 'Magnetic Phone Wallet Card', category: 'Fashion',     cost: 4.80,  suggestedPrice: 18.00, margin: 73, status: 'APPROVED'       },
    { productId: 'prod_pipeline_4', supplierSku: 'CJ-21044', supplierName: 'CJ',         name: 'Stainless Water Bottle 1L',  category: 'Fitness',     cost: 8.50,  suggestedPrice: 28.00, margin: 70, status: 'REJECTED'       },
    { productId: 'prod_pipeline_5', supplierSku: 'AE-78280', supplierName: 'AliExpress', name: 'USB-C 100W GaN Charger',     category: 'Electronics', cost: 16.00, suggestedPrice: 45.00, margin: 64, status: 'PENDING_REVIEW' },
  ];

  // Create stub products for pipeline items then add pipeline records
  for (const p of pipelineData) {
    const suppId = p.supplierName === 'AliExpress' ? 'aliexpress' : 'cj';
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-pipeline';
    const prod = await prisma.product.create({
      data: {
        id: p.productId,
        supplierId: suppId,
        sku: `ZY-PIPE-${p.supplierSku}`,
        slug,
        supplierSku: p.supplierSku,
        title: p.name,
        description: p.name,
        imagesJson: [],
        price: p.suggestedPrice,
        supplierCost: p.cost,
        stockQuantity: 0,
        category: p.category,
        status: ProductStatus.DRAFT,
      }
    });
    await prisma.productPipeline.create({
      data: {
        productId: prod.id,
        supplierSku: p.supplierSku,
        supplierName: p.supplierName,
        name: p.name,
        category: p.category,
        cost: p.cost,
        suggestedPrice: p.suggestedPrice,
        margin: p.margin,
        status: p.status as any,
        aiScore: Math.random() * 40 + 60,
      }
    });
  }
  console.log('  ✓ Product pipeline (5 items)');

  // ── Users ─────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);

  const adminUser = await prisma.user.create({
    data: {
      id: 'user_admin',
      email: 'rahul@zyloshipping.com',
      passwordHash,
      name: 'Rahul Kumar',
      phone: '+91-9876543210',
      role: 'OWNER',
    }
  });

  const customers = await Promise.all([
    prisma.user.create({ data: { email: 'ryan@email.com',   name: 'Ryan K.',   passwordHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'priya@email.com',  name: 'Priya S.',  passwordHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'takumi@email.com', name: 'Takumi M.', passwordHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'asel@email.com',   name: 'Asel N.',   passwordHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'marc@email.com',   name: 'Marc D.',   passwordHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'sofia@email.com',  name: 'Sofia L.',  passwordHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'james@email.com',  name: 'James T.',  passwordHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'mei@email.com',    name: 'Mei L.',    passwordHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'omar@email.com',   name: 'Omar F.',   passwordHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'anna@email.com',   name: 'Anna K.',   passwordHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'diego@email.com',  name: 'Diego R.',  passwordHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'yuki@email.com',   name: 'Yuki S.',   passwordHash, role: 'CUSTOMER' } }),
  ]);
  console.log('  ✓ Users (1 admin + 12 customers)');

  // ── Team members ──────────────────────────────────────────────
  await prisma.teamMember.createMany({
    data: [
      { name: 'Rahul Kumar',  email: 'rahul@zyloshipping.com', role: 'OWNER',  avatar: 'RK', color: '#C41E3A', lastActive: new Date() },
      { name: 'Priya Sharma', email: 'priya@zyloshipping.com', role: 'ADMIN',  avatar: 'PS', color: '#2563eb', lastActive: new Date(Date.now() - 2 * 3600 * 1000) },
      { name: 'Dev Singh',    email: 'dev@zyloshipping.com',   role: 'EDITOR', avatar: 'DS', color: '#7c3aed', lastActive: new Date(Date.now() - 24 * 3600 * 1000) },
    ]
  });
  console.log('  ✓ Team members');

  // ── Orders (matching MOCK_ORDERS in orders page) ─────────────
  const orderMocks = [
    { num: 'ZY-28431', userIdx: 0,  country: '🇺🇸', items: 2, total: 199, status: OrderStatus.IN_TRANSIT,           payment: 'UPI',     gateway: 'Razorpay', suppId: 'aliexpress', minsAgo: 2  },
    { num: 'ZY-28430', userIdx: 1,  country: '🇬🇧', items: 1, total: 89,  status: OrderStatus.PAYMENT_CONFIRMED,    payment: 'Card',    gateway: 'Stripe',   suppId: 'cj',         minsAgo: 8  },
    { num: 'ZY-28429', userIdx: 2,  country: '🇯🇵', items: 3, total: 266, status: OrderStatus.DELIVERED,            payment: 'UPI',     gateway: 'Razorpay', suppId: 'aliexpress', minsAgo: 14 },
    { num: 'ZY-28428', userIdx: 3,  country: '🇦🇺', items: 1, total: 55,  status: OrderStatus.SHIPPED,              payment: 'Wallet',  gateway: 'Razorpay', suppId: 'cj',         minsAgo: 22 },
    { num: 'ZY-28427', userIdx: 4,  country: '🇫🇷', items: 2, total: 148, status: OrderStatus.DELIVERED,            payment: 'Card',    gateway: 'Stripe',   suppId: 'aliexpress', minsAgo: 35 },
    { num: 'ZY-28426', userIdx: 5,  country: '🇩🇪', items: 1, total: 39,  status: OrderStatus.REFUND_REQUESTED,     payment: 'UPI',     gateway: 'Razorpay', suppId: 'cj',         minsAgo: 60 },
    { num: 'ZY-28425', userIdx: 6,  country: '🇨🇦', items: 4, total: 312, status: OrderStatus.SUPPLIER_CONFIRMED,   payment: 'NetBank', gateway: 'Razorpay', suppId: 'aliexpress', minsAgo: 60 },
    { num: 'ZY-28424', userIdx: 7,  country: '🇸🇬', items: 1, total: 28,  status: OrderStatus.COMPLETED,            payment: 'UPI',     gateway: 'Razorpay', suppId: 'cj',         minsAgo: 120 },
    { num: 'ZY-28423', userIdx: 8,  country: '🇦🇪', items: 2, total: 158, status: OrderStatus.CANCELLED,            payment: 'Card',    gateway: 'Stripe',   suppId: 'aliexpress', minsAgo: 180 },
    { num: 'ZY-28422', userIdx: 9,  country: '🇵🇱', items: 1, total: 79,  status: OrderStatus.DELIVERED,            payment: 'UPI',     gateway: 'Razorpay', suppId: 'cj',         minsAgo: 240 },
    { num: 'ZY-28421', userIdx: 10, country: '🇲🇽', items: 3, total: 195, status: OrderStatus.PENDING,              payment: 'UPI',     gateway: 'Razorpay', suppId: 'aliexpress', minsAgo: 300 },
    { num: 'ZY-28420', userIdx: 11, country: '🇯🇵', items: 1, total: 44,  status: OrderStatus.REFUNDED,             payment: 'Card',    gateway: 'Stripe',   suppId: 'cj',         minsAgo: 360 },
  ];

  for (const o of orderMocks) {
    const createdAt = new Date(Date.now() - o.minsAgo * 60 * 1000);
    const order = await prisma.order.create({
      data: {
        orderNumber: o.num,
        userId: customers[o.userIdx].id,
        status: o.status,
        totalAmount: o.total,
        country: o.country,
        paymentMethod: o.payment,
        gateway: o.gateway,
        shippingAddressJson: { street: '123 Main St', city: 'Test City', country: o.country },
        shippingAmount: o.total > 200 ? 0 : 9.99,
        createdAt,
        updatedAt: createdAt,
        items: {
          create: Array.from({ length: o.items }, (_, i) => {
            const prodKeys = Object.keys(products);
            const prod = products[prodKeys[i % prodKeys.length]];
            return {
              productId: prod.id,
              supplierId: o.suppId,
              quantity: 1,
              unitPrice: prod.price,
              supplierCost: prod.supplierCost,
            };
          })
        }
      }
    });

    // Add commission for completed/delivered orders
    if ([OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT].includes(o.status)) {
      const supplierCost = o.total * 0.35;
      const gatewayFee = o.total * (o.gateway === 'Stripe' ? 0.03 : 0.02);
      await prisma.commission.create({
        data: {
          orderId: order.id,
          revenue: o.total,
          supplierCost,
          gatewayFee,
          shippingCost: 0,
          netCommission: o.total - supplierCost - gatewayFee,
          marginPercent: ((o.total - supplierCost - gatewayFee) / o.total) * 100,
        }
      });
    }
  }
  console.log('  ✓ Orders (12, matching dashboard mock data)');

  // ── Admin Cart ────────────────────────────────────────────────
  await prisma.adminCart.create({
    data: {
      adminUserId: adminUser.id,
      status: CartStatus.ACTIVE,
      items: {
        create: [
          { productId: 'prod_7', quantity: 2 },  // Noise Cancelling Earbuds
          { productId: 'prod_5', quantity: 1 },  // Resistance Band Set
          { productId: 'prod_4', quantity: 3 },  // Breathable Sports Watch
          { productId: 'prod_2', quantity: 1 },  // Minimalist Desk Lamp
          { productId: 'prod_3', quantity: 1, savedForLater: true }, // Power Bank - saved
          { productId: 'prod_9', quantity: 1, savedForLater: true }, // Slim Wallet - saved
        ]
      }
    }
  });
  console.log('  ✓ Admin cart (4 active + 2 saved)');

  // ── Abandoned carts for monitoring ────────────────────────────
  const abandonedData = [
    { userIdx: 0,  value: 158, items: 2, minsAgo: 90,  recovery: 'email_sent' },
    { userIdx: 4,  value: 89,  items: 1, minsAgo: 240, recovery: 'pending'    },
    { userIdx: 7,  value: 217, items: 3, minsAgo: 480, recovery: 'recovered'  },
    { userIdx: 10, value: 44,  items: 1, minsAgo: 720, recovery: 'expired'    },
  ];

  for (const ab of abandonedData) {
    const abandonedAt = new Date(Date.now() - ab.minsAgo * 60 * 1000);
    const customer = customers[ab.userIdx];
    const cart = await prisma.cart.create({
      data: {
        userId: customer.id,
        status: CartStatus.ABANDONED,
        abandonedAt,
        recoveryEmailSentAt: ab.recovery !== 'pending' ? new Date(abandonedAt.getTime() + 30 * 60000) : null,
        recoveredAt: ab.recovery === 'recovered' ? new Date(abandonedAt.getTime() + 2 * 3600000) : null,
        items: {
          create: [
            { productId: 'prod_7', quantity: 1 },
          ]
        }
      }
    });

    await prisma.abandonedCartSnapshot.create({
      data: {
        cartId: cart.id,
        userId: customer.id,
        userEmail: customer.email,
        userName: customer.name,
        itemCount: ab.items,
        cartValue: ab.value,
        abandonedAt,
        itemsJson: [{ productId: 'prod_7', qty: 1, price: 79 }],
        recoveryStatus: ab.recovery,
      }
    });
  }
  console.log('  ✓ Abandoned carts (4 snapshots)');

  // ── AI Agent states (matches Agents page exactly) ─────────────
  const agentStateData = [
    { id: 'content',  name: 'Content Generation', description: 'Writes product titles, descriptions, and SEO meta tags from supplier data using GPT-4.', status: AgentStatus.RUNNING, schedule: 'Every 6h',     model: 'gpt-4o',      totalCalls: 142, tokensTodayK: 28, successRate: 99.2, avgLatencyMs: 1840, lastRunAt: new Date(Date.now() - 3 * 60000) },
    { id: 'curation', name: 'Product Curation',    description: 'Scores and filters incoming supplier products by demand, margin, and competition.',       status: AgentStatus.RUNNING, schedule: 'Daily 2 AM',  model: 'gpt-4o',      totalCalls: 12,  tokensTodayK: 4,  successRate: 100,  avgLatencyMs: 3200, lastRunAt: new Date(Date.now() - 6 * 3600000) },
    { id: 'pricing',  name: 'Dynamic Pricing',     description: 'Adjusts prices based on demand signals, competitor scraping, and margin floors.',         status: AgentStatus.RUNNING, schedule: 'Every 15m',   model: 'gpt-4o-mini', totalCalls: 340, tokensTodayK: 6,  successRate: 97.8, avgLatencyMs: 420,  lastRunAt: new Date(Date.now() - 12 * 60000) },
    { id: 'routing',  name: 'Order Routing',        description: 'Selects optimal supplier for each order based on stock, cost, and delivery SLA.',         status: AgentStatus.RUNNING, schedule: 'On each order', model: 'gpt-4o-mini', totalCalls: 38,  tokensTodayK: 2,  successRate: 100,  avgLatencyMs: 280,  lastRunAt: new Date(Date.now() - 2 * 60000) },
    { id: 'support',  name: 'Customer Support',     description: 'Handles tier-1 customer messages: order status, tracking, and FAQs via LangChain.',      status: AgentStatus.RUNNING, schedule: 'Real-time',   model: 'gpt-4o',      totalCalls: 24,  tokensTodayK: 12, successRate: 94.1, avgLatencyMs: 2100, lastRunAt: new Date(Date.now() - 1 * 60000) },
    { id: 'refund',   name: 'Refund & Disputes',    description: 'Evaluates refund requests, checks policy compliance, and drafts resolution messages.',    status: AgentStatus.IDLE,    schedule: 'On trigger',  model: 'gpt-4o',      totalCalls: 3,   tokensTodayK: 1,  successRate: 100,  avgLatencyMs: 3800, lastRunAt: new Date(Date.now() - 2 * 3600000) },
    { id: 'reviews',  name: 'Review Reputation',    description: 'Generates personalised thank-you replies to 4-5★ reviews and flags low ratings.',        status: AgentStatus.RUNNING, schedule: 'Every hour',  model: 'gpt-4o-mini', totalCalls: 17,  tokensTodayK: 5,  successRate: 100,  avgLatencyMs: 1200, lastRunAt: new Date(Date.now() - 45 * 60000) },
    { id: 'health',   name: 'Health Monitor',        description: 'Pings suppliers, checks inventory levels, and alerts on anomalies every 30 seconds.',    status: AgentStatus.RUNNING, schedule: 'Every 30s',   model: 'gpt-4o-mini', totalCalls: 288, tokensTodayK: 1,  successRate: 100,  avgLatencyMs: 140,  lastRunAt: new Date(Date.now() - 30000) },
  ];

  for (const a of agentStateData) {
    await prisma.agentState.create({ data: a });
  }
  console.log('  ✓ Agent states (8 agents)');

  // ── Recent agent logs ─────────────────────────────────────────
  const agentRunContent = await prisma.agentRun.create({
    data: {
      agentId: 'content', agentName: 'Content Generation',
      status: AgentStatus.RUNNING, model: 'gpt-4o',
      inputJson: { productIds: ['prod_1', 'prod_2'] },
      outputJson: { processed: 14 },
      tokensUsed: 4200, latencyMs: 1840, triggeredBy: 'cron',
    }
  });

  await prisma.agentLog.createMany({
    data: [
      { agentRunId: agentRunContent.id, agentId: 'content', logType: 'SUCCESS', message: 'Generated content for 14 new AliExpress products', createdAt: new Date(Date.now() - 4 * 60000) },
      { agentRunId: agentRunContent.id, agentId: 'content', logType: 'INFO',    message: 'Fetched 14 pending products from queue',            createdAt: new Date(Date.now() - 6 * 60000) },
    ]
  });

  // ── Support tickets ───────────────────────────────────────────
  await prisma.supportTicket.createMany({
    data: [
      { ticketNumber: '#2841', userId: customers[0].id, message: 'Where is my order ZY-28431?', aiResponse: 'Your order is currently in transit. Expected delivery in 2-3 days.', status: 'RESOLVED', resolvedAt: new Date(Date.now() - 5 * 60000) },
      { ticketNumber: '#2840', userId: customers[5].id, message: 'I want a refund for my order.', status: 'ESCALATED', escalated: true, escalatedReason: 'Refund dispute requires human review' },
    ]
  });
  console.log('  ✓ Support tickets');

  // ── Reviews ───────────────────────────────────────────────────
  await prisma.review.createMany({
    data: [
      { productId: 'prod_7', userId: customers[0].id, rating: 5, text: 'Amazing earbuds! Best purchase ever.', aiReply: 'Thank you so much for your wonderful review! We\'re thrilled to hear you love your earbuds. 🎧', aiRepliedAt: new Date() },
      { productId: 'prod_5', userId: customers[2].id, rating: 5, text: 'Great resistance bands, very durable.', aiReply: 'We\'re so glad the bands are working well for you! Keep pushing your limits! 💪', aiRepliedAt: new Date() },
      { productId: 'prod_4', userId: customers[4].id, rating: 2, text: 'The watch stopped working after a week.', isFlagged: true, flagReason: 'Low rating — needs admin attention' },
    ]
  });
  console.log('  ✓ Reviews (2 replied, 1 flagged)');

  // ── Daily analytics (28 days matching chart data) ─────────────
  const dailyRevenue = [1800, 2100, 2450, 1980, 3100, 2800, 4200, 3600, 4800, 3900, 5200, 4100, 4600, 5800, 4900, 4218, 5100, 4700, 6200, 5500, 5900, 4800, 6400, 5700, 5300, 6800, 5900, 7100];
  const dailyOrders  = [18, 21, 24, 20, 31, 27, 38, 36, 44, 38, 49, 40, 45, 54, 47, 38, 52, 44, 60, 55, 58, 46, 62, 56, 51, 65, 57, 70];

  for (let i = 0; i < 28; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (27 - i));
    date.setHours(0, 0, 0, 0);

    await prisma.dailyAnalytics.create({
      data: {
        date,
        revenue: dailyRevenue[i],
        orders: dailyOrders[i],
        aov: dailyRevenue[i] / dailyOrders[i],
        visitors: dailyOrders[i] * 29,
        conversionRate: 3.4,
        supplierCosts: dailyRevenue[i] * 0.35,
        netProfit: dailyRevenue[i] * 0.62,
      }
    });
  }
  console.log('  ✓ Daily analytics (28 days)');

  // ── API keys ──────────────────────────────────────────────────
  await prisma.apiKey.createMany({
    data: [
      { name: 'Production API Key',  keyHash: await bcrypt.hash('zk_live_prod', 10), keyPrefix: 'zk_live_••••••••••••••••3f2a', status: 'active', lastUsedAt: new Date(Date.now() - 3 * 60000) },
      { name: 'Development API Key', keyHash: await bcrypt.hash('zk_test_dev', 10),  keyPrefix: 'zk_test_••••••••••••••••9b1c', status: 'active', lastUsedAt: new Date(Date.now() - 2 * 24 * 3600000) },
      { name: 'Webhook Signing Key', keyHash: await bcrypt.hash('whsec_webhook', 10), keyPrefix: 'whsec_••••••••••••••••7e4d', status: 'idle' },
    ]
  });
  console.log('  ✓ API keys');

  console.log('\n✅ Seed complete! ZyloShipping database is ready.');
  console.log('\n📧 Admin login: rahul@zyloshipping.com / password123');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());