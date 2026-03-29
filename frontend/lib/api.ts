const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  products: {
    list: (params?: { page?: number; limit?: number; search?: string; category?: string; sortBy?: string; sortDir?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.search) query.set('search', params.search);
      if (params?.category && params.category !== 'All') query.set('category', params.category);
      if (params?.sortBy) query.set('sortBy', params.sortBy);
      if (params?.sortDir) query.set('sortDir', params.sortDir);
      return apiFetch<any>(`/api/products?${query.toString()}`);
    },
    getBySlug: (slug: string) => apiFetch<any>(`/api/products/slug/${slug}`),
    stats: (token: string) => apiFetch<any>('/api/products/stats', { token }),
  },
  
  orders: {
    list: (params: { page?: number; limit?: number; search?: string; status?: string; gateway?: string }, token: string) => {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.search) query.set('search', params.search);
      if (params.status && params.status !== 'All') query.set('status', params.status);
      if (params.gateway && params.gateway !== 'All') query.set('gateway', params.gateway);
      return apiFetch<any>(`/api/orders?${query.toString()}`, { token });
    },
    stats: (token: string) => apiFetch<any>('/api/orders/stats', { token }),
    getById: (id: string, token: string) => apiFetch<any>(`/api/orders/${id}`, { token }),
  },

  admin: {
    dashboard: {
      stats: (token: string) => apiFetch<any>('/api/admin/dashboard/stats', { token }),
    },
    products: {
      list: (params: { page?: number; limit?: number; search?: string; category?: string; supplier?: string; status?: string; sortBy?: string; sortDir?: string }, token: string) => {
        const query = new URLSearchParams();
        query.set('page', String(params.page || 1));
        query.set('limit', String(params.limit || 20));
        if (params.search) query.set('search', params.search);
        if (params.category && params.category !== 'All') query.set('category', params.category);
        if (params.supplier && params.supplier !== 'All') query.set('supplier', params.supplier);
        if (params.status && params.status !== 'All') query.set('status', params.status);
        if (params.sortBy) query.set('sortBy', params.sortBy);
        if (params.sortDir) query.set('sortDir', params.sortDir);
        return apiFetch<any>(`/api/admin/products?${query.toString()}`, { 
          token,
          headers: { 'x-admin': 'true' }
        });
      },
      sync: (token: string) => apiFetch<any>('/api/admin/products/sync', { 
        method: 'POST',
        token 
      }),
    },
    orders: {
      list: (params: { page?: number; limit?: number; search?: string; status?: string; gateway?: string }, token: string) => {
        const query = new URLSearchParams();
        query.set('page', String(params.page || 1));
        query.set('limit', String(params.limit || 20));
        if (params.search) query.set('search', params.search);
        if (params.status && params.status !== 'All') query.set('status', params.status);
        if (params.gateway && params.gateway !== 'All') query.set('gateway', params.gateway);
        return apiFetch<any>(`/api/admin/orders?${query.toString()}`, { token });
      },
    },
    agents: {
      status: (token: string) => apiFetch<any>('/api/admin/agents/status', { token }),
    },
  },

  auth: {
    login: (email: string, password: string) => 
      apiFetch<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data: { email: string; password: string; name?: string; phone?: string }) =>
      apiFetch<any>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: (token: string) => apiFetch<any>('/api/auth/me', { token }),
  },
};
