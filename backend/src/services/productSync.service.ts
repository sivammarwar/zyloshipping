import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface SupplierProduct {
  externalId: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  sku: string;
  stockQuantity: number;
}

export async function syncProductsFromSupplier(supplierId: string): Promise<{ synced: number; errors: string[] }> {
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  
  if (!supplier) {
    throw new Error('Supplier not found');
  }

  let products: SupplierProduct[] = [];
  const errors: string[] = [];

  try {
    if (supplier.name === 'AliExpress') {
      products = await fetchFromAliExpress(supplier.apiKey || '');
    } else if (supplier.name === 'CJ Dropshipping') {
      products = await fetchFromCJ(supplier.apiKey || '');
    } else {
      throw new Error(`Unsupported supplier: ${supplier.name}`);
    }
  } catch (error) {
    errors.push(`Failed to fetch from ${supplier.name}: ${(error as Error).message}`);
    return { synced: 0, errors };
  }

  let synced = 0;
  for (const product of products) {
    try {
      const slug = slugify(product.title);
      const supplierCost = product.price;
      const markup = 2.5;
      const price = Math.round(supplierCost * markup * 100) / 100;

      await prisma.product.upsert({
        where: { 
          sku: product.sku || `${supplier.name.toUpperCase()}-${product.externalId}` 
        },
        create: {
          sku: product.sku || `${supplier.name.toUpperCase()}-${product.externalId}`,
          slug,
          title: product.title,
          description: product.description,
          category: product.category || 'Uncategorized',
          price,
          supplierCost,
          stockQuantity: product.stockQuantity,
          status: product.stockQuantity > 0 ? 'ACTIVE' : 'HIDDEN',
          supplierId: supplier.id,
          imagesJson: product.images,
          rating: 0,
          totalSales: 0,
        },
        update: {
          title: product.title,
          description: product.description,
          category: product.category || 'Uncategorized',
          price,
          supplierCost,
          stockQuantity: product.stockQuantity,
          status: product.stockQuantity > 0 ? 'ACTIVE' : 'HIDDEN',
          imagesJson: product.images,
        },
      });
      synced++;
    } catch (error) {
      errors.push(`Failed to sync ${product.title}: ${(error as Error).message}`);
    }
  }

  await prisma.supplier.update({
    where: { id: supplierId },
    data: { lastSyncAt: new Date() },
  });

  return { synced, errors };
}

async function fetchFromAliExpress(apiKey: string): Promise<SupplierProduct[]> {
  if (!apiKey) {
    throw new Error('AliExpress API key not configured');
  }

  const response = await axios.get('https://api.aliexpress.com/v1/products', {
    headers: { 'Authorization': `Bearer ${apiKey}` },
    params: { limit: 100 },
    timeout: 30000,
  });

  return response.data.products.map((p: any) => ({
    externalId: p.id,
    title: p.title,
    description: p.description || '',
    price: parseFloat(p.price),
    images: p.images || [],
    category: p.category || 'Uncategorized',
    sku: p.sku || `ALI-${p.id}`,
    stockQuantity: p.stock || 0,
  }));
}

async function fetchFromCJ(apiKey: string): Promise<SupplierProduct[]> {
  if (!apiKey) {
    throw new Error('CJ Dropshipping API key not configured');
  }

  const response = await axios.post('https://developers.cjdropshipping.com/api2.0/v1/product/list', {
    pageNum: 1,
    pageSize: 100,
  }, {
    headers: { 
      'CJ-Access-Token': apiKey,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  if (response.data.code !== 200) {
    throw new Error(`CJ API error: ${response.data.message}`);
  }

  return response.data.data.list.map((p: any) => ({
    externalId: p.pid,
    title: p.productNameEn,
    description: p.description || '',
    price: parseFloat(p.sellPrice),
    images: p.productImage ? [p.productImage] : [],
    category: p.categoryName || 'Uncategorized',
    sku: p.productSku || `CJ-${p.pid}`,
    stockQuantity: p.stockQuantity || 0,
  }));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
