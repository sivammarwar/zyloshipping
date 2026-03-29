import type { SupplierAdapter, SupplierProduct, OrderPayload, SupplierOrderResult } from './supplier.interface';
import { retryWithBackoff } from '../../utils/retry';
import { isAliExpressConfigured, warnAliExpressDisabled } from '../../utils/supplierConfig';

const BASE = 'https://api-sg.aliexpress.com/sync';

export class AliExpressAdapter implements SupplierAdapter {
  constructor(private appKey = process.env.ALIEXPRESS_APP_KEY) {}

  async fetchProducts(page = 1): Promise<SupplierProduct[]> {
    warnAliExpressDisabled();
    if (!this.appKey) {
      return [];
    }
    return retryWithBackoff(
      async () => {
        const res = await fetch(`${BASE}?method=aliexpress.ds.product.get&page=${page}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error(`AliExpress products ${res.status}`);
        const data = (await res.json()) as { products?: SupplierProduct[] };
        return data.products ?? [];
      },
      { attempts: 3, baseDelayMs: 800 }
    );
  }

  async submitOrder(payload: OrderPayload): Promise<SupplierOrderResult> {
    if (!this.appKey) {
      throw new Error('AliExpress adapter disabled — credentials not configured');
    }
    return retryWithBackoff(
      async () => {
        const res = await fetch(`${BASE}?method=aliexpress.ds.order.create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: payload.supplierSku || payload.productId,
            quantity: payload.quantity,
            logistics_address: payload.shippingAddress,
          }),
        });
        if (!res.ok) throw new Error(`AliExpress order ${res.status}`);
        const data = (await res.json()) as { order_id?: string; aliexpress_order_id?: string };
        const id = data.order_id || data.aliexpress_order_id || `AE-${payload.productId}-${Date.now()}`;
        return { supplierOrderId: String(id), raw: data };
      },
      { attempts: 3, baseDelayMs: 1000 }
    );
  }

  async checkStock(productId: string): Promise<number> {
    if (productId === 'health-check') return 1;
    if (!this.appKey) {
      throw new Error('AliExpress not configured');
    }
    return retryWithBackoff(
      async () => {
        const res = await fetch(
          `${BASE}?method=aliexpress.ds.product.get&product_id=${encodeURIComponent(productId)}`
        );
        if (!res.ok) throw new Error(`stock ${res.status}`);
        const data = (await res.json()) as { stock?: number };
        return data.stock ?? 0;
      },
      { attempts: 2, baseDelayMs: 500 }
    );
  }
}

let singleton: AliExpressAdapter | null = null;
export function getAliExpressAdapter() {
  if (!singleton) singleton = new AliExpressAdapter();
  return singleton;
}
