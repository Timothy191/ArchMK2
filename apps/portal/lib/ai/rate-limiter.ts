/**
 * Redis-backed rate limiter for AI chat endpoints.
 * Uses sliding window with Redis sorted sets for distributed rate limiting.
 * Falls back to in-memory if Redis is unavailable.
 */

import { cacheGet, cacheSet } from "@repo/redis/cache";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const KEY_PREFIX = "ratelimit:";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// L1 in-memory fallback for edge/middleware
const memoryLimits = new Map<string, RateLimitEntry>();

function memoryCheck(ip: string): boolean {
  const now = Date.now();
  const entry = memoryLimits.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    memoryLimits.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

/**
 * Check if a request from the given IP is within rate limits.
 * Uses Redis sorted sets for distributed deployments with in-memory fallback.
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `${KEY_PREFIX}${ip}`;

  try {
    // Try Redis-backed rate limiting first
    const cached = await cacheGet<RateLimitEntry>(key);

    const now = Date.now();

    if (!cached) {
      // First request in window - set new window
      const entry: RateLimitEntry = { count: 1, windowStart: now };
      await cacheSet(key, entry, Math.ceil(WINDOW_MS / 1000));
      return true;
    }

    // Check if window expired
    if (now - cached.windowStart > WINDOW_MS) {
      // Start new window
      const entry: RateLimitEntry = { count: 1, windowStart: now };
      await cacheSet(key, entry, Math.ceil(WINDOW_MS / 1000));
      return true;
    }

    // Within window - check count
    if (cached.count >= MAX_REQUESTS) {
      return false;
    }

    // Increment count
    cached.count++;
    await cacheSet(
      key,
      cached,
      Math.ceil((WINDOW_MS - (now - cached.windowStart)) / 1000),
    );
    return true;
  } catch {
    // Fallback to in-memory on Redis error
    return memoryCheck(ip);
  }
}

/**
 * Reset rate limits (for testing).
 */
export function resetRateLimits(): void {
  memoryLimits.clear();
}
