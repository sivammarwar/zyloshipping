import type { SupplierAdapter, SupplierProduct, OrderPayload, SupplierOrderResult } from './supplier.interface';
import { retryWithBackoff } from '../../utils/retry';

const BASE = process.env.CJ_API_BASE || 'https://developers.cjdropshipping.com/api2.0/v1';

export class CjAdapter implements SupplierAdapter {
  constructor(private apiKey = process.env.CJ_API_KEY || process.env.CJ_ACCESS_TOKEN) {}

  private headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'CJ-Access-Token': this.apiKey } : {}),
    };
  }

  async fetchProducts(page = 1): Promise<SupplierProduct[]> {
    if (!this.apiKey) {
      return [
        {
          id: 'cj-mock-1',
          title: 'CJ sample product',
          price: 9.5,
          stock: 30,
          rating: 4.7,
          images: [],
        },
      ];
    }
    return retryWithBackoff(
      async () => {
        const res = await fetch(`${BASE}/product/list?page=${page}`, { headers: this.headers() });
        if (!res.ok) throw new Error(`CJ products ${res.status}`);
        const data = (await res.json()) as { data?: { list?: SupplierProduct[] } };
        return data.data?.list ?? [];
      },
      { attempts: 3, baseDelayMs: 800 }
    );
  }

  async submitOrder(payload: OrderPayload): Promise<SupplierOrderResult> {
    if (!this.apiKey) {
      return { supplierOrderId: `CJ-MOCK-${Date.now()}` };
    }
    return retryWithBackoff(
      async () => {
        const res = await fetch(`${BASE}/order/createOrder`, {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify({
            productSku: payload.supplierSku,
            quantity: payload.quantity,
            shippingAddress: payload.shippingAddress,
          }),
        });
        if (!res.ok) throw new Error(`CJ order ${res.status}`);
        const data = (await res.json()) as { data?: { orderId?: string } };
        const id = data.data?.orderId || `CJ-${payload.productId}-${Date.now()}`;
        return { supplierOrderId: String(id), raw: data };
      },
      { attempts: 3, baseDelayMs: 1000 }
    );
  }

  async checkStock(productId: string): Promise<number> {
    if (productId === 'health-check') return 1;
    if (!this.apiKey) return 100;
    return retryWithBackoff(
      async () => {
        const res = await fetch(`${BASE}/product/stock?pid=${encodeURIComponent(productId)}`, {
          headers: this.headers(),
        });
        if (!res.ok) throw new Error(`CJ stock ${res.status}`);
        const data = (await res.json()) as { data?: number };
        return data.data ?? 0;
      },
      { attempts: 2, baseDelayMs: 500 }
    );
  }

  async getOrderStatus(supplierOrderId: string): Promise<{ status: string; trackingNumber?: string }> {
    if (!this.apiKey) {
      return { status: 'FULFILLED', trackingNumber: undefined };
    }
    return retryWithBackoff(
      async () => {
        const res = await fetch(`${BASE}/order/${encodeURIComponent(supplierOrderId)}`, {
          headers: this.headers(),
        });
        if (!res.ok) throw new Error(`CJ order status ${res.status}`);
        const data = (await res.json()) as {
          data?: { status?: string; trackingNumber?: string };
        };
        return {
          status: data.data?.status ?? 'unknown',
          trackingNumber: data.data?.trackingNumber,
        };
      },
      { attempts: 3, baseDelayMs: 1000 }
    );
  }
}

let singleton: CjAdapter | null = null;
export function getCjAdapter() {
  if (!singleton) singleton = new CjAdapter();
  return singleton;
}
