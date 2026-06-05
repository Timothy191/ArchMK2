import { EventHub } from './event-hub';
import { cacheHits, cacheMisses, requestLatency } from './metrics';

export class StreamProcessor {
  private hub: EventHub;
  private running = false;

  constructor(hub: EventHub) {
    this.hub = hub;
  }

  async start() {
    this.running = true;
    console.log('Stream processor started.');
    
    while (this.running) {
      try {
        const events = await this.hub.readEvents('aggregator-group', 'processor-1');
        
        for (const { data } of events) {
          this.processEvent(data);
        }
      } catch (err) {
        console.error('Error reading stream:', err);
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  }

  private processEvent(event: any) {
    if (event.type === 'HIT') {
      cacheHits.inc({ namespace: event.namespace || 'default', tier: event.source || 'L1' });
    } else if (event.type === 'MISS') {
      cacheMisses.inc({ namespace: event.namespace || 'default' });
    }

    if (event.durationMs) {
      requestLatency.observe({ operation: event.type }, event.durationMs / 1000);
    }
  }

  stop() {
    this.running = false;
  }
}
