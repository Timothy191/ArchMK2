import express, { Request, Response } from 'express';
import { EventHub } from './event-hub';
import { register } from './metrics';

export class TelemetryCollector {
  private app = express();
  private hub: EventHub;

  constructor(hub: EventHub) {
    this.hub = hub;
    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.post('/collect', async (req: Request, res: Response) => {
      const events = Array.isArray(req.body) ? req.body : [req.body];
      
      for (const event of events) {
        await this.hub.publishEvent({
          timestamp: Date.now(),
          ...event
        });
      }
      
      res.status(202).send({ status: 'queued' });
    });

    this.app.get('/metrics', async (req: Request, res: Response) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });
  }

  start(port = 4000) {
    this.app.listen(port, () => {
      console.log(`Telemetry Collector API listening on port ${port}`);
    });
  }
}
