import { createClient, RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let client: RedisClientType | null = null;

/**
 * Get or create the singleton Redis client.
 * Reuses the same connection across calls.
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (client?.isOpen) return client;

  client = createClient({ url: REDIS_URL });

  client.on("error", (err) => {
    console.error("Redis Client Error", err);
  });

  await client.connect();
  return client;
}

/**
 * Gracefully close the Redis connection.
 * Call on shutdown or test cleanup.
 */
export async function closeRedis(): Promise<void> {
  if (client?.isOpen) {
    await client.quit();
    client = null;
  }
}
