import { Redis } from '@upstash/redis';

function makeRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[redis] UPSTASH_REDIS_REST_URL / TOKEN not set — using in-memory fallbacks where applicable');
    }
    return null;
  }
  return new Redis({ url, token });
}

export const redis = makeRedis();

export const KEYS = {
  cart: (userId: string) => `cart:${userId}`,
  session: (sessionId: string) => `session:${sessionId}`,
  productCache: (productId: string) => `product_cache:${productId}`,
  rateLimit: (ip: string) => `rate_limit:${ip}`,
  agentLock: (agentId: string) => `agent_lock:${agentId}`,
  priceCache: (productId: string) => `price:${productId}`,
  /** UPI pay session start (unix ms) for server-side timeout checks */
  upiSession: (orderId: string) => `upi:session:${orderId}`,
  /** Admin TOTP session (12h) — refresh tokens re-use this flag */
  adminMfa: (userId: string) => `admin:mfa:${userId}`,
  agentDisabled: (agentName: string) => `agent:disabled:${agentName}`,
};

export const TTL = {
  CART: 7 * 24 * 3600,
  SESSION: 24 * 3600,
  PRODUCT: 3600,
  PRICE: 900,
  AGENT_LOCK: 300,
  /** 5 minutes — client polls; server honours same window */
  UPI_PAY: 5 * 60,
  ADMIN_MFA: 12 * 3600,
};
