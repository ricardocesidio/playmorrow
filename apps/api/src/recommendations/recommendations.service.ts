import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagSimilarityScorer } from './scorers/tag-similarity.scorer';
import { FollowBasedScorer } from './scorers/follow-based.scorer';
import { TrendingScorer } from './scorers/trending.scorer';
import { WishlistSimilarityScorer } from './scorers/wishlist-similarity.scorer';
import { InteractionHistoryScorer } from './scorers/interaction-history.scorer';
import { InMemoryCacheProvider } from './in-memory-cache';
import type { RecommendationScorer } from './scorers/recommendation-scorer.interface';

export interface RecommendationItem {
  gameId: string;
  score: number;
  reasons: string[];
}

export interface RecommendationResult {
  items: RecommendationItem[];
  nextCursor: { score: number; gameId: string } | null;
  hasMore: boolean;
}

const WEIGHTS: Record<string, number> = {
  'tag-similarity': 0.25,
  'follow-based': 0.30,
  'wishlist-similarity': 0.20,
  'trending': 0.15,
  'interaction-history': 0.10,
};

const REASON_LABELS: Record<string, string> = {
  'tag-similarity': 'Similar tags and genres',
  'follow-based': 'Followed by similar users',
  'wishlist-similarity': 'Often wishlisted together',
  'trending': 'Trending now',
  'interaction-history': 'Based on your activity',
};

@Injectable()
export class RecommendationsService {
  private scorers: RecommendationScorer[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: InMemoryCacheProvider,
    tagScorer: TagSimilarityScorer,
    followScorer: FollowBasedScorer,
    trendingScorer: TrendingScorer,
    wishlistScorer: WishlistSimilarityScorer,
    interactionScorer: InteractionHistoryScorer,
  ) {
    this.scorers = [tagScorer, followScorer, trendingScorer, wishlistScorer, interactionScorer];
  }

  async getRecommendations(
    userId: string | null,
    type: 'for-you' | 'trending' | 'similar-games',
    gameId?: string,
    limit: number = 20,
    cursor?: { score: number; gameId: string } | null,
  ): Promise<RecommendationResult> {
    const cappedLimit = Math.min(limit, 50);

    // Build candidate pool
    let candidateIds: string[];

    const cacheKey = userId ? `rec:${type}:${userId}:${gameId || ''}` : `rec:${type}:public`;

    if (type === 'trending') {
      candidateIds = await this.getTrendingCandidates(cappedLimit + 1, cursor);
    } else if (type === 'similar-games' && gameId) {
      candidateIds = await this.getSimilarGameCandidates(gameId, cappedLimit + 1, cursor);
    } else {
      candidateIds = userId
        ? await this.getPersonalizedCandidates(userId, cappedLimit + 1)
        : await this.getTrendingCandidates(cappedLimit + 1, cursor);
    }

    if (candidateIds.length === 0) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    // Score candidates using all scorers
    const scorePromises = this.scorers.map(s => s.score(userId || '', candidateIds));
    const allScores = await Promise.all(scorePromises);

    // Aggregate weighted scores
    const finalScores = new Map<string, { total: number; reasons: string[] }>();
    for (const gameId of candidateIds) {
      finalScores.set(gameId, { total: 0, reasons: [] });
    }

    for (let si = 0; si < this.scorers.length; si++) {
      const scorer = this.scorers[si];
      const weight = WEIGHTS[scorer.name] || 0.10;
      const scores = allScores[si];
      const label = REASON_LABELS[scorer.name] || 'Recommended for you';
      let hasNonZero = false;

      for (const [gid, score] of scores) {
        const entry = finalScores.get(gid);
        if (entry && score > 0) {
          entry.total += score * weight;
          hasNonZero = true;
        }
      }

      // Add reason for ALL candidates that got a non-zero score from this scorer
      for (const [gid, score] of scores) {
        const entry = finalScores.get(gid);
        if (entry && score > 0) {
          if (!entry.reasons.some(r => r === label)) {
            entry.reasons.push(label);
          }
        }
      }
    }

    // Sort by score descending
    const sorted = [...finalScores.entries()]
      .sort(([, a], [, b]) => b.total - a.total);

    // Apply cursor if present
    let startIdx = 0;
    if (cursor) {
      startIdx = sorted.findIndex(([id, s]) => s.total <= cursor.score && id !== cursor.gameId);
      if (startIdx === -1) startIdx = 0;
    }

    const page = sorted.slice(startIdx, startIdx + cappedLimit);
    const hasMore = sorted.length > startIdx + cappedLimit;
    const lastItem = page[page.length - 1];
    const nextCursor = hasMore && lastItem
      ? { score: Math.round(lastItem[1].total * 100) / 100, gameId: lastItem[0] }
      : null;

    // Fetch game titles for the response
    const gameDetails = await this.prisma.game.findMany({
      where: { id: { in: page.map(([id]) => id) } },
      select: { id: true, title: true, slug: true, coverUrl: true, studio: { select: { name: true } } },
    });
    const gameDetailMap = new Map(gameDetails.map(g => [g.id, g]));

    const items: RecommendationItem[] = page.map(([gameId, data]) => ({
      gameId,
      score: Math.round(data.total * 100) / 100,
      reasons: data.reasons,
    }));

    return { items, nextCursor, hasMore };
  }

  private async getPersonalizedCandidates(userId: string, limit: number): Promise<string[]> {
    // Combine games from wishlist, follows, and popular games
    const [wishlist, follows, popular] = await Promise.all([
      this.prisma.wishlistItem.findMany({ where: { userId }, select: { gameId: true }, take: 50 }),
      this.prisma.follow.findMany({ where: { userId, targetType: 'GAME' }, select: { gameId: true }, take: 50 }),
      this.prisma.game.findMany({ where: { isPublished: true, featured: true }, select: { id: true }, take: 20 }),
    ]);

    const excludeIds = new Set([...wishlist.map(w => w.gameId), ...follows.map(f => f.gameId!)]);
    const candidateIds = await this.prisma.game.findMany({
      where: { id: { notIn: [...excludeIds] }, isPublished: true },
      select: { id: true },
      orderBy: [{ followersCount: 'desc' }],
      take: limit * 3,
    });

    return candidateIds.map(c => c.id).slice(0, limit * 3);
  }

  private async getTrendingCandidates(limit: number, cursor?: { score: number; gameId: string } | null): Promise<string[]> {
    const games = await this.prisma.game.findMany({
      where: { isPublished: true },
      select: { id: true, viewsCount: true, wishlistsCount: true, followersCount: true, createdAt: true },
      orderBy: [{ followersCount: 'desc' }],
      take: limit * 3,
    });

    // Simple trending: momentum = (views + wishlists*3 + follows*2) / age_days
    const now = Date.now();
    const scored = games.map(g => {
      const ageDays = Math.max(1, (now - g.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const momentum = (g.viewsCount + g.wishlistsCount * 3 + g.followersCount * 2) / ageDays;
      return { id: g.id, score: momentum };
    }).sort((a, b) => b.score - a.score);

    if (cursor) {
      const idx = scored.findIndex(s => s.score <= cursor.score && s.id !== cursor.gameId);
      return scored.slice(Math.max(0, idx)).map(s => s.id).slice(0, limit);
    }
    return scored.map(s => s.id).slice(0, limit);
  }

  private async getSimilarGameCandidates(gameId: string, limit: number, cursor?: { score: number; gameId: string } | null): Promise<string[]> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { studioId: true, genres: true, tags: { select: { tagId: true } } },
    });
    if (!game) return [];

    // Same studio + same tags
    const sameStudio = await this.prisma.game.findMany({
      where: { studioId: game.studioId, id: { not: gameId }, isPublished: true },
      select: { id: true },
      take: limit,
    });

    const tagIds = game.tags.map(t => t.tagId);
    const sameTags = tagIds.length > 0
      ? await this.prisma.gameTag.findMany({
          where: { tagId: { in: tagIds }, gameId: { not: gameId } },
          select: { gameId: true },
          take: limit * 2,
        })
      : [];

    const ids = [...new Set([
      ...sameStudio.map(g => g.id),
      ...sameTags.map(t => t.gameId),
    ])];

    return ids.slice(0, limit);
  }
}
