/**
 * API Rate Limiting Middleware
 *
 * Provides rate limiting for API endpoints using Redis-backed distributed limiting
 * with in-memory fallback. Supports different limit types per endpoint category.
 */

import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getRedisClient } from "@repo/redis";
import {
  RedisStore,
  MemoryStore,
  FixedWindowStrategy,
  TokenBucketStrategy,
  RateLimitResult,
} from "@repo/rate-limiter";
import os from "os";
import { getRateLimitConfig } from "./rate-limit-config";

const WHITELISTED_IPS = new Set(
  (process.env.RATE_LIMIT_IP_WHITELIST || "127.0.0.1,::1,::ffff:127.0.0.1")
    .split(",")
    .map((ip) => ip.trim()),
);

function isIpWhitelisted(ip: string): boolean {
  return WHITELISTED_IPS.has(ip);
}

function getClientIp(request: Request | NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp =
    forwarded?.split(",")[0]?.trim() ||
    ("ip" in request ? (request as any).ip : undefined);
  return realIp || "unknown";
}

function isSystemUnderHighLoad(): boolean {
  if (process.env.NODE_ENV === "test" && !process.env.ENABLE_LOAD_ADAPTIVE_TEST)
    return false;
  try {
    const load = os.loadavg()[0]; // 1-minute load average
    if (load === undefined) return false;
    const cpus = os.cpus().length;
    return load / cpus > 0.85; // System load is high if >85% CPU capacity
  } catch {
    return false;
  }
}

// Singleton stores and strategies for performance and connection pooling
const globalMemoryStore = new MemoryStore();
let globalRedisStore: RedisStore | null = null;

const fixedWindowStrategy = new FixedWindowStrategy();
const tokenBucketStrategy = new TokenBucketStrategy();

/**
 * Check rate limit for a given identifier and configuration
 */
async function checkRateLimit(
  identifier: string,
  config: { windowMs: number; maxRequests: number },
  path: string,
): Promise<RateLimitResult> {
  let store;
  try {
    const redisClient = await getRedisClient();
    if (!globalRedisStore && redisClient) {
      globalRedisStore = new RedisStore(redisClient);
    }
    store = globalRedisStore || globalMemoryStore;
  } catch {
    store = globalMemoryStore;
  }

  // Token Bucket Strategy for bursty AI calls, Fixed Window for all others
  const strategy = path.startsWith("/api/ai/")
    ? tokenBucketStrategy
    : fixedWindowStrategy;

  const key = `ratelimit:${identifier}`;
  return strategy.check(key, config.maxRequests, config.windowMs, store);
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

  // 1. IP Whitelist Bypass check
  const clientIp = getClientIp(request);
  if (isIpWhitelisted(clientIp)) {
    return handler();
  }

  const path = new URL(request.url).pathname;
  let config = options?.customLimit || getRateLimitConfig(path);

  // 2. Load-Adaptive Throttling: Scale down the rate limit if system CPU load is high
  if (isSystemUnderHighLoad()) {
    config = {
      windowMs: config.windowMs,
      maxRequests: Math.max(1, Math.floor(config.maxRequests * 0.5)),
    };
  }

  const identifier = getClientIdentifier(request);
  const result = await checkRateLimit(identifier, config, path);

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

/**
 * Reset middleware rate limits (for testing).
 */
export function resetMiddlewareRateLimits(): void {
  globalMemoryStore.clear();
}
