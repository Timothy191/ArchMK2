import express, { Request, Response } from 'express';
import { CacheAgent } from './index';
import * as http from 'http';

export class TurboServer {
  private app = express();
  private server: http.Server | null = null;
  private agent: CacheAgent;

  constructor(agent: CacheAgent) {
    this.agent = agent;
    this.setupRoutes();
  }

  private setupRoutes() {
    // Turbo API V8 Endpoint: GET /v8/artifacts/:hash
    this.app.get('/v8/artifacts/:hash', async (req: Request, res: Response) => {
      const hash = req.params.hash;
      const key = `turbo:artifact:${hash}`;
      
      const artifact = await this.agent.get(key);
      if (artifact) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.status(200).send(artifact);
      } else {
        res.status(404).send('Not Found');
      }
    });

    // Turbo API V8 Endpoint: PUT /v8/artifacts/:hash
    this.app.put('/v8/artifacts/:hash', express.raw({ type: '*/*', limit: '1gb' }), async (req: Request, res: Response) => {
      const hash = req.params.hash;
      const key = `turbo:artifact:${hash}`;
      const artifact = req.body as Buffer;
      
      await this.agent.set(key, artifact);
      res.status(202).send('Accepted');
    });
  }

  async start(port = 3008): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`Turbo Remote Cache API listening on port ${port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      await new Promise(resolve => this.server?.close(resolve));
    }
  }
}
