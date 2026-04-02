/**
 * Redis caching layer - DISABLED for Railway deployment
 * Railway PostgreSQL doesn't include Redis, so we use in-memory fallbacks
 */

// Redis is disabled - no REDIS_URL configured in Railway
const redis = null;

export const cache = {
  async get<T>(_key: string): Promise<T | null> {
    return null; // No caching
  },

  async set(_key: string, _value: any, _ttl?: number): Promise<void> {
    // No-op
  },

  async del(_key: string): Promise<void> {
    // No-op
  },

  async delPattern(_pattern: string): Promise<void> {
    // No-op
  },

  async exists(_key: string): Promise<boolean> {
    return false;
  },

  async incr(_key: string, _ttl?: number): Promise<number> {
    return 0;
  },

  async getOrSet<T>(
    _key: string,
    fetchFn: () => Promise<T>,
    _ttl?: number
  ): Promise<T> {
    return fetchFn(); // Always fetch fresh data
  },
};

export default redis;
