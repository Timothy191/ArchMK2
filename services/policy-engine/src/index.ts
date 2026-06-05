// AGENT-TRACE: This entrypoint acts as the daemon subscription loop. It blocks on Redis streams, processing via HotspotAnalyzer, and delegates mitigation to CachePlanner.
import Redis from 'ioredis';
import { HotspotAnalyzer } from '@repo/cache-intelligence/src/hotspot-analyzer';
import { RulesEngine } from './rules-engine';
import { TTLManager } from './ttl-manager';
import { CachePlanner } from './cache-planner';

async function bootstrap() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = new Redis(redisUrl);
  const streamKey = 'amca:telemetry:events';
  const group = 'policy-engine';
  const consumer = 'pe-worker-1';

  const analyzer = new HotspotAnalyzer(60);
  const rules = new RulesEngine();
  const ttlManager = new TTLManager();
  const planner = new CachePlanner(ttlManager);

  // Register first rule: auth:* missRate > 40%
  rules.addRule({
    id: 'auth-hotspot-mitigation',
    condition: (report) => report.pattern.startsWith('auth:') && report.missRate > 0.4,
    actions: [
      { action: 'INCREASE_TTL', keyPattern: 'auth:*', factor: 1.5 },
      { action: 'PROMOTE', keyPattern: 'auth:*' }
    ]
  });

  try {
    await redis.xgroup('CREATE', streamKey, group, '0', 'MKSTREAM');
  } catch (err: any) {
    if (!err.message.includes('BUSYGROUP')) throw err;
  }

  console.log('Policy Engine is running and monitoring telemetry...');

  // In a real system, you'd want a separate interval to generate reports
  setInterval(() => {
    const reports = analyzer.generateReports();
    for (const report of reports) {
      const actions = rules.evaluate(report);
      if (actions.length > 0) {
        planner.executeActions(actions).catch(console.error);
      }
    }
  }, 10000); // Check every 10s for testing

  while (true) {
    try {
      const results = await redis.xreadgroup('GROUP', group, consumer, 'BLOCK', 5000, 'COUNT', 50, 'STREAMS', streamKey, '>');
      if (results) {
        const messages = (results as any)[0][1];
        for (const [id, fields] of messages) {
          const payloadStr = fields[1];
          const event = JSON.parse(payloadStr);
          analyzer.recordEvent(event);
          await redis.xack(streamKey, group, id);
        }
      }
    } catch (err) {
      console.error('Error reading from stream:', err);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

if (require.main === module) {
  bootstrap().catch(console.error);
}
