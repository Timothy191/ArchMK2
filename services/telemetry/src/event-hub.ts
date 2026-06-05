// AGENT-TRACE: Telemetry collector uses XADD to decouple hit/miss tracking from the main cache response loop to prevent latency spikes.
import Redis from 'ioredis';

export class EventHub {
  private redis: Redis;
  private readonly streamKey = 'amca:telemetry:events';

  constructor(redisUrl = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl);
  }

  async publishEvent(event: any): Promise<void> {
    await this.redis.xadd(
      this.streamKey,
      '*',
      'payload', JSON.stringify(event)
    );
  }

  async readEvents(group: string, consumer: string, count = 10): Promise<any[]> {
    try {
      // Ensure group exists
      await this.redis.xgroup('CREATE', this.streamKey, group, '0', 'MKSTREAM');
    } catch (err: any) {
      if (!err.message.includes('BUSYGROUP')) throw err;
    }

    const results = await this.redis.xreadgroup(
      'GROUP', group, consumer,
      'COUNT', count,
      'BLOCK', 5000,
      'STREAMS', this.streamKey, '>'
    );

    if (!results) return [];

    const messages = (results as any)[0][1];
    const events = [];

    for (const [id, fields] of messages) {
      const payloadStr = fields[1];
      const event = JSON.parse(payloadStr);
      events.push({ id, data: event });
      // Acknowledge the message immediately for simplicity
      await this.redis.xack(this.streamKey, group, id);
    }

    return events;
  }
}
