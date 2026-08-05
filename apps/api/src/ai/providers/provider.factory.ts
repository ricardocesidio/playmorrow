import { Injectable, Logger } from '@nestjs/common';
import type { AIProvider } from '../interfaces/ai-provider.interface';
import type { EmbeddingProvider } from '../interfaces/embedding-provider.interface';
import type { ModerationProvider } from '../interfaces/moderation-provider.interface';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';

export interface ProviderInfo {
  name: string;
  models: string[];
  configured: boolean;
}

@Injectable()
export class ProviderFactory {
  private readonly logger = new Logger(ProviderFactory.name);
  private readonly providers: Map<string, AIProvider>;

  constructor(
    private readonly openai: OpenAIProvider,
    private readonly anthropic: AnthropicProvider,
  ) {
    this.providers = new Map();

    if (this.isConfigured(openai)) {
      this.providers.set('openai', openai);
    }
    if (this.isConfigured(anthropic)) {
      this.providers.set('anthropic', anthropic);
    }

    if (this.providers.size === 0) {
      this.logger.error(
        'No AI providers available — set OPENAI_API_KEY or ANTHROPIC_API_KEY',
      );
    } else {
      this.logger.log(
        `Available AI providers: ${[...this.providers.keys()].join(', ')}`,
      );
    }
  }

  getProvider(name?: string): AIProvider {
    const key = name ?? this.defaultProviderName();
    const provider = this.providers.get(key);
    if (provider) {
      return provider;
    }
    this.logger.warn(
      `Provider "${key}" not found, falling back to default "${this.defaultProviderName()}"`,
    );
    const fallback = this.providers.get(this.defaultProviderName());
    if (!fallback) {
      throw new Error(
        `No AI provider available. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.`,
      );
    }
    return fallback;
  }

  getDefaultProvider(): AIProvider {
    return this.getProvider(this.defaultProviderName());
  }

  getEmbeddingProvider(): EmbeddingProvider {
    const openai = this.providers.get('openai');
    if (openai && 'embedText' in openai) {
      return openai as unknown as EmbeddingProvider;
    }
    const anthropic = this.providers.get('anthropic');
    if (anthropic && 'embedText' in anthropic) {
      return anthropic as unknown as EmbeddingProvider;
    }
    throw new Error(
      'No embedding provider available. Configure OPENAI_API_KEY or ANTHROPIC_API_KEY.',
    );
  }

  getModerationProvider(): ModerationProvider {
    const openai = this.providers.get('openai');
    if (openai && 'moderate' in openai) {
      return openai as unknown as ModerationProvider;
    }
    throw new Error(
      'No moderation provider available. Configure OPENAI_API_KEY.',
    );
  }

  getAvailableProviders(): ProviderInfo[] {
    return [
      {
        name: this.openai.name,
        models: this.openai.models,
        configured: this.isConfigured(this.openai),
      },
      {
        name: this.anthropic.name,
        models: this.anthropic.models,
        configured: this.isConfigured(this.anthropic),
      },
    ];
  }

  listProviders(): string[] {
    return [...this.providers.keys()];
  }

  private isConfigured(provider: unknown): boolean {
    const p = provider as Record<string, unknown>;
    return typeof p?.isConfigured === 'function'
      ? Boolean(p.isConfigured())
      : !!(p?.client);
  }

  private defaultProviderName(): string {
    if (this.providers.has('openai')) return 'openai';
    if (this.providers.has('anthropic')) return 'anthropic';
    return 'openai';
  }
}
