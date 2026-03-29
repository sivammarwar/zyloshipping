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
