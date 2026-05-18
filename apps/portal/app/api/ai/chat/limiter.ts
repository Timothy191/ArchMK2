const rateLimits = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimits.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

export function resetRateLimits(): void {
  rateLimits.clear();
}
