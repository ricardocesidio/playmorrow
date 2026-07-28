import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { RecommendationsService } from './recommendations.service';
import { TagSimilarityScorer } from './scorers/tag-similarity.scorer';
import { FollowBasedScorer } from './scorers/follow-based.scorer';
import { TrendingScorer } from './scorers/trending.scorer';
import { WishlistSimilarityScorer } from './scorers/wishlist-similarity.scorer';
import { InteractionHistoryScorer } from './scorers/interaction-history.scorer';
import { InMemoryCacheProvider } from './in-memory-cache';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.setConfig({ testTimeout: 30_000 });

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
      providers: [
        RecommendationsService,
        TagSimilarityScorer,
        FollowBasedScorer,
        TrendingScorer,
        WishlistSimilarityScorer,
        InteractionHistoryScorer,
        InMemoryCacheProvider,
      ],
    }).compile();
    service = module.get(RecommendationsService);
  });

  it('should return trending recommendations', async () => {
    const result = await service.getRecommendations(null, 'trending');
    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('should respect limit parameter', async () => {
    const result = await service.getRecommendations(null, 'trending', undefined, 3);
    expect(result.items.length).toBeLessThanOrEqual(3);
  });

  it('should include explainable reasons', async () => {
    const result = await service.getRecommendations(null, 'trending', undefined, 5);
    for (const item of result.items) {
      if (item.score > 0) {
        expect(item.reasons.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have cursor pagination', async () => {
    const result = await service.getRecommendations(null, 'trending', undefined, 2);
    if (result.hasMore) {
      expect(result.nextCursor).not.toBeNull();
      expect(result.nextCursor).toHaveProperty('score');
      expect(result.nextCursor).toHaveProperty('gameId');
    }
  });
});
