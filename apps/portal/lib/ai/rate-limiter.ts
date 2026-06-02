/**
 * Redis-backed rate limiter for AI chat endpoints.
 * Uses Token Bucket strategy for distributed rate limiting.
 * Falls back to in-memory if Redis is unavailable.
 */

import { getRedisClient } from "@repo/redis";
import {
  RedisStore,
  MemoryStore,
  TokenBucketStrategy,
} from "@repo/rate-limiter";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

const globalMemoryStore = new MemoryStore();
let globalRedisStore: RedisStore | null = null;
const tokenBucketStrategy = new TokenBucketStrategy();

/**
 * Check if a request from the given IP is within rate limits.
 * Uses Redis-backed token bucket with in-memory fallback.
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  let store;
  try {
    const redis = await getRedisClient();
    if (!globalRedisStore && redis) {
      globalRedisStore = new RedisStore(redis);
    }
    store = globalRedisStore || globalMemoryStore;
  } catch {
    store = globalMemoryStore;
  }

  const result = await tokenBucketStrategy.check(
    `ratelimit:${ip}`,
    MAX_REQUESTS,
    WINDOW_MS,
    store,
  );

  return result.allowed;
}

/**
 * Reset rate limits (for testing).
 */
export function resetRateLimits(): void {
  globalMemoryStore.clear();
}
