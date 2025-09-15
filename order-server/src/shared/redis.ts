import { createClient, RedisClientOptions } from 'redis';

const port = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_HOST_MAIN = process.env.NODE_ENV === 'development' ? '127.0.0.1' : 

process.env.REDIS_HOST;

const config: RedisClientOptions = {
    socket: {
        host: REDIS_HOST_MAIN,
        port: port
    },
    password: process.env.REDIS_PASSWORD || undefined
}

class RedisClient {
  private static instance: RedisClient;
  private client: any;

  // private constructor() {
  //   this.client = createClient( process.env.REDIS_URL?{ url: process.env.REDIS_URL }:config);
  //   this.client.on('error', (err: Error) => console.error('Redis error:', err));
  // }

  private constructor() {
    const options: RedisClientOptions = process.env.REDIS_URL
      ? { url: process.env.REDIS_URL }
      : (config as RedisClientOptions);

    this.client = createClient(options);

    this.client.on('error', (err: Error) => {
      console.error('Redis error:', err);
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  // public async connect(): Promise<void> {
  //   if (!this.client.isOpen) {
  //     await this.client.connect();
  //   }
  // }

  public async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect().catch((err: any) => {
        console.error('Redis connection failed:', err);
        throw err;
      });
    }
  }

  public getClient(): any {
    return this.client;
  }

  // Add other Redis methods as needed
  public async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  public async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

    public async setJSON(key: string, value: unknown, expireSeconds?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (expireSeconds) {
      await this.client.set(key, data, { EX: expireSeconds });
    } else {
      await this.client.set(key, data);
    }
  }

  public async getJSON<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) as T : null;
  }

}

export { RedisClient };