import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AIProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  TokenUsage,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class AnthropicProvider implements AIProvider {
  private readonly logger = new Logger(AnthropicProvider.name);
  readonly name = 'anthropic';
  readonly models = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
  ];

  private apiKey: string | null = null;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('ANTHROPIC_API_KEY');
    if (key) {
      this.apiKey = key;
      this.logger.log('Anthropic client initialized');
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not configured — AnthropicProvider will be unavailable');
    }
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  private ensureKey(): string {
    if (!this.apiKey) {
      throw new Error('Anthropic client not available: ANTHROPIC_API_KEY is missing');
    }
    return this.apiKey;
  }

  private toAnthropicMessages(messages: ChatMessage[]): { role: string; content: string }[] {
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));
  }

  private getSystemPrompt(messages: ChatMessage[]): string | undefined {
    const systemMsgs = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content);
    return systemMsgs.length > 0 ? systemMsgs.join('\n') : undefined;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const apiKey = this.ensureKey();
    const model = options?.model ?? 'claude-3-5-sonnet-20241022';
    const startedAt = Date.now();

    const body: Record<string, unknown> = {
      model,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
      messages: this.toAnthropicMessages(messages),
    };

    const systemPrompt = this.getSystemPrompt(messages);
    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Anthropic API error: ${response.status} ${errorBody}`);
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startedAt;

    const usage: TokenUsage = {
      promptTokens: data.usage?.input_tokens ?? 0,
      completionTokens: data.usage?.output_tokens ?? 0,
      totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    };

    return {
      id: data.id ?? `anthropic-${Date.now()}`,
      content: data.content?.[0]?.text ?? '',
      role: 'assistant',
      finishReason: this.mapStopReason(data.stop_reason),
      usage,
      model: data.model ?? model,
      latencyMs,
    };
  }

  async *chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatStreamChunk> {
    const apiKey = this.ensureKey();
    const model = options?.model ?? 'claude-3-5-sonnet-20241022';

    const body: Record<string, unknown> = {
      model,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
      messages: this.toAnthropicMessages(messages),
      stream: true,
    };

    const systemPrompt = this.getSystemPrompt(messages);
    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Anthropic stream error: ${response.status} ${errorBody}`);
      throw new Error(`Anthropic stream returned ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield { content: parsed.delta.text };
            }
            if (parsed.type === 'message_delta') {
              yield {
                content: '',
                finishReason: this.mapStopReason(parsed.delta?.stop_reason),
                usage: parsed.usage ? {
                  promptTokens: parsed.usage.input_tokens ?? 0,
                  completionTokens: parsed.usage.output_tokens ?? 0,
                  totalTokens: (parsed.usage.input_tokens ?? 0) + (parsed.usage.output_tokens ?? 0),
                } : undefined,
              };
            }
          } catch {
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async embedText(text: string, options?: { model?: string; dimensions?: number }): Promise<{ embedding: number[]; tokens: number; model: string }> {
    const results = await this.embedTexts([text], options);
    if (results.length === 0) {
      throw new Error('Anthropic embedding returned empty response');
    }
    return results[0];
  }

  async embedTexts(texts: string[], options?: { model?: string; dimensions?: number }): Promise<{ embedding: number[]; tokens: number; model: string }[]> {
    const apiKey = this.ensureKey();
    const model = options?.model ?? 'voyage-3';

    if (texts.length === 0) return [];

    const response = await fetch('https://api.anthropic.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        input: texts,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Anthropic embed error: ${response.status} ${errorBody}`);
      throw new Error(`Anthropic embed returned ${response.status}`);
    }

    const data = await response.json();

    return data.data.map((item: { embedding: number[]; index: number }) => ({
      embedding: item.embedding ?? [],
      tokens: data.usage?.total_tokens ?? 0,
      model: data.model ?? model,
    }));
  }


  async embed(texts: string[], options?: Record<string, unknown>): Promise<{ embedding: number[]; tokens: number; model: string }[]> {
    return this.embedTexts(texts, options as { model?: string; dimensions?: number } | undefined);
  }

  async moderate(text: string): Promise<{ flagged: boolean; categories: Record<string, boolean>; scores: Record<string, number>; model: string }> {
    if (!text || text.trim().length === 0) {
      return {
        flagged: false,
        categories: {},
        scores: {},
        model: 'anthropic-moderation',
      };
    }

    try {
      const result = await this.chat([{
        role: 'user',
        content: `Analyze the following text for policy violations. Return a JSON object with: flagged (boolean), categories (object with keys: hate, harassment, violence, self_harm, sexual, illicit, each boolean), scores (object with same keys, each a number 0-1).\n\nText: "${text}"`,
      }]);

      const match = result.content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          flagged: parsed.flagged ?? false,
          categories: parsed.categories ?? {},
          scores: parsed.scores ?? {},
          model: result.model,
        };
      }
    } catch (error) {
      this.logger.warn(`Anthropic moderation fallback failed: ${error}`);
    }

    return {
      flagged: false,
      categories: {},
      scores: {},
      model: 'anthropic-moderation',
    };
  }

  private mapStopReason(reason: string | undefined | null): ChatResponse['finishReason'] {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      case 'tool_use':
        return 'tool_calls';
      default:
        return 'stop';
    }
  }
}
