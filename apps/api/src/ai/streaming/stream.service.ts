import { Injectable, Logger } from '@nestjs/common';
import { ProviderFactory } from '../providers/provider.factory';
import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
} from '../interfaces/ai-provider.interface';

export interface StreamCallbacks {
  onChunk?: (chunk: ChatStreamChunk) => void;
  onComplete?: (response: ChatResponse) => void;
  onError?: (error: Error) => void;
}

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);

  constructor(private readonly providerFactory: ProviderFactory) {}

  async streamChat(
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    options?: ChatOptions,
  ): Promise<ChatResponse> {
    const provider = this.providerFactory.getProvider();
    const chunks: ChatStreamChunk[] = [];

    try {
      for await (const chunk of provider.chatStream(messages, options)) {
        chunks.push(chunk);
        callbacks.onChunk?.(chunk);
      }
    } catch (error: unknown) {
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

    const content = chunks.map((c) => c.content).join('');
    const lastChunk = chunks[chunks.length - 1];
    const response: ChatResponse = {
      id: `stream-${Date.now()}`,
      content,
      role: 'assistant',
      finishReason: chunks.length > 0 ? (lastChunk?.finishReason ?? 'stop') : 'stop',
      usage: lastChunk?.usage,
      model: options?.model ?? 'gpt-4o',
      latencyMs: 0,
    };

    callbacks.onComplete?.(response);
    return response;
  }

  cancelStream(): void {
    this.logger.log('Stream cancelled');
  }
}
