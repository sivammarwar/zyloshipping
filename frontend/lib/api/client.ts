/**
 * Browser and RSC-safe API base URL.
 * Server-side proxies should prefer BACKEND_URL for internal networking.
 */
export const API_BASE =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000').replace(/\/$/, '')
    : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiFetchOptions = RequestInit & {
  json?: unknown;
};

/**
 * Fetch JSON from the Express API with credentials (JWT cookies).
 */
export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const { json, headers, ...rest } = opts;
  const init: RequestInit = {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  };

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    throw new ApiError(`Network failure: ${msg}`, 0, undefined);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const errMsg =
      typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : res.statusText;
    throw new ApiError(errMsg || `HTTP ${res.status}`, res.status, data);
  }

  return data as T;
}
