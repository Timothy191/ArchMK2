import { LRUCache } from 'lru-cache';

export class L1MemoryCache {
  private cache: LRUCache<string, Buffer>;

  constructor(maxSizeMb = 50) {
    this.cache = new LRUCache({
      maxSize: maxSizeMb * 1024 * 1024,
      sizeCalculation: (value) => value.length,
      ttl: 1000 * 60 * 5, // 5 minutes default
    });
  }

  async get(key: string): Promise<Buffer | null> {
    const val = this.cache.get(key);
    return val || null;
  }

  async set(key: string, value: Buffer, ttlMs?: number): Promise<void> {
    if (ttlMs) {
      this.cache.set(key, value, { ttl: ttlMs });
    } else {
      this.cache.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}
