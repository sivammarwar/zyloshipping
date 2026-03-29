import { apiFetch } from './client';

export interface CartItemRow {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    imagesJson: unknown;
    stockQuantity: number;
  };
}

export interface CartResponse {
  cart: {
    id: string;
    userId: string;
    items: CartItemRow[];
    status?: string;
  };
}

export function getCart(): Promise<CartResponse> {
  return apiFetch<CartResponse>('/api/cart');
}

export function addToCart(productId: string, quantity: number): Promise<CartResponse> {
  return apiFetch<CartResponse>('/api/cart/items', {
    method: 'POST',
    json: { productId, quantity },
  });
}

/** Backend keys cart lines by `productId`, not cart-item row id. */
export function updateCartItem(productId: string, quantity: number): Promise<CartResponse> {
  return apiFetch<CartResponse>(`/api/cart/items/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    json: { quantity },
  });
}

export function removeCartItem(productId: string): Promise<CartResponse> {
  return apiFetch<CartResponse>(`/api/cart/items/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
}
