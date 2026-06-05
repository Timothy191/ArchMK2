import { L1MemoryCache } from './l1-memory';
import { DiskCache } from './disk-cache';
import { L2RedisCache } from './l2-redis';
import { SingleFlight } from './single-flight';

export class CacheAgent {
  private l1: L1MemoryCache;
  private disk: DiskCache;
  private l2: L2RedisCache;
  private flight: SingleFlight<Buffer | null>;

  constructor() {
    this.l1 = new L1MemoryCache();
    this.disk = new DiskCache();
    this.l2 = new L2RedisCache();
    this.flight = new SingleFlight();
  }

  async init(): Promise<void> {
    await this.disk.init();
    console.log('Cache Agent initialized.');
  }

  async get(key: string): Promise<Buffer | null> {
    return this.flight.do(key, async () => {
      // 1. Try L1 (Memory)
      const l1Val = await this.l1.get(key);
      if (l1Val) {
        return l1Val;
      }

      // 2. Try Disk
      const diskVal = await this.disk.get(key);
      if (diskVal) {
        // Backfill L1
        await this.l1.set(key, diskVal);
        return diskVal;
      }

      // 3. Try L2 (Redis)
      const l2Val = await this.l2.get(key);
      if (l2Val) {
        // Backfill Disk and L1
        await this.disk.set(key, l2Val);
        await this.l1.set(key, l2Val);
        return l2Val;
      }

      return null;
    });
  }

  async set(key: string, value: Buffer, ttlSec = 3600): Promise<void> {
    await Promise.all([
      this.l1.set(key, value, ttlSec * 1000),
      this.disk.set(key, value),
      this.l2.set(key, value, ttlSec)
    ]);
  }

  async delete(key: string): Promise<void> {
    await Promise.all([
      this.l1.delete(key),
      this.disk.delete(key),
      this.l2.delete(key)
    ]);
  }

  async shutdown(): Promise<void> {
    await this.l2.disconnect();
  }
}

import { TurboServer } from './turbo-server';

// Simple test/start script execution
if (require.main === module) {
  const agent = new CacheAgent();
  agent.init().then(async () => {
    console.log('CacheAgent is running (standalone mode)');
    
    // Start the Turbo Remote Cache API simulator
    const turboServer = new TurboServer(agent);
    await turboServer.start(process.env.PORT ? parseInt(process.env.PORT) : 3008);
  }).catch(console.error);
}
