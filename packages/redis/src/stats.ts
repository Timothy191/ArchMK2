interface CacheStatsSnapshot {
  hits: number;
  misses: number;
  l1Hits: number;
  l2Hits: number;
  redisErrors: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
}

const stats = {
  hits: 0,
  misses: 0,
  l1Hits: 0,
  l2Hits: 0,
  redisErrors: 0,
};

const LATENCY_BUFFER_SIZE = 1000;
const latencies: number[] = [];

function addLatency(latencyMs: number): void {
  if (latencies.length >= LATENCY_BUFFER_SIZE) {
    latencies.shift();
  }
  latencies.push(latencyMs);
}

function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)] ?? 0;
}

function buildSnapshot(): CacheStatsSnapshot {
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg =
    sorted.length > 0
      ? sorted.reduce((sum, v) => sum + v, 0) / sorted.length
      : 0;

  return {
    hits: stats.hits,
    misses: stats.misses,
    l1Hits: stats.l1Hits,
    l2Hits: stats.l2Hits,
    redisErrors: stats.redisErrors,
    avgLatencyMs: Math.round(avg * 100) / 100,
    p95LatencyMs: Math.round(computePercentile(sorted, 95) * 100) / 100,
  };
}

export function recordCacheHit(source: "l1" | "l2", latencyMs: number): void {
  stats.hits++;
  if (source === "l1") stats.l1Hits++;
  else stats.l2Hits++;
  addLatency(latencyMs);
}

export function recordCacheMiss(latencyMs: number): void {
  stats.misses++;
  addLatency(latencyMs);
}

export function recordRedisError(): void {
  stats.redisErrors++;
}

export function getCacheStats(): CacheStatsSnapshot {
  return buildSnapshot();
}

export function resetCacheStats(): void {
  stats.hits = 0;
  stats.misses = 0;
  stats.l1Hits = 0;
  stats.l2Hits = 0;
  stats.redisErrors = 0;
  latencies.length = 0;
}
