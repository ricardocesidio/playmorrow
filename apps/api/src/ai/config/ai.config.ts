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

  /**
   * Expected embedding vector dimension. The DB column is `vector(1536)`;
   * changing this requires a column migration + full re-embed (see
   * docs/ai/AI_RECOMMENDATION_ARCHITECTURE.md). All callers validate against
   * this value — mismatched vectors fail loudly, never silently truncated.
   */
  get embeddingDimensions(): number {
    return parseInt(this.config.get('AI_EMBEDDING_DIMENSIONS', '1536'), 10);
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

  // ── M23 hybrid recommendation flags ──────────────────────────────────────

  /** Master switch: false routes /recommendations/for-you to the legacy engine. */
  get recommendationEnabled(): boolean {
    return this.config.get('RECOMMENDATIONS_ENABLED', 'true') !== 'false';
  }

  /** Percentage (0-100) of users who see the hybrid engine (5/25/100 rollout). */
  get recommendationRolloutPct(): number {
    return this.clampPct(parseInt(this.config.get('RECOMMENDATIONS_ROLLOUT_PCT', '5'), 10));
  }

  /** When false, "For You" degrades to non-personalized discovery (content/trending). */
  get personalizationEnabled(): boolean {
    return this.config.get('RECOMMENDATIONS_PERSONALIZE', 'true') !== 'false';
  }

  /** When false, the pgvector semantic path is disabled (deterministic only). */
  get semanticEnabled(): boolean {
    return this.config.get('RECOMMENDATIONS_SEMANTIC', 'true') !== 'false';
  }

  /** Daily embedding-refresh cron (nightly) can be disabled without touching code. */
  get embeddingsEnabled(): boolean {
    return this.config.get('EMBEDDINGS_REFRESH_ENABLED', 'true') !== 'false';
  }

  /** Deterministic rollout bucketing — stable per user across requests. */
  rolloutEnabled(userId: string): boolean {
    if (!this.recommendationEnabled) return false;
    if (this.recommendationRolloutPct >= 100) return true;
    if (this.recommendationRolloutPct <= 0) return false;
    return (this.hashString(userId) % 100) < this.recommendationRolloutPct;
  }

  private hashString(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private clampPct(value: number): number {
    if (Number.isNaN(value)) return 5;
    return Math.max(0, Math.min(100, value));
  }
}
