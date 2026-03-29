import { ensureValidToken } from '@/lib/tokenManager';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function addToCart(productId: string, quantity = 1): Promise<void> {
  const token = await ensureValidToken();
  if (!token) throw new Error('You must be signed in to add items to your cart.');

  const res = await fetch(`${BASE}/api/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, quantity }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ?? `Add to cart failed: ${res.status}`,
    );
  }

  // Notify the Header cart badge
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cart-updated'));
  }
}

export async function getCart() {
  const token = await ensureValidToken();
  if (!token) return null;

  const res = await fetch(`${BASE}/api/cart`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) return null;
  return res.json();
}

export async function updateCartItem(itemId: string, quantity: number): Promise<void> {
  const token = await ensureValidToken();
  if (!token) throw new Error('Not authenticated.');

  const res = await fetch(`${BASE}/api/cart/items/${itemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quantity }),
  });

  if (!res.ok) throw new Error(`Update failed: ${res.status}`);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cart-updated'));
  }
}

export async function removeCartItem(itemId: string): Promise<void> {
  const token = await ensureValidToken();
  if (!token) throw new Error('Not authenticated.');

  const res = await fetch(`${BASE}/api/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Remove failed: ${res.status}`);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cart-updated'));
  }
}