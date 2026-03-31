import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com';
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';

const BLOG_SLUGS = [
  'best-dropshipping-products-usa-2026',
  'top-ai-tools-americans-using-2026',
  'how-to-start-side-hustle-usa',
  'best-online-shopping-deals-us',
  'trending-products-us-market-2026',
  'how-to-save-money-shopping-online-usa',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/support`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = [
    'electronics', 'home-garden', 'fashion', 'beauty', 'sports', 'toys', 'kitchen',
  ].map((cat) => ({
    url: `${BASE_URL}/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = BLOG_SLUGS.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_BASE}/api/products?limit=500`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      productPages = (data.products || []).map((p: { slug: string; updatedAt?: string }) => ({
        url: `${BASE_URL}/products/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      }));
    }
  } catch {
    // Backend not available during build - skip product pages
  }

  return [...staticPages, ...categoryPages, ...blogPages, ...productPages];
}
