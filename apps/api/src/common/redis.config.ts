import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisConfig {
  private readonly logger = new Logger(RedisConfig.name);

  constructor(private config: ConfigService) {}

  get isConfigured(): boolean {
    return !!this.config.get('REDIS_URL');
  }

  get url(): string {
    return this.config.get('REDIS_URL', '');
  }

  get isUpstash(): boolean {
    return this.url.includes('upstash.io');
  }

  // Upstash Redis has a generous free tier (10K commands/day, 256MB)
  // Sign up at https://upstash.com → Redis → Create Database
  // Use the REST URL as REDIS_URL env var
  // Upstash provides Redis-compatible REST API via @upstash/redis npm package
}
