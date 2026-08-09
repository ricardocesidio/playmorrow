import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { HybridRecommenderService } from './hybrid-recommender.service';
import { TasteSignalService } from './taste-signal.service';
import { RecommendationFeedbackService } from './recommendation-feedback.service';
import { GameEmbeddingRepository } from './game-embedding.repository';
import { EmbeddingService } from '../rag/embedding.service';
import { AIConfig } from '../config/ai.config';

function mockAIConfig(overrides: Partial<AIConfig> = {}): AIConfig {
  return {
    personalizationEnabled: true,
    semanticEnabled: true,
    embeddingsEnabled: true,
    rolloutEnabled: () => true,
    embeddingModel: 'text-embedding-3-small',
    defaultProvider: 'openai',
    ...overrides,
  } as unknown as AIConfig;
}

function mockLegacy() {
  return {
    getRecommendations: vi.fn().mockResolvedValue({
      items: [
        { gameId: 'g1', score: 80, reasons: ['Trending now'] },
        { gameId: 'g2', score: 60, reasons: ['Similar tags and genres'] },
      ],
      nextCursor: null,
      hasMore: false,
    }),
  };
}

function mockPrisma() {
  const games = [
    { id: 'g1', title: 'Game One', slug: 'game-one', coverUrl: null, updatedAt: new Date(), genres: 'RPG',
      studio: { id: 's1', name: 'Studio A' },
      tags: [{ tagId: 't1', tag: { name: 'RPG', kind: 'genre' } }] },
    { id: 'g2', title: 'Game Two', slug: 'game-two', coverUrl: 'x.png', updatedAt: new Date(), genres: 'Puzzle',
      studio: { id: 's2', name: 'Studio B' },
      tags: [{ tagId: 't2', tag: { name: 'Puzzle', kind: 'genre' } }] },
  ];
  const byId = new Map(games.map((g) => [g.id, g]));

  return {
    game: {
      findMany: vi.fn(async ({ where }: { where?: { id?: { in?: string[] } } }) => {
        const ids = where?.id?.in;
        if (!ids) return games;
        return games.filter((g) => ids.includes(g.id));
      }),
      findFirst: vi.fn(),
    },
    wishlistItem: { findMany: vi.fn().mockResolvedValue([]) },
    follow: { findMany: vi.fn().mockResolvedValue([]) },
    purchasedLicense: { findMany: vi.fn().mockResolvedValue([]) },
    analyticsEvent: { findMany: vi.fn().mockResolvedValue([]) },
    recommendationFeedback: { findMany: vi.fn().mockResolvedValue([]) },
    _count: undefined,
    byId,
  };
}

function mockSignals() {
  return {
    gather: vi.fn().mockResolvedValue({
      signalGames: [{ gameId: 'g1', title: 'Game One', signal: 1, source: 'wishlist' }],
      tagAffinity: new Map([['t1', 1]]),
      followedStudioIds: [],
      signalTexts: ['Game One'],
    }),
    hasSignals: vi.fn().mockReturnValue(true),
  };
}

describe('HybridRecommenderService', () => {
  it('returns legacy result when rollout is disabled', async () => {
    const service = new HybridRecommenderService(
      mockPrisma() as never,
      mockLegacy() as never,
      mockSignals() as never,
      { search: vi.fn(), count: vi.fn().mockResolvedValue(0) } as never,
      { embedTexts: vi.fn() } as never,
      mockAIConfig({ rolloutEnabled: () => false }) as never,
    );

    const result = await service.getForYou('user-1', 10, null);
    expect(result.method).toBe('legacy');
    expect(result.items[0].gameId).toBe('g1');
    expect(result.items[0].reasonType).toBe('legacy');
  });

  it('applies dismissal exclusion from feedback', async () => {
    const prisma = mockPrisma();
    prisma.recommendationFeedback.findMany = vi.fn().mockResolvedValue([{ gameId: 'g1' }]);

    const service = new HybridRecommenderService(
      prisma as never,
      mockLegacy() as never,
      mockSignals() as never,
      { search: vi.fn().mockResolvedValue([]), count: vi.fn() } as never,
      { embedTexts: vi.fn() } as never,
      mockAIConfig() as never,
    );

    const result = await service.getForYou('user-1', 10, null);
    expect(result.items.some((i) => i.gameId === 'g1')).toBe(false);
    expect(result.items.some((i) => i.gameId === 'g2')).toBe(true);
  });

  it('includes card details (title, slug, studio) in items', async () => {
    const service = new HybridRecommenderService(
      mockPrisma() as never,
      mockLegacy() as never,
      mockSignals() as never,
      { search: vi.fn().mockResolvedValue([]), count: vi.fn() } as never,
      { embedTexts: vi.fn() } as never,
      mockAIConfig() as never,
    );

    const result = await service.getForYou('user-1', 10, null);
    expect(result.items.length).toBe(2);
    for (const item of result.items) {
      expect(item.title).toBeTruthy();
      expect(item.slug).toBeTruthy();
      expect(item.studioName).toBeTruthy();
    }
  });

  it('runs a deterministic content path for users without signals', async () => {
    const signals = mockSignals();
    signals.gather = vi.fn().mockResolvedValue({
      signalGames: [],
      tagAffinity: new Map(),
      followedStudioIds: [],
      signalTexts: [],
    });
    signals.hasSignals = vi.fn().mockReturnValue(false);

    const service = new HybridRecommenderService(
      mockPrisma() as never,
      mockLegacy() as never,
      signals as never,
      { search: vi.fn().mockResolvedValue([]), count: vi.fn() } as never,
      { embedTexts: vi.fn() } as never,
      mockAIConfig() as never,
    );

    const result = await service.getForYou('user-1', 10, null);
    expect(result.method).toBe('trending');
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('fails gracefully when semantic candidate lookup errors', async () => {
    const service = new HybridRecommenderService(
      mockPrisma() as never,
      mockLegacy() as never,
      mockSignals() as never,
      { search: vi.fn().mockRejectedValue(new Error('pgvector down')), count: vi.fn() } as never,
      { embedTexts: vi.fn().mockRejectedValue(new Error('no api key')) } as never,
      mockAIConfig() as never,
    );

    const result = await service.getForYou('user-1', 10, null);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].reason).toBeTruthy();
  });
});

describe('TasteSignalService', () => {
  it('gathers signals with correct weights and deduplicates', async () => {
    const prisma = {
      wishlistItem: {
        findMany: vi.fn().mockResolvedValue([
          { game: { id: 'g1', title: 'Alpha' } },
          { game: { id: 'g2', title: 'Beta' } },
        ]),
      },
      follow: {
        findMany: vi.fn()
          .mockResolvedValueOnce([{ game: { id: 'g1', title: 'Alpha' } }])
          .mockResolvedValueOnce([{ studioId: 's9' }]),
      },
      purchasedLicense: { findMany: vi.fn().mockResolvedValue([]) },
      analyticsEvent: {
        findMany: vi.fn().mockResolvedValue([
          { gameId: 'g1' },
          { gameId: 'g3' },
        ]),
      },
      gameTag: {
        findMany: vi.fn().mockResolvedValue([
          { gameId: 'g1', tag: { id: 't1' } },
          { gameId: 'g2', tag: { id: 't2' } },
          { gameId: 'g2', tag: { id: 't1' } },
        ]),
      },
    };

    const service = new TasteSignalService(prisma as never);
    const signals = await service.gather('user-1');

    expect(signals.signalGames.map((g) => g.gameId)).toEqual(['g1', 'g2', 'g3']);
    expect(signals.followedStudioIds).toEqual(['s9']);
    expect(signals.tagAffinity.get('t1')).toBeGreaterThan(0);
  });

  it('reports no signals for a fresh user', async () => {
    const prisma = {
      wishlistItem: { findMany: vi.fn().mockResolvedValue([]) },
      follow: { findMany: vi.fn().mockResolvedValue([]) },
      purchasedLicense: { findMany: vi.fn().mockResolvedValue([]) },
      analyticsEvent: { findMany: vi.fn().mockResolvedValue([]) },
      gameTag: { findMany: vi.fn().mockResolvedValue([]) },
    };

    const service = new TasteSignalService(prisma as never);
    const signals = await service.gather('fresh-user');
    expect(signals.signalGames).toHaveLength(0);
    expect(service.hasSignals(signals)).toBe(false);
  });
});

describe('RecommendationFeedbackService', () => {
  it('ignores feedback for unknown games', async () => {
    const prisma = {
      game: { findFirst: vi.fn().mockResolvedValue(null) },
      recommendationFeedback: { create: vi.fn() },
    };

    const service = new RecommendationFeedbackService(prisma as never);
    await service.record('u1', 'missing-game', 'CLICKED' as never);
    expect(prisma.recommendationFeedback.create).not.toHaveBeenCalled();
  });

  it('records feedback for valid games', async () => {
    const prisma = {
      game: { findFirst: vi.fn().mockResolvedValue({ id: 'g1' }) },
      recommendationFeedback: { create: vi.fn().mockResolvedValue({}) },
    };

    const service = new RecommendationFeedbackService(prisma as never);
    await service.record('u1', 'g1', 'DISMISSED' as never);
    expect(prisma.recommendationFeedback.create).toHaveBeenCalledWith({
      data: { userId: 'u1', gameId: 'g1', action: 'DISMISSED' },
    });
  });

  it('returns dismissal ids within the window', async () => {
    const prisma = {
      recommendationFeedback: {
        findMany: vi.fn().mockResolvedValue([{ gameId: 'g1' }, { gameId: 'g2' }]),
      },
    };

    const service = new RecommendationFeedbackService(prisma as never);
    const ids = await service.getDismissedGameIds('u1');
    expect(ids).toEqual(['g1', 'g2']);
  });
});
