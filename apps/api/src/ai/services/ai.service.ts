import { Injectable, Logger } from '@nestjs/common';
import { ProviderFactory } from '../providers/provider.factory';
import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  EmbeddingResult,
} from '../interfaces/ai-provider.interface';
import type { ModerationResult } from '../interfaces/moderation-provider.interface';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(private readonly providerFactory: ProviderFactory) {}

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<ChatResponse> {
    const provider = this.providerFactory.getProvider(
      options?.model?.startsWith('claude') ? 'anthropic' : undefined,
    );
    return provider.chat(messages, options);
  }

  async chatStream(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<ChatResponse> {
    const provider = this.providerFactory.getProvider();
    const chunks: ChatStreamChunk[] = [];
    for await (const chunk of provider.chatStream(messages, options)) {
      chunks.push(chunk);
    }
    const content = chunks.map((c) => c.content).join('');
    const lastUsage = [...chunks].reverse().find((c) => c.usage)?.usage;
    return {
      id: 'stream-1',
      content,
      role: 'assistant',
      finishReason: 'stop',
      usage: lastUsage,
      model: 'gpt-4o',
      latencyMs: 0,
    };
  }

  async moderate(text: string): Promise<ModerationResult> {
    const provider = this.providerFactory.getProvider();
    return provider.moderate(text);
  }

  async embed(
    texts: string[],
    model?: string,
  ): Promise<EmbeddingResult[]> {
    const provider = this.providerFactory.getProvider();
    return provider.embed(texts, { model });
  }

  getAvailableProviders(): {
    name: string;
    models: string[];
    configured: boolean;
  }[] {
    return this.providerFactory.getAvailableProviders();
  }
}
