import {
  cacheGetWithStats,
  cacheSetWithTags,
  CacheCategory,
  CACHE_TTL_REGISTRY,
  buildCacheKey,
} from "@repo/redis";
import { DatabaseError } from "@repo/errors";

interface WithCacheOptions {
  category: CacheCategory;
  keyParts?: (string | number | undefined)[];
  tags?: string[];
  fallback?: boolean;
}

/**
 * Portal-specific caching wrapper.
 *
 * 1. Builds key via buildCacheKey(category, ...keyParts).
 * 2. Looks up TTL from CACHE_TTL_REGISTRY.
 * 3. On cache hit → returns immediately.
 * 4. On miss → executes fn().
 * 5. DatabaseError from fn → rethrown immediately (not cached).
 * 6. Generic error + fallback === true + stale cache → returns stale value.
 * 7. Redis unreachable → executes fn() directly (graceful degradation).
 */
export async function withCache<T>(
  fn: () => Promise<T>,
  options: WithCacheOptions,
): Promise<T> {
  const { category, keyParts = [], tags, fallback = true } = options;

  const key = buildCacheKey(category, ...keyParts);
  const ttlConfig = CACHE_TTL_REGISTRY[category];

  // Try cache first
  const cached = await cacheGetWithStats<T>(key);
  if (cached.value !== null) {
    return cached.value;
  }

  try {
    const result = await fn();
    await cacheSetWithTags(key, result, ttlConfig.l2Seconds, tags);
    return result;
  } catch (err) {
    // Do not cache DatabaseError — rethrow immediately
    if (err instanceof DatabaseError) {
      throw err;
    }

    // Fallback to stale cached value if available
    if (fallback && cached.value !== null) {
      return cached.value;
    }

    throw err;
  }
}
