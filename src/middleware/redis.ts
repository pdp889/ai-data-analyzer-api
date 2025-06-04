import { createClient } from 'redis';

export class RedisService {
  static client = createClient({
    url: process.env.REDIS_URL,
  });

  static async init() {
    await this.client.connect();
  }

  static async get(key: string): Promise<any> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  static async set(key: string, value: any): Promise<void> {
    await this.client.set(key, JSON.stringify(value));
  }

  static async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
