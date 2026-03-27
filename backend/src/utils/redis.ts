import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cart key pattern: cart:{userId}  TTL: 7 days
// Session:          session:{sessionId}  TTL: 24h
// Product cache:    product:{productId}  TTL: 1h
// Rate limit:       rate_limit:{ip}

export const keys = {
  cart:         (userId: string)     => `cart:${userId}`,
  session:      (sessionId: string)  => `session:${sessionId}`,
  productCache: (productId: string)  => `product:${productId}`,
  rateLimit:    (ip: string)         => `rate_limit:${ip}`,
};
