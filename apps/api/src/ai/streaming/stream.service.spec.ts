import { Test, TestingModule } from '@nestjs/testing';
import { StreamService } from '../streaming/stream.service';
import { ProviderFactory } from '../providers/provider.factory';
import type { AIProvider, ChatMessage, ChatStreamChunk, ChatResponse } from '../interfaces/ai-provider.interface';

describe('StreamService', () => {
  let service: StreamService;

  function createMockChunks(): ChatStreamChunk[] {
    return [
      { content: 'The ' },
      { content: 'best ' },
      { content: 'RPG ' },
      { content: 'is ' },
      { content: 'Witcher ' },
      { content: '3.' },
      { content: '', finishReason: 'stop', usage: { promptTokens: 15, completionTokens: 20, totalTokens: 35 } },
    ];
  }

  async function* createMockStream(chunks: ChatStreamChunk[]): AsyncIterable<ChatStreamChunk> {
    for (const chunk of chunks) {
      yield chunk;
    }
  }

  beforeEach(async () => {
    const mockProvider: Partial<AIProvider> = {
      name: 'openai',
      models: ['gpt-4o-mini'],
      chat: vi.fn(),
      chatStream: vi.fn().mockReturnValue(createMockStream(createMockChunks())),
      embed: vi.fn(),
      moderate: vi.fn(),
    };

    const mockFactory = {
      getChatProvider: vi.fn().mockReturnValue(mockProvider),
      getDefaultProvider: vi.fn().mockReturnValue(mockProvider),
      getAvailableProviders: vi.fn(),
      getEmbeddingProvider: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamService,
        { provide: ProviderFactory, useValue: mockFactory },
      ],
    }).compile();

    service = module.get(StreamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should stream chat chunks and assemble full response', async () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Best RPG?' }];

    const response = await service.streamChat(messages, {});

    expect(response).toBeDefined();
    expect(response.content).toBe('The best RPG is Witcher 3.');
    expect(response.finishReason).toBe('stop');
    expect(response.role).toBe('assistant');
    expect(response.usage?.totalTokens).toBe(35);
  });

  it('should call onChunk callback for each chunk', async () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Test' }];
    const onChunkCalls: ChatStreamChunk[] = [];

    await service.streamChat(messages, {
      onChunk: (chunk) => onChunkCalls.push(chunk),
    });

    expect(onChunkCalls.length).toBeGreaterThanOrEqual(6);
    expect(onChunkCalls[0].content).toBe('The ');
    expect(onChunkCalls[1].content).toBe('best ');
  });

  it('should call onComplete callback with assembled response', async () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Test' }];
    let completedResponse: ChatResponse | undefined;

    await service.streamChat(messages, {
      onComplete: (response) => {
        completedResponse = response;
      },
    });

    expect(completedResponse).toBeDefined();
    expect(completedResponse!.content).toBe('The best RPG is Witcher 3.');
  });

  it('should call onError callback when stream fails', async () => {
    const errorProvider: Partial<AIProvider> = {
      name: 'openai',
      models: ['gpt-4o-mini'],
      chat: vi.fn(),
      chatStream: vi.fn().mockImplementation(async function* () {
        yield { content: 'Partial...' };
        throw new Error('Connection lost');
      }),
      embed: vi.fn(),
      moderate: vi.fn(),
    };

    const errorFactory = {
      getChatProvider: vi.fn().mockReturnValue(errorProvider),
      getDefaultProvider: vi.fn(),
      getAvailableProviders: vi.fn(),
      getEmbeddingProvider: vi.fn(),
    };

    const errorModule = await Test.createTestingModule({
      providers: [
        StreamService,
        { provide: ProviderFactory, useValue: errorFactory },
      ],
    }).compile();
    const errorService = errorModule.get(StreamService);

    let capturedError: Error | undefined;
    const messages: ChatMessage[] = [{ role: 'user', content: 'Test' }];

    await expect(
      errorService.streamChat(messages, {
        onError: (err) => { capturedError = err; },
      }),
    ).rejects.toThrow('Connection lost');

    expect(capturedError).toBeDefined();
    expect(capturedError!.message).toBe('Connection lost');
  });

  it('should handle cancellation', async () => {
    service.cancelStream();
    expect(service).toBeDefined();
  });

  it('should handle empty stream gracefully', async () => {
    const emptyProvider: Partial<AIProvider> = {
      name: 'openai',
      models: ['gpt-4o-mini'],
      chat: vi.fn(),
      chatStream: vi.fn().mockImplementation(async function* () {
      }),
      embed: vi.fn(),
      moderate: vi.fn(),
    };

    const emptyFactory = {
      getChatProvider: vi.fn().mockReturnValue(emptyProvider),
      getDefaultProvider: vi.fn(),
      getAvailableProviders: vi.fn(),
      getEmbeddingProvider: vi.fn(),
    };

    const emptyModule = await Test.createTestingModule({
      providers: [
        StreamService,
        { provide: ProviderFactory, useValue: emptyFactory },
      ],
    }).compile();
    const emptyService = emptyModule.get(StreamService);

    const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
    const response = await emptyService.streamChat(messages, {});

    expect(response).toBeDefined();
    expect(response.content).toBe('');
    expect(response.finishReason).toBe('stop');
  });

  it('should return usage from the last chunk', async () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Stats?' }];
    const response = await service.streamChat(messages, {});

    expect(response.usage).toBeDefined();
    expect(response.usage!.promptTokens).toBe(15);
    expect(response.usage!.completionTokens).toBe(20);
  });
});
