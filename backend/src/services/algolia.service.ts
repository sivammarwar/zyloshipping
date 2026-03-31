import algoliasearch from 'algoliasearch';
import { prisma } from '../db/prisma';
import { ProductStatus } from '@prisma/client';

const appId = process.env.ALGOLIA_APP_ID;
const adminKey = process.env.ALGOLIA_ADMIN_KEY || process.env.ALGOLIA_API_KEY;
const indexName = process.env.ALGOLIA_INDEX_NAME || 'products';

function client() {
  if (!appId || !adminKey) return null;
  return algoliasearch(appId, adminKey);
}

export async function indexProduct(productId: string) {
  const c = client();
  if (!c) return;
  const p = await prisma.product.findUnique({ where: { id: productId } });
  if (!p || (p.status !== ProductStatus.ACTIVE && p.status !== ProductStatus.LOW)) {
    await c.initIndex(indexName).deleteObject(productId).catch(() => {});
    return;
  }
  const object = {
    objectID: p.id,
    title: p.title,
    category: p.category,
    price: p.price,
    slug: p.slug,
    rating: p.rating,
    totalSales: p.totalSales,
    inStock: p.stockQuantity > 0,
    stockQuantity: p.stockQuantity,
  };
  await c.initIndex(indexName).saveObject(object);
  await prisma.product.update({
    where: { id: p.id },
    data: { algoliaObjectId: p.id },
  });
}

export async function removeProductFromAlgolia(productId: string) {
  const c = client();
  if (!c) return;
  await c.initIndex(indexName).deleteObject(productId).catch(() => {});
}

export async function searchProducts(
  query: string,
  opts?: { category?: string; page?: number; hitsPerPage?: number }
) {
  const c = client();
  if (!c) {
    return null;
  }
  const index = c.initIndex(indexName);
  const res = await index.search<{ objectID: string }>(query, {
    filters: opts?.category && opts.category !== 'All' ? `category:"${opts.category}"` : undefined,
    page: (opts?.page ?? 1) - 1,
    hitsPerPage: opts?.hitsPerPage ?? 20,
  });
  return res;
}

export async function configureSearchRanking() {
  const c = client();
  if (!c) {
    console.warn('[Algolia] Client not configured, skipping search ranking setup');
    return;
  }

  try {
    const index = c.initIndex(indexName);
    await index.setSettings({
      searchableAttributes: [
        'title',
        'category',
      ],
      attributesForFaceting: [
        'category',
        'inStock',
      ],
      customRanking: [
        'desc(rating)',
        'desc(totalSales)',
        'desc(inStock)',
      ],
      ranking: [
        'typo',
        'geo',
        'words',
        'filters',
        'proximity',
        'attribute',
        'exact',
        'custom',
      ],
    });
    console.log('[Algolia] Search ranking configured successfully');
  } catch (error) {
    console.error('[Algolia] Failed to configure search ranking:', error);
  }
}

export async function bulkIndexProducts(productIds: string[]) {
  const c = client();
  if (!c) return;

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      status: { in: [ProductStatus.ACTIVE, ProductStatus.LOW] },
    },
  });

  const objects = products.map(p => ({
    objectID: p.id,
    title: p.title,
    category: p.category,
    price: p.price,
    slug: p.slug,
    rating: p.rating,
    totalSales: p.totalSales,
    inStock: p.stockQuantity > 0,
    stockQuantity: p.stockQuantity,
  }));

  if (objects.length > 0) {
    await c.initIndex(indexName).saveObjects(objects);
    console.log(`[Algolia] Bulk indexed ${objects.length} products`);
  }
}
