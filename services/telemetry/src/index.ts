import { EventHub } from './event-hub';
import { TelemetryCollector } from './collector';
import { StreamProcessor } from './stream-processor';

async function bootstrap() {
  const hub = new EventHub();
  
  const processor = new StreamProcessor(hub);
  const collector = new TelemetryCollector(hub);

  // Start HTTP collector
  collector.start(process.env.PORT ? parseInt(process.env.PORT) : 4000);
  
  // Start Redis Stream processor
  processor.start().catch(console.error);
  
  console.log('Telemetry Service is up and running.');
}

if (require.main === module) {
  bootstrap().catch(console.error);
}
