import Redis, { Cluster } from 'ioredis';

export class L2RedisCache {
  private redis: Redis | Cluster;

  constructor(redisUrls = process.env.REDIS_URLS || 'redis://localhost:6379', isCluster = process.env.REDIS_CLUSTER === 'true') {
    if (isCluster) {
      const nodes = redisUrls.split(',').map(url => {
        const u = new URL(url);
        return { host: u.hostname, port: Number(u.port) };
      });
      this.redis = new Redis.Cluster(nodes);
    } else {
      this.redis = new Redis(redisUrls);
    }
  }

  async get(key: string): Promise<Buffer | null> {
    return this.redis.getBuffer(key);
  }

  async set(key: string, value: Buffer, ttlSec?: number): Promise<void> {
    if (ttlSec) {
      await this.redis.set(key, value, 'EX', ttlSec);
    } else {
      await this.redis.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
