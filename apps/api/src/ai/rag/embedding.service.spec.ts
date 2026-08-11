import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingService } from './embedding.service';
import { ProviderFactory } from '../providers/provider.factory';
import { AIConfig } from '../config/ai.config';
import type { AIProvider } from '../interfaces/ai-provider.interface';

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let mockProvider: Partial<AIProvider>;

  const createMockEmbedding = (seed: number) => ({
    embedding: Array.from({ length: 1536 }, () => seed * 0.01),
    tokens: 12,
    model: 'text-embedding-3-small',
  });

  const mockConfig = {
    embeddingModel: 'text-embedding-3-small',
    embeddingDimensions: 1536,
  } as unknown as AIConfig;

  beforeEach(async () => {
    mockProvider = {
      name: 'openai',
      models: ['text-embedding-3-small'],
      chat: vi.fn(),
      chatStream: vi.fn(),
      embedTexts: vi.fn(),
      moderate: vi.fn(),
    };

    const mockFactory = {
      getEmbeddingProvider: vi.fn().mockReturnValue(mockProvider),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        { provide: ProviderFactory, useValue: mockFactory },
        { provide: AIConfig, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(EmbeddingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should embed single text', async () => {
    const result = createMockEmbedding(1);
    mockProvider.embedTexts = vi.fn().mockResolvedValue([result]);

    const embedding = await service.embedText('This is a game description');
    expect(embedding).toBeDefined();
    expect(embedding.tokens).toBe(12);
    expect(embedding.embedding).toHaveLength(1536);
    expect(mockProvider.embedTexts).toHaveBeenCalledWith(
      ['This is a game description'],
      { model: 'text-embedding-3-small' },
    );
  });

  it('should embed multiple texts', async () => {
    mockProvider.embedTexts = vi.fn().mockResolvedValue([
      createMockEmbedding(1),
      createMockEmbedding(2),
      createMockEmbedding(3),
    ]);

    const results = await service.embedTexts(['Text A', 'Text B', 'Text C']);
    expect(results).toHaveLength(3);
    expect(mockProvider.embedTexts).toHaveBeenCalledWith(
      ['Text A', 'Text B', 'Text C'],
      { model: 'text-embedding-3-small' },
    );
  });

  it('should chunk long text', () => {
    const words = Array.from({ length: 3000 }, (_, i) => `word${i}`);
    const longText = words.join(' ');
    const chunks = service.chunkText(longText);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].text).toBeDefined();
    expect(chunks[0].tokenCount).toBeGreaterThan(0);
  });

  it('should embed and return vector documents for a document', async () => {
    mockProvider.embedTexts = vi
      .fn()
      .mockImplementation((texts: string[]) =>
        Promise.resolve(texts.map((_, i) => createMockEmbedding(i))),
      );

    const docs = await service.embedDocument({
      id: 'doc-1',
      content: 'A short game description for embedding.',
      metadata: { genre: 'RPG' },
      sourceType: 'game',
      sourceId: 'game-1',
    });

    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe('doc-1-0');
    expect(docs[0].content).toBe('A short game description for embedding.');
    expect(docs[0].embedding).toBeDefined();
    expect(docs[0].metadata.genre).toBe('RPG');
    expect(docs[0].sourceType).toBe('game');
    expect(docs[0].sourceId).toBe('game-1');
  });

  it('should handle embedding errors', async () => {
    mockProvider.embedTexts = vi
      .fn()
      .mockRejectedValue(new Error('Embedding API unavailable'));

    await expect(service.embedText('test')).rejects.toThrow(
      'Embedding API unavailable',
    );
  });
});
