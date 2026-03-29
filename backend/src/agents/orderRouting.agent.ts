import { prisma } from '../db/prisma';
import { invokeGpt4o } from './llm';
import { getAliExpressAdapter } from '../services/supplier/aliexpress.adapter';
import { getCjAdapter } from '../services/supplier/cj.adapter';

export async function runOrderRoutingAgent(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) return null;

  const ae = getAliExpressAdapter();
  const cj = getCjAdapter();
  const sku = order.items[0]?.product.supplierSku || order.items[0]?.productId || '';
  const stockAe = await ae.checkStock(sku).catch(() => 0);
  const stockCj = await cj.checkStock(sku).catch(() => 0);

  const { text } = await invokeGpt4o(
    'order_routing',
    'Pick best supplier id aliexpress or cj based on stock and cost. Return JSON { supplierId: string, reason: string }.',
    JSON.stringify({ items: order.items, stockAe, stockCj })
  );
  try {
    return JSON.parse(text) as { supplierId: string; reason: string };
  } catch {
    return { supplierId: stockAe >= stockCj ? 'aliexpress' : 'cj', reason: 'stock heuristic' };
  }
}
