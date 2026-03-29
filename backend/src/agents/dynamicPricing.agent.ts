import { ProductStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { invokeGpt4o } from './llm';

export async function runDynamicPricingAgent() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 'singleton' } });
  const markup = settings?.markupPercent ?? 2.5;
  const floor = settings?.priceFloor ?? 99;
  const ceiling = settings?.priceCeiling ?? 99999;

  const products = await prisma.product.findMany({ where: { status: ProductStatus.ACTIVE }, take: 50 });
  const { text } = await invokeGpt4o(
    'dynamic_pricing',
    `Suggest retail prices with markup ${markup}x on supplier cost, clamp [${floor}, ${ceiling}]. Return JSON array { productId, price }.`,
    JSON.stringify(products.map(p => ({ id: p.id, supplierCost: p.supplierCost })))
  );
  let updates: { productId: string; price: number }[] = [];
  try {
    updates = JSON.parse(text);
  } catch {
    updates = products.map(p => ({
      productId: p.id,
      price: Math.min(ceiling, Math.max(floor, p.supplierCost * markup)),
    }));
  }
  for (const u of updates) {
    await prisma.product.update({
      where: { id: u.productId },
      data: { price: u.price },
    });
  }
  return updates.length;
}
