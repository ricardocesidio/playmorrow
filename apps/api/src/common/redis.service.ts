import { Injectable, Logger } from '@nestjs/common';
import { RedisConfig } from './redis.config';

// Lightweight wrapper — use @upstash/redis when REDIS_URL is configured
// For now, provides graceful degradation when no Redis is available.
// Install @upstash/redis when ready to add Redis-backed rate limiting.

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(private config: RedisConfig) {}

  get available(): boolean {
    return this.config.isConfigured;
  }

  // Placeholder methods — implement when Redis is provisioned
  async get(key: string): Promise<string | null> {
    if (!this.available) return null;
    this.logger.warn('Redis not fully implemented — add @upstash/redis package');
    return null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.available) return;
  }

  async del(key: string): Promise<void> {
    if (!this.available) return;
  }
}
