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
    const { getRedisClient } = await import("./client.js");
    return await getRedisClient();
  } catch {
    return null;
  }
}

/**
 * Get a cached value by key.
 * Checks L1 (In-Memory) first for ultra-low latency, then falls back to L2 (Redis).
 * Returns null if not found or on error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  // 1. Check L1 Cache (Local Memory) first - speed: < 0.1ms
  const l1Value = memoryGet<T>(key);
  if (l1Value !== null) {
    return l1Value;
  }

  // 2. Miss in L1, check L2 Cache (Redis)
  try {
    const redis = await getRedisClientSafe();
    if (!redis) {
      return null;
    }
    const value = await redis.get(key);
    if (value) {
      const parsed = JSON.parse(value) as T;
      
      // Populate L1 cache with a short TTL (15s) to accelerate subsequent near-term reads
      memorySet(key, parsed, 15);
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Store a value in cache with a TTL (seconds).
 * Writes to both L1 (Memory) and L2 (Redis) - Write-Through.
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  // 1. Write to L1 Cache (Local Memory) - cap L1 TTL at 30s to keep memory footprint lean
  const l1Ttl = Math.min(ttlSeconds, 30);
  memorySet(key, value, l1Ttl);

  // 2. Write to L2 Cache (Redis)
  try {
    const redis = await getRedisClientSafe();
    if (redis) {
      await redis.setEx(key, ttlSeconds, JSON.stringify(value));
    }
  } catch (err) {
    console.warn("L2 Redis write failed, relying exclusively on L1 cache:", err);
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
