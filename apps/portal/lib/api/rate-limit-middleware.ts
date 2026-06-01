/**
 * API Rate Limiting Middleware
 *
 * Provides rate limiting for API endpoints using Redis-backed distributed limiting
 * with in-memory fallback. Supports different limit types per endpoint category.
 */

import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@repo/redis/cache";
import { getRateLimitConfig } from "./rate-limit-config";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// In-memory fallback for edge/middleware scenarios
const memoryLimits = new Map<string, RateLimitEntry>();

function pruneMemoryLimits(windowMs: number): void {
  const cutoff = Date.now() - windowMs;
  for (const [key, entry] of memoryLimits) {
    if (entry.windowStart < cutoff) memoryLimits.delete(key);
  }
}

/**
 * Check rate limit for a given identifier and configuration
 */
async function checkRateLimit(
  identifier: string,
  config: { windowMs: number; maxRequests: number },
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;

  try {
    // Try Redis-backed rate limiting first
    const cached = await cacheGet<RateLimitEntry>(key);

    if (!cached || cached.windowStart !== windowStart) {
      // First request in window or new window
      const entry: RateLimitEntry = { count: 1, windowStart };
      await cacheSet(key, entry, Math.ceil(config.windowMs / 1000));

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: windowStart + config.windowMs,
      };
    }

    // Within current window
    if (cached.count >= config.maxRequests) {
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: windowStart + config.windowMs,
        retryAfter: Math.ceil((windowStart + config.windowMs - now) / 1000),
      };
    }

    // Increment count
    cached.count++;
    await cacheSet(
      key,
      cached,
      Math.ceil((windowStart + config.windowMs - now) / 1000),
    );

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - cached.count,
      resetTime: windowStart + config.windowMs,
    };
  } catch {
    // Fallback to in-memory on Redis error
    return checkRateLimitMemory(identifier, config, now);
  }
}

/**
 * In-memory rate limiting fallback
 */
function checkRateLimitMemory(
  identifier: string,
  config: { windowMs: number; maxRequests: number },
  now: number,
): RateLimitResult {
  const key = `memory:${identifier}`;
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
  const entry = memoryLimits.get(key);

  if (!entry || entry.windowStart !== windowStart) {
    pruneMemoryLimits(config.windowMs);
    memoryLimits.set(key, { count: 1, windowStart });
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: windowStart + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: windowStart + config.windowMs,
      retryAfter: Math.ceil((windowStart + config.windowMs - now) / 1000),
    };
  }

  entry.count++;
  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetTime: windowStart + config.windowMs,
  };
}

/**
 * Extract client identifier from request
 */
function getClientIdentifier(request: Request | NextRequest): string {
  // Try to get real IP, fallback to user ID if authenticated
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp =
    forwarded?.split(",")[0]?.trim() ||
    ("ip" in request ? request.ip : undefined);

  // For authenticated requests, use user ID for more precise limiting
  const userId = request.headers.get("x-user-id");
  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${realIp || "unknown"}`;
}

/**
 * Rate limiting middleware for API routes
 */
export async function withRateLimit(
  request: Request | NextRequest,
  handler: () => Promise<NextResponse>,
  options?: {
    customLimit?: { windowMs: number; maxRequests: number };
    skipIf?: (_request: Request | NextRequest) => boolean;
  },
): Promise<NextResponse> {
  // Skip rate limiting if condition is met
  if (options?.skipIf?.(request)) {
    return handler();
  }

  const path = new URL(request.url).pathname;
  const config = options?.customLimit || getRateLimitConfig(path);
  const identifier = getClientIdentifier(request);

  const result = await checkRateLimit(identifier, config);

  if (!result.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: `Too many requests. Try again in ${result.retryAfter || 60} seconds.`,
        retryAfter: result.retryAfter || 60,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetTime.toString(),
          "Retry-After": (result.retryAfter || 60).toString(),
        },
      },
    );
  }

  const response = await handler();

  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.resetTime.toString());

  return response;
}

/**
 * Skip rate limiting for internal requests
 */
export function skipForInternal(request: Request | NextRequest): boolean {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) return false;

  const internalSecret = request.headers.get("x-internal-secret") || "";
  if (internalSecret.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(internalSecret), Buffer.from(expected));
  } catch {
    return false;
  }
}
