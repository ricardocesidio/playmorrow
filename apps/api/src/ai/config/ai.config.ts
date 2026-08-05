import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIConfig {
  constructor(private config: ConfigService) {}

  get defaultProvider(): string {
    return this.config.get('AI_PROVIDER', 'openai');
  }

  get defaultModel(): string {
    return this.config.get('AI_DEFAULT_MODEL', 'gpt-4o-mini');
  }

  get embeddingModel(): string {
    return this.config.get('AI_EMBEDDING_MODEL', 'text-embedding-3-small');
  }

  get maxTokens(): number {
    return parseInt(this.config.get('AI_MAX_TOKENS', '4096'));
  }

  get temperature(): number {
    return parseFloat(this.config.get('AI_TEMPERATURE', '0.7'));
  }

  get rateLimitRpm(): number {
    return parseInt(this.config.get('AI_RATE_LIMIT_RPM', '10'));
  }

  get costLimitDaily(): number {
    return parseFloat(this.config.get('AI_COST_LIMIT_DAILY', '50'));
  }

  get enableStreaming(): boolean {
    return this.config.get('AI_ENABLE_STREAMING', 'true') !== 'false';
  }

  get enableCache(): boolean {
    return this.config.get('AI_ENABLE_CACHE', 'true') !== 'false';
  }

  get cacheTtlSeconds(): number {
    return parseInt(this.config.get('AI_CACHE_TTL', '3600'));
  }

  get openaiApiKey(): string | undefined {
    return this.config.get('OPENAI_API_KEY');
  }

  get anthropicApiKey(): string | undefined {
    return this.config.get('ANTHROPIC_API_KEY');
  }
}
