import { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com';

async function fetchProduct(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/products/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product || null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const product = await fetchProduct(params.slug);
  if (!product) {
    return { title: 'Product Not Found | ZyloShipping' };
  }

  const title = `${product.title} — Buy Online | ZyloShipping`;
  const description = product.description
    ? product.description.slice(0, 155)
    : `Buy ${product.title} for $${product.price}. Fast US shipping, 7-day returns. Rated ${product.rating}/5 stars.`;
  const images = Array.isArray(product.imagesJson) ? product.imagesJson : [];
  const imageUrl = images[0] || `${BASE_URL}/og-default.jpg`;

  return {
    title,
    description,
    keywords: [product.title, product.category, 'buy online USA', 'free shipping', 'dropshipping'],
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/products/${product.slug}`,
      type: 'website',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: product.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: { canonical: `${BASE_URL}/products/${product.slug}` },
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await fetchProduct(params.slug);

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: Array.isArray(product.imagesJson) ? product.imagesJson : [],
    sku: product.id,
    brand: { '@type': 'Brand', name: 'ZyloShipping' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: product.price,
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/products/${product.slug}`,
      seller: { '@type': 'Organization', name: 'ZyloShipping' },
    },
    aggregateRating: product.rating > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount || product.totalSales || 1,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient />
    </>
  );
}

