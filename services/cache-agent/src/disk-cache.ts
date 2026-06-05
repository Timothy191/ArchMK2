import { promises as fs } from 'fs';
import * as path from 'path';

export class DiskCache {
  private cacheDir: string;

  constructor(cacheDir = path.join(process.cwd(), '.cache', 'amca-disk')) {
    this.cacheDir = cacheDir;
  }

  private getFilePath(key: string): string {
    // Basic sanitization for the key
    const safeKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_');
    return path.join(this.cacheDir, safeKey);
  }

  async init(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(this.getFilePath(key));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async set(key: string, value: Buffer): Promise<void> {
    const tempPath = this.getFilePath(key) + '.tmp';
    const finalPath = this.getFilePath(key);
    await fs.writeFile(tempPath, value);
    await fs.rename(tempPath, finalPath);
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.getFilePath(key));
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
