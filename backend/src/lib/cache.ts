/**
 * Redis caching layer for high-performance data access
 * Scales from free tier (Upstash) to enterprise Redis without code changes
 * Just upgrade your Redis plan when traffic increases
 */

import { Redis } from 'ioredis';

// Get Redis URL with proper fallback
const getRedisUrl = () => {
  // Check for standard Redis URL first
  if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('redis')) {
    return process.env.REDIS_URL;
  }
  // Skip Upstash REST URL - it uses HTTPS and won't work with ioredis
  // Return null to disable Redis (app works without caching)
  return null;
};

const redisUrl = getRedisUrl();

// Initialize Redis only if valid URL provided
const redis = redisUrl ? new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  lazyConnect: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
}) : null;

redis?.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis?.on('connect', () => {
  console.log('✓ Redis connected');
});

/**
 * Cache wrapper with automatic serialization
 * TTL in seconds (default: 5 minutes)
 */
export const cache = {
  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set cached value with TTL
   */
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    if (!redis) return;
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  },

  /**
   * Delete cached value
   */
  async del(key: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache del error for key ${key}:`, error);
    }
  },

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache delPattern error for pattern ${pattern}:`, error);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!redis) return false;
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Increment counter (for rate limiting, analytics)
   */
  async incr(key: string, ttl?: number): Promise<number> {
    if (!redis) return 0;
    try {
      const value = await redis.incr(key);
      if (ttl && value === 1) {
        await redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  },

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    await this.set(key, fresh, ttl);
    return fresh;
  },
};

export default redis;
