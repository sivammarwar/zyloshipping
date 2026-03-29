/**
 * Idempotent seed: admin user, suppliers, store settings, 10 products, agent states.
 * Run from backend: `npx prisma db seed`
 */
import { PrismaClient, ProductStatus, UserRole, AgentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const AGENTS: Array<{
  id: string;
  name: string;
  description: string;
  schedule: string;
  model: string;
}> = [
  {
    id: 'content',
    name: 'Content Generation',
    description: 'Product copy and SEO from supplier data.',
    schedule: 'Every 6h',
    model: 'gpt-4o',
  },
  {
    id: 'curation',
    name: 'Product Curation',
    description: 'Scores incoming supplier SKUs.',
    schedule: 'Daily',
    model: 'gpt-4o',
  },
  {
    id: 'pricing',
    name: 'Dynamic Pricing',
    description: 'Margin-aware repricing.',
    schedule: 'Every 15m',
    model: 'gpt-4o-mini',
  },
  {
    id: 'routing',
    name: 'Order Routing',
    description: 'Chooses supplier per order.',
    schedule: 'On order',
    model: 'gpt-4o-mini',
  },
  {
    id: 'support',
    name: 'Customer Support',
    description: 'Tier-1 support automation.',
    schedule: 'Real-time',
    model: 'gpt-4o',
  },
  {
    id: 'refund',
    name: 'Refund & Disputes',
    description: 'Policy checks for refunds.',
    schedule: 'On trigger',
    model: 'gpt-4o',
  },
  {
    id: 'reviews',
    name: 'Review Reputation',
    description: 'Replies to reviews.',
    schedule: 'Hourly',
    model: 'gpt-4o-mini',
  },
  {
    id: 'health',
    name: 'Health Monitor',
    description: 'Supplier and job health.',
    schedule: 'Every 5m',
    model: 'gpt-4o-mini',
  },
];

async function main() {
  console.log('Seeding ZyloShipping…');

  await prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton' },
    update: {},
  });

  await prisma.supplier.upsert({
    where: { id: 'aliexpress' },
    create: {
      id: 'aliexpress',
      name: 'AliExpress',
      logo: 'AE',
      logoColor: '#FF6600',
      status: 'connected',
      totalProducts: 0,
      activeProducts: 0,
      pendingOrders: 0,
      totalOrders: 0,
      avgDeliveryDays: 14,
      rating: 4.3,
      responseTimeMs: 1200,
      uptimePercent: 99,
    },
    update: { name: 'AliExpress' },
  });

  await prisma.supplier.upsert({
    where: { id: 'cj' },
    create: {
      id: 'cj',
      name: 'CJ Dropshipping',
      logo: 'CJ',
      logoColor: '#2563eb',
      status: 'connected',
      totalProducts: 0,
      activeProducts: 0,
      pendingOrders: 0,
      totalOrders: 0,
      avgDeliveryDays: 10,
      rating: 4.6,
      responseTimeMs: 1800,
      uptimePercent: 99,
    },
    update: { name: 'CJ Dropshipping' },
  });

  const passwordHash = await bcrypt.hash('@3088shivA+her', 12);
  await prisma.user.upsert({
    where: { email: 'admin@zyloshipping.com' },
    create: {
      email: 'admin@zyloshipping.com',
      passwordHash,
      name: 'Zylo Admin',
      role: UserRole.ADMIN,
      totpEnabled: false,
      totpSecret: null,
    },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      totpEnabled: false,
    },
  });

  for (const a of AGENTS) {
    await prisma.agentState.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        name: a.name,
        description: a.description,
        status: AgentStatus.IDLE,
        schedule: a.schedule,
        model: a.model,
        totalCalls: 0,
        tokensTodayK: 0,
        successRate: 100,
        avgLatencyMs: 0,
        isPaused: false,
      },
      update: {
        name: a.name,
        description: a.description,
      },
    });
  }

  const catalog: Array<{
    sku: string;
    slug: string;
    supplierId: string;
    title: string;
    description: string;
    category: string;
    price: number;
    supplierCost: number;
    stockQuantity: number;
    status: ProductStatus;
    rating: number;
    totalSales: number;
  }> = [
    {
      sku: 'ZY-SEED-ELEC-001',
      slug: 'wireless-earbuds-pro-seed',
      supplierId: 'cj',
      title: 'Wireless Earbuds Pro — ANC',
      description:
        'Bluetooth 5.3 earbuds with hybrid active noise cancellation, 32h total battery with case, and IPX5 water resistance. Ideal for commute and gym.',
      category: 'Electronics',
      price: 79.99,
      supplierCost: 28.5,
      stockQuantity: 120,
      status: ProductStatus.ACTIVE,
      rating: 4.7,
      totalSales: 412,
    },
    {
      sku: 'ZY-SEED-HOME-001',
      slug: 'minimal-desk-lamp-led-seed',
      supplierId: 'aliexpress',
      title: 'Minimal LED Desk Lamp',
      description:
        'Touch dimmable LED desk lamp with warm-to-cool colour temperature. USB-C powered, aluminium arm, flicker-free for long work sessions.',
      category: 'Home',
      price: 42.0,
      supplierCost: 14.0,
      stockQuantity: 85,
      status: ProductStatus.ACTIVE,
      rating: 4.5,
      totalSales: 198,
    },
    {
      sku: 'ZY-SEED-FIT-001',
      slug: 'yoga-mat-travel-fold-seed',
      supplierId: 'cj',
      title: 'Foldable Travel Yoga Mat',
      description:
        '6mm TPE yoga mat folds to A4 size. Non-slip texture, lightweight for travel, includes carrying strap.',
      category: 'Fitness',
      price: 34.5,
      supplierCost: 11.2,
      stockQuantity: 200,
      status: ProductStatus.ACTIVE,
      rating: 4.4,
      totalSales: 560,
    },
    {
      sku: 'ZY-SEED-GAD-001',
      slug: 'power-bank-20000mah-seed',
      supplierId: 'aliexpress',
      title: 'Power Bank 20,000 mAh',
      description:
        'High-capacity 20Ah power bank with PD 22.5W USB-C and dual USB-A. Charges laptop, phone, and tablet on the go.',
      category: 'Gadgets',
      price: 48.0,
      supplierCost: 18.0,
      stockQuantity: 8,
      status: ProductStatus.LOW,
      rating: 4.6,
      totalSales: 1203,
    },
    {
      sku: 'ZY-SEED-FAS-001',
      slug: 'leather-card-wallet-slim-seed',
      supplierId: 'cj',
      title: 'Slim Leather Card Wallet',
      description:
        'Genuine leather minimalist wallet, 6 card slots, RFID blocking, fits front pocket comfortably.',
      category: 'Fashion',
      price: 26.0,
      supplierCost: 7.5,
      stockQuantity: 150,
      status: ProductStatus.ACTIVE,
      rating: 4.2,
      totalSales: 890,
    },
    {
      sku: 'ZY-SEED-HOM-002',
      slug: 'ceramic-pour-over-set-seed',
      supplierId: 'aliexpress',
      title: 'Ceramic Pour-Over Coffee Set',
      description:
        'V60-style ceramic dripper, server, and filter starter pack. Heat-retaining walls for even extraction.',
      category: 'Home',
      price: 39.0,
      supplierCost: 13.0,
      stockQuantity: 0,
      status: ProductStatus.HIDDEN,
      rating: 4.8,
      totalSales: 120,
    },
    {
      sku: 'ZY-SEED-ELE-002',
      slug: 'smart-plug-wifi-seed',
      supplierId: 'cj',
      title: 'Wi-Fi Smart Plug (2-pack)',
      description:
        'Voice assistant compatible smart plugs with energy monitoring and scheduling. 16A max, ETL listed.',
      category: 'Electronics',
      price: 29.99,
      supplierCost: 9.8,
      stockQuantity: 300,
      status: ProductStatus.ACTIVE,
      rating: 4.3,
      totalSales: 2100,
    },
    {
      sku: 'ZY-SEED-FIT-002',
      slug: 'resistance-bands-set-seed',
      supplierId: 'aliexpress',
      title: 'Resistance Bands Set (5 levels)',
      description:
        'Latex loop bands from light to extra heavy with door anchor and exercise guide. For strength and mobility.',
      category: 'Fitness',
      price: 24.0,
      supplierCost: 7.0,
      stockQuantity: 400,
      status: ProductStatus.ACTIVE,
      rating: 4.9,
      totalSales: 3400,
    },
    {
      sku: 'ZY-SEED-GAD-002',
      slug: 'led-ring-light-10-inch-seed',
      supplierId: 'cj',
      title: 'LED Ring Light 10" with Tripod',
      description:
        'Dimmable bi-colour ring light for streaming and video calls. Includes phone holder and desk tripod.',
      category: 'Gadgets',
      price: 45.0,
      supplierCost: 15.0,
      stockQuantity: 60,
      status: ProductStatus.ACTIVE,
      rating: 4.5,
      totalSales: 330,
    },
    {
      sku: 'ZY-SEED-FAS-002',
      slug: 'sports-watch-silicone-seed',
      supplierId: 'aliexpress',
      title: 'Breathable Silicone Sports Watch',
      description:
        'Lightweight digital sports watch with stopwatch, alarm, and 50m water resistance. Hypoallergenic strap.',
      category: 'Fashion',
      price: 36.0,
      supplierCost: 11.0,
      stockQuantity: 95,
      status: ProductStatus.ACTIVE,
      rating: 4.1,
      totalSales: 672,
    },
  ];

  for (const p of catalog) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      create: {
        sku: p.sku,
        slug: p.slug,
        supplierId: p.supplierId,
        supplierSku: `${p.supplierId.toUpperCase()}-SEED-${p.sku.slice(-4)}`,
        title: p.title,
        description: p.description,
        imagesJson: [],
        price: p.price,
        supplierCost: p.supplierCost,
        stockQuantity: p.stockQuantity,
        category: p.category,
        status: p.status,
        rating: p.rating,
        totalSales: p.totalSales,
      },
      update: {
        title: p.title,
        description: p.description,
        price: p.price,
        supplierCost: p.supplierCost,
        stockQuantity: p.stockQuantity,
        status: p.status,
        rating: p.rating,
        totalSales: p.totalSales,
      },
    });
  }

  // ── Pricing Plans ──
  const pricingPlans = [
    {
      planId: 'starter',
      name: 'Starter',
      tagline: 'For solo merchants just starting out.',
      monthlyPrice: 0,
      annualPrice: 0,
      isHighlight: false,
      ctaText: 'Get started free',
      features: [
        '50 products',
        '100 orders/month',
        'AliExpress integration',
        'UPI + Razorpay payments',
        'Basic AI content (50 generations/mo)',
        'Email support',
      ],
      limits: [
        'No dynamic pricing',
        'No customer support agent',
        'No analytics',
      ],
      displayOrder: 1,
    },
    {
      planId: 'growth',
      name: 'Growth',
      tagline: 'For stores ready to scale with AI.',
      monthlyPrice: 299900,
      annualPrice: 199900,
      isHighlight: true,
      badge: 'Most popular',
      ctaText: 'Start free trial',
      features: [
        'Unlimited products',
        '1,000 orders/month',
        'AliExpress + CJ Dropshipping',
        'UPI, Razorpay & Stripe',
        'All 8 AI agents',
        'Dynamic pricing engine',
        'Analytics dashboard',
        'Priority support',
      ],
      limits: [],
      displayOrder: 2,
    },
    {
      planId: 'pro',
      name: 'Pro',
      tagline: 'For high-volume, multi-supplier operations.',
      monthlyPrice: 799900,
      annualPrice: 549900,
      isHighlight: false,
      ctaText: 'Talk to us',
      features: [
        'Everything in Growth',
        'Unlimited orders',
        'Custom supplier integrations',
        'White-label storefront',
        'Dedicated account manager',
        'Custom AI agent prompts',
        'SLA: 99.9% uptime',
        'Priority webhook processing',
      ],
      limits: [],
      displayOrder: 3,
    },
  ];

  for (const plan of pricingPlans) {
    await prisma.pricingPlan.upsert({
      where: { planId: plan.planId },
      update: plan,
      create: plan,
    });
  }

  console.log('Seed complete: admin@zyloshipping.com / @3088shivA+her, 10 products, suppliers, agents, pricing plans.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
