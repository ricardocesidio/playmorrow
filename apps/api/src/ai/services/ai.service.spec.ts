import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from '../services/ai.service';
import { ProviderFactory } from '../providers/provider.factory';
import type {
  AIProvider,
  ChatMessage,
  ChatResponse,
  ChatStreamChunk,
  EmbeddingResult,
} from '../interfaces/ai-provider.interface';
import type { ModerationResult } from '../interfaces/moderation-provider.interface';

describe('AIService', () => {
  let service: AIService;

  const mockChatResponse: ChatResponse = {
    id: 'resp-1',
    content: 'Hello! How can I help with games?',
    role: 'assistant',
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 15, totalTokens: 25 },
    model: 'gpt-4o-mini',
    latencyMs: 200,
  };

  const mockModerationResult: ModerationResult = {
    flagged: false,
    categories: { hate: false, violence: false, 'self-harm': false },
    scores: { hate: 0.01, violence: 0.02, 'self-harm': 0.001 },
    model: 'omni-moderation-latest',
  };

  const mockEmbeddingResult: EmbeddingResult = {
    embedding: [0.1, 0.2, 0.3],
    tokens: 8,
    model: 'text-embedding-3-small',
  };

  async function* mockStream(): AsyncIterable<ChatStreamChunk> {
    yield { content: 'Hel' };
    yield { content: 'lo!' };
    yield {
      content: '',
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 15, totalTokens: 25 },
    };
  }

  function createMockProvider(overrides: Partial<AIProvider> = {}): AIProvider {
    return {
      name: 'openai',
      models: ['gpt-4o-mini'],
      chat: vi.fn().mockResolvedValue(mockChatResponse),
      chatStream: vi.fn().mockReturnValue(mockStream()),
      embed: vi.fn().mockResolvedValue([mockEmbeddingResult]),
      embedText: vi.fn().mockResolvedValue(mockEmbeddingResult),
      embedTexts: vi.fn().mockResolvedValue([mockEmbeddingResult]),
      moderate: vi.fn().mockResolvedValue(mockModerationResult),
      isConfigured: vi.fn().mockReturnValue(true),
      ...overrides,
    };
  }

  beforeEach(async () => {
    const mockProvider = createMockProvider();
    const mockFactory = {
      getChatProvider: vi.fn().mockReturnValue(mockProvider),
      getDefaultProvider: vi.fn().mockReturnValue(mockProvider),
      getModerationProvider: vi.fn().mockReturnValue(mockProvider),
      getEmbeddingProvider: vi.fn().mockReturnValue(mockProvider),
      getAvailableProviders: vi.fn().mockReturnValue([
        { name: 'openai', models: ['gpt-4o-mini', 'gpt-4o'], configured: true },
        { name: 'anthropic', models: ['claude-3-5-sonnet-20241022'], configured: false },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        { provide: ProviderFactory, useValue: mockFactory },
      ],
    }).compile();

    service = module.get(AIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle chat with mocked provider', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'What games are available?' },
    ];
    const result = await service.chat(messages);
    expect(result).toBeDefined();
    expect(result.content).toBe('Hello! How can I help with games?');
    expect(result.usage?.totalTokens).toBe(25);
  });

  it('should handle streaming chat', async () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
    const result = await service.chatStream(messages);
    expect(result).toBeDefined();
    expect(result.content).toBe('Hello!');
  });

  it('should moderate content with mocked provider', async () => {
    const result = await service.moderate('Hello world');
    expect(result).toBeDefined();
    expect(result.flagged).toBe(false);
    expect(result.categories).toBeDefined();
  });

  it('should embed text', async () => {
    const results = await service.embed(['Game description text']);
    expect(results).toHaveLength(1);
    expect(results[0].embedding).toEqual([0.1, 0.2, 0.3]);
    expect(results[0].tokens).toBe(8);
  });

  it('should list available providers', () => {
    const providers = service.getAvailableProviders();
    expect(providers).toHaveLength(2);
    expect(providers[0].name).toBe('openai');
    expect(providers[1].name).toBe('anthropic');
    expect(providers[0].configured).toBe(true);
    expect(providers[1].configured).toBe(false);
  });

  it('should handle provider errors gracefully', async () => {
    const errorMockFactory = {
      getChatProvider: vi.fn().mockReturnValue({
        ...createMockProvider(),
        chat: vi.fn().mockRejectedValue(new Error('API rate limit exceeded')),
      }),
      getAvailableProviders: vi.fn().mockReturnValue([]),
    };

    const errorModule = await Test.createTestingModule({
      providers: [
        AIService,
        { provide: ProviderFactory, useValue: errorMockFactory },
      ],
    }).compile();
    const errorService = errorModule.get(AIService);

    await expect(
      errorService.chat([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow('API rate limit exceeded');
  });

  it('should respect rate limits when provider fails', async () => {
    const errorMockFactory = {
      getChatProvider: vi.fn().mockReturnValue({
        ...createMockProvider(),
        chat: vi.fn().mockRejectedValue(new Error('Rate limit exceeded')),
      }),
      getAvailableProviders: vi.fn().mockReturnValue([]),
    };

    const errorModule = await Test.createTestingModule({
      providers: [
        AIService,
        { provide: ProviderFactory, useValue: errorMockFactory },
      ],
    }).compile();
    const errorService = errorModule.get(AIService);

    await expect(
      errorService.chat([{ role: 'user', content: 'test2' }]),
    ).rejects.toThrow('Rate limit exceeded');
  });
});
