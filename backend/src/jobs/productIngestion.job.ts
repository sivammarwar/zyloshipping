import { ProductStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { indexProduct } from '../services/algolia.service';
import { runContentGenerationAgent } from '../agents/contentGeneration.agent';
import { getAliExpressAdapter } from '../services/supplier/aliexpress.adapter';
import { getCjAdapter } from '../services/supplier/cj.adapter';
import { isAliExpressConfigured, warnAliExpressDisabled } from '../utils/supplierConfig';
import { uploadProductImages } from '../services/storage/r2.service';

async function ingestFromSource(
  raw: { id: string; title: string; price: number; stock: number; rating: number; images: unknown },
  supplierId: 'aliexpress' | 'cj'
) {
  const slug =
    raw.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    raw.id.slice(0, 6);
  const existing = await prisma.product.findFirst({ where: { supplierSku: raw.id } });
  if (existing) return;

  const ai = await runContentGenerationAgent({ title: raw.title, description: raw.title });
  const prefix = supplierId === 'cj' ? 'CJ' : 'AE';
  
  // Extract image URLs from raw.images
  let imageUrls: string[] = [];
  if (Array.isArray(raw.images)) {
    imageUrls = raw.images;
  } else if (typeof raw.images === 'object' && raw.images !== null) {
    imageUrls = Object.values(raw.images).filter((url): url is string => typeof url === 'string');
  }

  // Upload images to R2 (fallback to original URLs if R2 not configured)
  const uploadedImages = await uploadProductImages(imageUrls, raw.id);
  
  const product = await prisma.product.create({
    data: {
      supplierId,
      supplierSku: raw.id,
      sku: `ZY-${prefix}-${raw.id}`,
      slug,
      title: ai.aiTitle || raw.title,
      description: ai.aiDescription || raw.title,
      imagesJson: uploadedImages, // Use R2 URLs
      price: raw.price * 2.5,
      supplierCost: raw.price,
      stockQuantity: raw.stock,
      category: 'General',
      status: ProductStatus.DRAFT,
      rating: raw.rating,
      aiTitle: ai.aiTitle,
      aiDescription: ai.aiDescription,
      aiMetaTags: ai.metaTags ?? [],
    },
  });

  console.log(`[Product Ingestion] Created product ${product.sku} with ${uploadedImages.length} images`);
}

export async function runProductIngestionJob(): Promise<void> {
  const ae = getAliExpressAdapter();
  const cj = getCjAdapter();
  warnAliExpressDisabled();

  const aeList = isAliExpressConfigured() ? await ae.fetchProducts(1) : [];
  const cjList = await cj.fetchProducts(1);

  const combined = [
    ...aeList.slice(0, 5).map(r => ({ r, supplierId: 'aliexpress' as const })),
    ...cjList.slice(0, 5).map(r => ({ r, supplierId: 'cj' as const })),
  ];

  for (const { r, supplierId } of combined.slice(0, 5)) {
    await ingestFromSource(r, supplierId);
  }

  const products = await prisma.product.findMany({
    where: { status: { in: [ProductStatus.ACTIVE, ProductStatus.LOW] } },
    take: 100,
    select: { id: true },
  });
  for (const p of products) {
    await indexProduct(p.id).catch(() => {});
  }
}
