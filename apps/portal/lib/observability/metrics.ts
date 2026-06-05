interface MetricEntry {
  count: number;
  errors: number;
  totalDurationMs: number;
}

const globalObj = globalThis as any;
globalObj.__jobMetrics =
  globalObj.__jobMetrics || new Map<string, MetricEntry>();
globalObj.__dbMetrics = globalObj.__dbMetrics || new Map<string, MetricEntry>();

const jobMetrics = globalObj.__jobMetrics;
const dbMetrics = globalObj.__dbMetrics;

/**
 * Record the execution duration and outcome of a background job.
 */
export function recordJobExecution(
  jobId: string,
  durationMs: number,
  success: boolean,
): void {
  // 1. Local update
  const entry = jobMetrics.get(jobId) || {
    count: 0,
    errors: 0,
    totalDurationMs: 0,
  };
  entry.count++;
  if (!success) entry.errors++;
  entry.totalDurationMs += durationMs;
  jobMetrics.set(jobId, entry);

  // 2. Redis sync (fire-and-forget)
  import("@repo/redis")
    .then(({ getRedisClient }) => {
      getRedisClient()
        .then((redis) => {
          if (redis?.isOpen) {
            const key = `metrics:job:${jobId}`;
            redis.hIncrBy(key, "count", 1).catch(() => {});
            if (!success) {
              redis.hIncrBy(key, "errors", 1).catch(() => {});
            }
            redis
              .hIncrByFloat(key, "totalDurationMs", durationMs)
              .catch(() => {});
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

/**
 * Record the timing and outcome of a database query or operation.
 */
export function recordDbQuery(
  tableName: string,
  operation: string,
  durationMs: number,
  success: boolean,
): void {
  // 1. Local update
  const key = `${tableName}:${operation}`;
  const entry = dbMetrics.get(key) || {
    count: 0,
    errors: 0,
    totalDurationMs: 0,
  };
  entry.count++;
  if (!success) entry.errors++;
  entry.totalDurationMs += durationMs;
  dbMetrics.set(key, entry);

  // 2. Redis sync (fire-and-forget)
  import("@repo/redis")
    .then(({ getRedisClient }) => {
      getRedisClient()
        .then((redis) => {
          if (redis?.isOpen) {
            const redisKey = `metrics:db:${tableName}:${operation}`;
            redis.hIncrBy(redisKey, "count", 1).catch(() => {});
            if (!success) {
              redis.hIncrBy(redisKey, "errors", 1).catch(() => {});
            }
            redis
              .hIncrByFloat(redisKey, "totalDurationMs", durationMs)
              .catch(() => {});
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

/**
 * Get merged metrics from both local memory and Redis.
 */
export async function getObservabilityMetrics() {
  const mergedJobs = new Map<string, MetricEntry>(jobMetrics);
  const mergedDb = new Map<string, MetricEntry>(dbMetrics);

  try {
    const { getRedisClient } = await import("@repo/redis");
    const redis = await getRedisClient();
    if (redis?.isOpen) {
      // Fetch job keys from Redis
      const jobKeys = await redis.keys("metrics:job:*");
      for (const key of jobKeys) {
        const jobId = key.substring("metrics:job:".length);
        const data = await redis.hGetAll(key);
        if (data && data.count) {
          mergedJobs.set(jobId, {
            count: parseInt(data.count || "0", 10),
            errors: parseInt(data.errors || "0", 10),
            totalDurationMs: parseFloat(data.totalDurationMs || "0"),
          });
        }
      }

      // Fetch db keys from Redis
      const dbKeys = await redis.keys("metrics:db:*");
      for (const key of dbKeys) {
        const keyWithoutPrefix = key.substring("metrics:db:".length);
        const data = await redis.hGetAll(key);
        if (data && data.count) {
          mergedDb.set(keyWithoutPrefix, {
            count: parseInt(data.count || "0", 10),
            errors: parseInt(data.errors || "0", 10),
            totalDurationMs: parseFloat(data.totalDurationMs || "0"),
          });
        }
      }
    }
  } catch {
    // Ignore and return local maps as fallback
  }

  return {
    jobMetrics: mergedJobs,
    dbMetrics: mergedDb,
  };
}

/**
 * Clear all accumulated metrics (useful for testing).
 */
export function clearObservabilityMetrics(): void {
  jobMetrics.clear();
  dbMetrics.clear();

  import("@repo/redis")
    .then(({ getRedisClient }) => {
      getRedisClient()
        .then((redis) => {
          if (redis?.isOpen) {
            redis
              .keys("metrics:job:*")
              .then((keys) => {
                if (keys.length > 0) redis.del(keys).catch(() => {});
              })
              .catch(() => {});
            redis
              .keys("metrics:db:*")
              .then((keys) => {
                if (keys.length > 0) redis.del(keys).catch(() => {});
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}
