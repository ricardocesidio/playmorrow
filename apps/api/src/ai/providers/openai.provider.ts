import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  AIProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  TokenUsage,
} from '../interfaces/ai-provider.interface';
import type {
  EmbeddingProvider,
  EmbeddingOptions,
  EmbeddingResult,
} from '../interfaces/embedding-provider.interface';
import type {
  ModerationProvider,
  ModerationResult,
} from '../interfaces/moderation-provider.interface';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

@Injectable()
export class OpenAIProvider
  implements AIProvider, EmbeddingProvider, ModerationProvider
{
  readonly name = 'openai';
  readonly models = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
  readonly dimensions = 1536;

  private readonly logger = new Logger(OpenAIProvider.name);
  private client: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized');
    } else {
      this.logger.warn(
        'OPENAI_API_KEY not configured — OpenAIProvider will be unavailable',
      );
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  private ensureClient(): OpenAI {
    if (!this.client) {
      throw new Error(
        'OpenAI client not available: OPENAI_API_KEY is missing',
      );
    }
    return this.client;
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    retries = MAX_RETRIES,
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
        const err = error as Record<string, unknown>;
        const msg =
          typeof err?.message === 'string' ? err.message.toLowerCase() : '';
        const status = typeof err?.status === 'number' ? err.status : 0;

        if (status === 429 || msg.includes('rate') || msg.includes('rate_limit')) {
          if (attempt < retries) {
            const backoff = INITIAL_BACKOFF_MS * 2 ** (attempt - 1);
            this.logger.warn(
              `Rate limited on ${context} (attempt ${attempt}/${retries}), retrying in ${backoff}ms`,
            );
            await new Promise((resolve) => setTimeout(resolve, backoff));
            continue;
          }
        }

        if (
          status >= 500 ||
          msg.includes('network') ||
          msg.includes('timeout') ||
          msg.includes('econn') ||
          msg.includes('econnrefused')
        ) {
          if (attempt < retries) {
            const backoff = INITIAL_BACKOFF_MS * 2 ** (attempt - 1);
            this.logger.warn(
              `Transient error on ${context} (attempt ${attempt}/${retries}), retrying in ${backoff}ms`,
            );
            await new Promise((resolve) => setTimeout(resolve, backoff));
            continue;
          }
        }

        this.logger.error(`OpenAI ${context} failed`, error);
        throw error;
      }
    }

    throw new Error(`OpenAI ${context} failed after ${retries} retries`);
  }

  private mapMessages(
    messages: ChatMessage[],
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return messages.map((msg) => {
      if (msg.role === 'tool' && msg.toolCallId) {
        return {
          role: 'tool',
          content: msg.content,
          tool_call_id: msg.toolCallId,
        } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
      }

      if (msg.toolCalls && msg.toolCalls.length > 0) {
        return {
          role: 'assistant',
          content: msg.content,
          tool_calls: msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
      }

      return {
        role: msg.role,
        content: msg.content,
      } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
    });
  }

  private mapTools(
    tools: ChatOptions['tools'],
  ): OpenAI.Chat.Completions.ChatCompletionTool[] | undefined {
    if (!tools || tools.length === 0) return undefined;
    return tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters as Record<string, unknown>,
      },
    }));
  }

  private extractUsage(
    usage?: OpenAI.Completions.CompletionUsage,
  ): TokenUsage | undefined {
    if (!usage) return undefined;
    return {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    };
  }

  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<ChatResponse> {
    const client = this.ensureClient();
    const model = options?.model ?? 'gpt-4o-mini';
    const startedAt = Date.now();

    const response = await this.withRetry(
      () =>
        client.chat.completions.create({
          model,
          messages: this.mapMessages(messages),
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens,
          tools: this.mapTools(options?.tools),
          tool_choice: options?.tools?.length ? 'auto' : undefined,
          stream: false,
        }),
      'chat',
    );

    const choice = response.choices[0];
    if (!choice || !choice.message) {
      throw new Error('OpenAI chat returned empty response');
    }

    const latencyMs = Date.now() - startedAt;

    return {
      id: response.id,
      content: choice.message.content ?? '',
      role: 'assistant',
      finishReason: this.mapFinishReason(choice.finish_reason),
      toolCalls: choice.message.tool_calls?.map((tc) => {
        const fn = tc as { function?: { name?: string; arguments?: string } };
        return {
          id: tc.id,
          type: 'function' as const,
          function: {
            name: fn.function?.name ?? (tc as unknown as { name?: string }).name ?? '',
            arguments: fn.function?.arguments ?? '',
          },
        };
      }),
      usage: this.extractUsage(
        response.usage ?? undefined,
      ),
      model: response.model,
      latencyMs,
    };
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncIterable<ChatStreamChunk> {
    const client = this.ensureClient();
    const model = options?.model ?? 'gpt-4o-mini';

    const stream = await this.withRetry(
      () =>
        client.chat.completions.create({
          model,
          messages: this.mapMessages(messages),
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens,
          tools: this.mapTools(options?.tools),
          tool_choice: options?.tools?.length ? 'auto' : undefined,
          stream: true,
          stream_options: { include_usage: true },
        }),
      'chatStream',
    );

    const toolCallAccumulators = new Map<
      number,
      { id: string; name: string; arguments: string }
    >();

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;
      const finishReason = this.mapFinishReason(
        chunk.choices?.[0]?.finish_reason ?? undefined,
      );

      yield {
        content: delta?.content ?? '',
        finishReason:
          finishReason !== 'stop'
            ? (finishReason as ChatStreamChunk['finishReason'])
            : undefined,
        toolCalls: delta?.tool_calls?.map((tc) => {
          const index = tc.index ?? 0;
          const existing = toolCallAccumulators.get(index) ?? {
            id: '',
            name: '',
            arguments: '',
          };
          const updated = {
            id: tc.id ?? existing.id,
            name: tc.function?.name
              ? existing.name + (tc.function.name ?? '')
              : existing.name,
            arguments: tc.function?.arguments
              ? existing.arguments + (tc.function.arguments ?? '')
              : existing.arguments,
          };
          toolCallAccumulators.set(index, updated);
          return {
            id: updated.id,
            type: 'function' as const,
            function: {
              name: updated.name,
              arguments: updated.arguments,
            },
          };
        }),
        usage: chunk.usage ? this.extractUsage(chunk.usage) : undefined,
      };
    }
  }

  async embedText(
    text: string,
    options?: EmbeddingOptions,
  ): Promise<EmbeddingResult> {
    const results = await this.embedTexts([text], options);
    return results[0];
  }

  async embedTexts(
    texts: string[],
    options?: EmbeddingOptions,
  ): Promise<EmbeddingResult[]> {
    const client = this.ensureClient();
    const model = options?.model ?? 'text-embedding-ada-002';

    if (texts.length === 0) return [];

    const response = await this.withRetry(
      () =>
        client.embeddings.create({
          model,
          input: texts,
          dimensions: options?.dimensions,
        }),
      'embed',
    );

    if (!response.data || response.data.length === 0) {
      throw new Error('OpenAI embedding returned empty response');
    }

    return response.data.map((item) => ({
      embedding: item.embedding,
      tokens: response.usage?.prompt_tokens ?? 0,
      model: response.model,
    }));
  }


  async embed(texts: string[], options?: Record<string, unknown>): Promise<{ embedding: number[]; tokens: number; model: string }[]> {
    const opts = options as { model?: string; dimensions?: number } | undefined;
    return this.embedTexts(texts, opts);
  }

  async moderate(text: string): Promise<ModerationResult> {
    const client = this.ensureClient();

    if (!text || text.trim().length === 0) {
      return {
        flagged: false,
        categories: {} as Record<string, boolean>,
        scores: {} as Record<string, number>,
        model: 'text-moderation-stable',
      };
    }

    const response = await this.withRetry(
      () =>
        client.moderations.create({
          model: 'text-moderation-stable',
          input: text,
        }),
      'moderation',
    );

    const result = response.results[0];
    if (!result) {
      throw new Error('OpenAI moderation returned empty response');
    }

    return {
      flagged: result.flagged,
      categories: (result.categories as unknown as Record<string, boolean>) ?? {},
      scores: (result.category_scores as unknown as Record<string, number>) ?? {},
      model: response.model,
    };
  }

  private mapFinishReason(
    reason: string | undefined | null,
  ): ChatResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'tool_calls':
        return 'tool_calls';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}
