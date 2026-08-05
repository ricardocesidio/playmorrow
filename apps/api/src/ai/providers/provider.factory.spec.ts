import { Test, TestingModule } from '@nestjs/testing';
import { ProviderFactory } from './provider.factory';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';

describe('ProviderFactory', () => {
  let factory: ProviderFactory;

  beforeEach(async () => {
    const mockOpenAI: Partial<OpenAIProvider> = {
      name: 'openai',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
      isConfigured: vi.fn().mockReturnValue(true),
      embedText: vi.fn().mockResolvedValue({
        embedding: [0.1, 0.2],
        tokens: 5,
        model: 'text-embedding-3-small',
      }),
      moderate: vi.fn().mockResolvedValue({
        flagged: false,
        categories: {},
        scores: {},
        model: 'omni-moderation-latest',
      }),
    };

    const mockAnthropic: Partial<AnthropicProvider> = {
      name: 'anthropic',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
      isConfigured: vi.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderFactory,
        { provide: OpenAIProvider, useValue: mockOpenAI },
        { provide: AnthropicProvider, useValue: mockAnthropic },
      ],
    }).compile();

    factory = module.get(ProviderFactory);
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  it('should list configured providers', () => {
    const providers = factory.getAvailableProviders();
    expect(providers).toHaveLength(2);
    expect(providers[0].name).toBe('openai');
    expect(providers[1].name).toBe('anthropic');
  });

  it('should include models in listed providers', () => {
    const providers = factory.getAvailableProviders();
    expect(providers[0].models).toContain('gpt-4o');
    expect(providers[1].models).toContain('claude-3-5-sonnet-20241022');
  });

  it('should get default provider', () => {
    const provider = factory.getDefaultProvider();
    expect(provider).toBeDefined();
    expect(provider.name).toBe('openai');
  });

  it('should get OpenAI when explicitly requested', () => {
    const provider = factory.getChatProvider('openai');
    expect(provider).toBeDefined();
    expect(provider.name).toBe('openai');
  });

  it('should get Anthropic when explicitly requested', () => {
    const provider = factory.getChatProvider('anthropic');
    expect(provider).toBeDefined();
    expect(provider.name).toBe('anthropic');
  });

  it('should fall back to default for unknown provider name', () => {
    const provider = factory.getChatProvider('nonexistent');
    expect(provider).toBeDefined();
    expect(provider.name).toBe('openai');
  });

  it('should fall back to default when no provider name given', () => {
    const provider = factory.getChatProvider();
    expect(provider).toBeDefined();
    expect(provider.name).toBe('openai');
  });

  it('should get embedding provider based on model prefix', () => {
    const provider = factory.getEmbeddingProvider();
    expect(provider).toBeDefined();
    expect(provider.name).toBe('openai');
  });

  it('should list available provider keys', () => {
    const keys = factory.listProviders();
    expect(keys).toContain('openai');
    expect(keys).toContain('anthropic');
  });
});
