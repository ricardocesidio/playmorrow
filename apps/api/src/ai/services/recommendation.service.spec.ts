import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationService } from './recommendation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingService } from '../rag/embedding.service';

describe('RecommendationService', () => {
  let service: RecommendationService;

  const mockGameTag = (name: string) => ({
    tag: { name },
  });

  const makeGame = (overrides: Record<string, unknown> = {}) => ({
    id: 'game-1',
    title: 'Test Game',
    slug: 'test-game',
    description: 'A test game',
    genres: 'Action,RPG',
    coverUrl: null,
    tags: [mockGameTag('action'), mockGameTag('rpg')],
    studio: { id: 'studio-1', name: 'Test Studio', slug: 'test-studio' },
    _count: { wishlistItems: 5, followers: 3 },
    ...overrides,
  });

  function createMockPrisma(
    overrides: Record<string, unknown> = {},
  ): Partial<PrismaService> {
    return {
      wishlistItem: {
        findMany: vi.fn().mockResolvedValue([]),
      } as unknown,
      follow: {
        findMany: vi.fn().mockResolvedValue([]),
      } as unknown,
      game: {
        findMany: vi.fn().mockResolvedValue([
          makeGame(),
          makeGame({
            id: 'game-2',
            title: 'Another Game',
            slug: 'another-game',
            tags: [mockGameTag('puzzle'), mockGameTag('indie')],
            studio: { id: 'studio-2', name: 'Other Studio', slug: 'other-studio' },
            _count: { wishlistItems: 10, followers: 8 },
          }),
          makeGame({
            id: 'game-3',
            title: 'Third Game',
            slug: 'third-game',
            tags: [mockGameTag('action'), mockGameTag('strategy')],
            studio: { id: 'studio-3', name: 'Third Studio', slug: 'third-studio' },
            _count: { wishlistItems: 0, followers: 1 },
          }),
        ]),
      } as unknown,
      ...overrides,
    };
  }

  function createMockEmbeddingService() {
    return {
      embedTexts: vi.fn().mockRejectedValue(new Error('embeddings unavailable')),
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: PrismaService, useValue: createMockPrisma() },
        { provide: EmbeddingService, useValue: createMockEmbeddingService() },
      ],
    }).compile();

    service = module.get(RecommendationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return popular games when user has no interaction history', async () => {
    const result = await service.getRecommendations('cold-user', 5);
    expect(result.method).toBe('popularity-fallback');
    expect(result.total).toBe(3);
    expect(result.recommendations[0].explanation).toBe('Popular on Playmorrow');
  });

  it('should recommend games with similar tags when user has wishlist history', async () => {
    const mockPrisma = createMockPrisma({
      wishlistItem: {
        findMany: vi.fn().mockResolvedValue([
          {
            game: makeGame({ id: 'user-game', title: 'User Game', tags: [mockGameTag('action'), mockGameTag('rpg')] }),
          },
        ]),
      },
    });

    const module = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmbeddingService, useValue: createMockEmbeddingService() },
      ],
    }).compile();

    const svc = module.get(RecommendationService);
    const result = await svc.getRecommendations('history-user', 5);

    expect(result.method).toBe('semantic-embedding');

    const actionGame = result.recommendations.find((r) => r.id === 'game-1');
    expect(actionGame).toBeDefined();
    expect(actionGame!.explanation).toMatch(/similar tags to user game/i);
  });

  it('should boost games from followed studios', async () => {
    const mockPrisma = createMockPrisma({
      wishlistItem: {
        findMany: vi.fn().mockResolvedValue([
          { game: makeGame({ id: 'wish-1', title: 'Wish Game', tags: [mockGameTag('action')] }) },
        ]),
      },
      follow: {
        findMany: vi.fn().mockResolvedValue([{ studioId: 'studio-2' }]),
      },
    });

    const module = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmbeddingService, useValue: createMockEmbeddingService() },
      ],
    }).compile();

    const svc = module.get(RecommendationService);
    const result = await svc.getRecommendations('followed-user', 5);

    const boosted = result.recommendations.find((r) => r.id === 'game-2');
    expect(boosted).toBeDefined();
    expect(boosted!.explanation).toMatch(/from other studio/i);
  });

  it('should respect the limit parameter', async () => {
    const result = await service.getRecommendations('user-1', 2);
    expect(result.recommendations.length).toBeLessThanOrEqual(2);
  });

  it('should return default limit of 10 when no limit provided', async () => {
    const mockPrisma = createMockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmbeddingService, useValue: createMockEmbeddingService() },
      ],
    }).compile();

    const svc = module.get(RecommendationService);
    await svc.getRecommendations('default-limit-user');
  });

  it('should combine tag similarity and studio follow boosts', async () => {
    const mockPrisma = createMockPrisma({
      wishlistItem: {
        findMany: vi.fn().mockResolvedValue([
          { game: makeGame({ id: 'wish-1', title: 'Wish Game', tags: [mockGameTag('action')] }) },
        ]),
      },
      follow: {
        findMany: vi.fn().mockResolvedValue([{ studioId: 'studio-1' }]),
      },
    });

    const module = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmbeddingService, useValue: createMockEmbeddingService() },
      ],
    }).compile();

    const svc = module.get(RecommendationService);
    const result = await svc.getRecommendations('combined-user', 5);

    const topRec = result.recommendations[0];
    expect(topRec.id).toBe('game-1');
    expect(topRec.explanation).toMatch(/similar tags to wish game/i);
  });

  it('should not include user-owned games in recommendations', async () => {
    const allGames = [
      makeGame(),
      makeGame({
        id: 'game-2',
        title: 'Another Game',
        slug: 'another-game',
        tags: [mockGameTag('puzzle')],
        studio: { id: 'studio-2', name: 'Other Studio', slug: 'other-studio' },
        _count: { wishlistItems: 10, followers: 8 },
      }),
    ];

    const mockPrisma = {
      wishlistItem: {
        findMany: vi.fn().mockResolvedValue([
          { game: { id: 'game-1', tags: [mockGameTag('action')] } },
        ]),
      },
      follow: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      game: {
        findMany: vi.fn().mockImplementation((args: Record<string, unknown>) => {
          const notIn = (args?.where as Record<string, unknown>)?.id as { notIn?: string[] } | undefined;
          const excluded = notIn?.notIn ?? [];
          return allGames.filter((g) => !excluded.includes(g.id));
        }),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmbeddingService, useValue: createMockEmbeddingService() },
      ],
    }).compile();

    const svc = module.get(RecommendationService);
    const result = await svc.getRecommendations('exclude-user', 10);

    const excluded = result.recommendations.find((r) => r.id === 'game-1');
    expect(excluded).toBeUndefined();
    expect(result.recommendations.length).toBe(1);
    expect(result.recommendations[0].id).toBe('game-2');
  });
});
