import { Injectable, Logger } from '@nestjs/common';

export interface ChatMetric {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  success: boolean;
  timestamp: Date;
}

export interface EmbeddingMetric {
  provider: string;
  model: string;
  tokens: number;
  textCount: number;
  latencyMs: number;
  success: boolean;
  timestamp: Date;
}

export interface ModerationMetric {
  provider: string;
  flagged: boolean;
  latencyMs: number;
  success: boolean;
  timestamp: Date;
}

const COST_PER_1K: Record<string, { prompt: number; completion: number }> = {
  'gpt-4o': { prompt: 0.0025, completion: 0.01 },
  'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
  'claude-3-5-sonnet-20241022': { prompt: 0.003, completion: 0.015 },
  'claude-3-5-haiku-20241022': { prompt: 0.0008, completion: 0.004 },
  'claude-3-opus-20240229': { prompt: 0.015, completion: 0.075 },
};

@Injectable()
export class AIMetricsService {
  private readonly logger = new Logger(AIMetricsService.name);
  private chatMetrics: ChatMetric[] = [];
  private embeddingMetrics: EmbeddingMetric[] = [];
  private moderationMetrics: ModerationMetric[] = [];

  recordChat(metric: ChatMetric): void {
    this.chatMetrics.push({
      ...metric,
      timestamp: metric.timestamp ?? new Date(),
    });
  }

  recordEmbedding(metric: EmbeddingMetric): void {
    this.embeddingMetrics.push({
      ...metric,
      timestamp: metric.timestamp ?? new Date(),
    });
  }

  recordModeration(metric: ModerationMetric): void {
    this.moderationMetrics.push({
      ...metric,
      timestamp: metric.timestamp ?? new Date(),
    });
  }

  getChatMetrics(): ChatMetric[] {
    return [...this.chatMetrics];
  }

  getEmbeddingMetrics(): EmbeddingMetric[] {
    return [...this.embeddingMetrics];
  }

  getModerationMetrics(): ModerationMetric[] {
    return [...this.moderationMetrics];
  }

  getDailyCost(): number {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayMetrics = this.chatMetrics.filter((m) => m.timestamp >= todayStart);

    return todayMetrics.reduce((total, m) => {
      const rates = COST_PER_1K[m.model];
      if (!rates) return total;
      const promptCost = (m.promptTokens / 1000) * rates.prompt;
      const completionCost = (m.completionTokens / 1000) * rates.completion;
      return total + promptCost + completionCost;
    }, 0);
  }

  getAverageLatency(): number {
    const successful = this.chatMetrics.filter((m) => m.success);
    if (successful.length === 0) return 0;
    return successful.reduce((sum, m) => sum + m.latencyMs, 0) / successful.length;
  }

  getErrorCount(): number {
    let count = 0;
    count += this.chatMetrics.filter((m) => !m.success).length;
    count += this.embeddingMetrics.filter((m) => !m.success).length;
    count += this.moderationMetrics.filter((m) => !m.success).length;
    return count;
  }

  estimateCost(model: string, promptTokens: number, completionTokens: number): number {
    const rates = COST_PER_1K[model];
    if (!rates) throw new Error(`Unknown model "${model}"`);
    return (promptTokens / 1000) * rates.prompt + (completionTokens / 1000) * rates.completion;
  }

  reset(): void {
    this.chatMetrics = [];
    this.embeddingMetrics = [];
    this.moderationMetrics = [];
  }
}
