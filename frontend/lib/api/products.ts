import { apiFetch } from './client';

export interface StorefrontProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  featured?: boolean;
  imageUrl?: string;
}

export interface ProductListResponse {
  products: Array<{
    id: string;
    slug: string;
    title: string;
    category: string;
    price: number;
    storefront: StorefrontProduct;
  }>;
  pagination: { page: number; limit: number; total: number; pages: number };
  source?: string;
}

export interface ProductDetailResponse {
  product: {
    id: string;
    slug: string;
    title: string;
    name: string;
    description: string;
    category: string;
    price: number;
    rating: number;
    reviewCount: number;
    totalSales: number;
    imagesJson: unknown;
    status: string;
    originalPrice: number;
    margin: number;
  };
}

export function getProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}): Promise<ProductListResponse> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  if (params.category) q.set('category', params.category);
  const qs = q.toString();
  return apiFetch<ProductListResponse>(`/api/products${qs ? `?${qs}` : ''}`);
}

export function getProductBySlug(slug: string): Promise<ProductDetailResponse> {
  return apiFetch<ProductDetailResponse>(`/api/products/slug/${encodeURIComponent(slug)}`);
}
