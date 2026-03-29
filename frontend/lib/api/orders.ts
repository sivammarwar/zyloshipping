import { apiFetch } from './client';

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{ quantity: number; product: { title: string } }>;
}

export interface OrdersListResponse {
  orders: OrderSummary[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function getOrders(params?: { page?: number; limit?: number; search?: string }) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return apiFetch<OrdersListResponse>(`/api/orders${qs ? `?${qs}` : ''}`);
}

export function getOrder(id: string) {
  return apiFetch<{ order: unknown }>(`/api/orders/${encodeURIComponent(id)}`);
}

export function createOrder(body: {
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: Record<string, string>;
  couponCode?: string;
  note?: string;
}) {
  return apiFetch<{ order: unknown }>('/api/orders', {
    method: 'POST',
    json: body,
  });
}
