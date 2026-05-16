// Simple in-memory cache fallback for edge/middleware environments
const memoryCache = new Map<string, { value: string; expires: number }>();

function memoryGet<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    memoryCache.delete(key);
    return null;
  }
  return JSON.parse(item.value) as T;
}

function memorySet<T>(key: string, value: T, ttlSeconds: number): void {
  memoryCache.set(key, {
    value: JSON.stringify(value),
    expires: Date.now() + ttlSeconds * 1000,
  });
}

// Try to import Redis client, fallback to memory cache if unavailable
async function getRedisClientSafe() {
  try {
    const { getRedisClient } = await import("./client");
    return await getRedisClient();
  } catch {
    return null;
  }
}

/**
 * Get a cached value by key.
 * Returns null if not found or on error.
 * Falls back to in-memory cache in edge environments.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = await getRedisClientSafe();
    if (!redis) {
      return memoryGet<T>(key);
    }
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return memoryGet<T>(key);
  }
}

/**
 * Store a value in cache with a TTL (seconds).
 * Falls back to in-memory cache in edge environments.
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  try {
    const redis = await getRedisClientSafe();
    if (!redis) {
      memorySet(key, value, ttlSeconds);
      return;
    }
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch {
    memorySet(key, value, ttlSeconds);
  }
}

/**
 * Wrap a function with Redis caching.
 * If the key exists in cache, returns it; otherwise calls fn, stores result, and returns it.
 */
export async function cacheWrap<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const result = await fn();
  await cacheSet(key, result, ttlSeconds);
  return result;
}

/**
 * Delete a specific key from cache.
 * Also removes from memory cache if Redis unavailable.
 */
export async function cacheDelete(key: string): Promise<void> {
  // Always delete from memory cache
  memoryCache.delete(key);
  
  try {
    const redis = await getRedisClientSafe();
    if (redis) {
      await redis.del(key);
    }
  } catch {
    // Silent fail - memory cache already deleted
  }
}

/**
 * Delete all keys matching a pattern.
 * Use with caution — scans all keys.
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  // Delete matching keys from memory cache
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern.replace('*', ''))) {
      memoryCache.delete(key);
    }
  }
  
  try {
    const redis = await getRedisClientSafe();
    if (redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    }
  } catch {
    // Silent fail - memory cache already deleted
  }
}
