/**
 * Trending Scorer: measures engagement velocity, not total volume.
 *
 * score = (views_7d * 1 + wishlist_adds_7d * 3 + follows_7d * 2 + comments_7d * 2) / age_decay
 * age_decay = ln(days_since_publish + 2) — prevents old games with high totals from always winning
 *
 * Calculated as a batch job, cached via the cache provider.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecommendationScorer } from './recommendation-scorer.interface';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class TrendingScorer implements RecommendationScorer {
  name = 'trending';
  private readonly WEIGHT = 0.15;

  constructor(private readonly prisma: PrismaService) {}

  async score(_userId: string, candidateGameIds: string[]): Promise<Map<string, number>> {
    if (candidateGameIds.length === 0) return new Map();

    const now = Date.now();
    const sevenDaysAgo = new Date(now - SEVEN_DAYS_MS);

    // Batch: get all data in parallel
    const [views, wishlists, follows, comments, games] = await Promise.all([
      this.prisma.gameView.groupBy({
        by: ['gameId'],
        where: { gameId: { in: candidateGameIds }, createdAt: { gte: sevenDaysAgo } },
        _count: { id: true },
      }),
      this.prisma.wishlistItem.groupBy({
        by: ['gameId'],
        where: { gameId: { in: candidateGameIds }, createdAt: { gte: sevenDaysAgo } },
        _count: { id: true },
      }),
      this.prisma.follow.groupBy({
        by: ['gameId'],
        where: { gameId: { in: candidateGameIds }, targetType: 'GAME', createdAt: { gte: sevenDaysAgo } },
        _count: { id: true },
      }),
      this.prisma.comment.groupBy({
        by: ['gameId'],
        where: { gameId: { in: candidateGameIds }, createdAt: { gte: sevenDaysAgo } },
        _count: { id: true },
      }),
      this.prisma.game.findMany({
        where: { id: { in: candidateGameIds } },
        select: { id: true, publishedAt: true, createdAt: true },
      }),
    ]);

    const viewMap = new Map(views.map(v => [v.gameId, v._count.id]));
    const wishlistMap = new Map(wishlists.map(w => [w.gameId, w._count.id]));
    const followMap = new Map(follows.map(f => [f.gameId, f._count.id]));
    const commentMap = new Map(comments.map(c => [c.gameId, c._count.id]));
    const ageMap = new Map(games.map(g => [g.id, (g.publishedAt || g.createdAt).getTime()]));

    const scores = new Map<string, number>();
    for (const gameId of candidateGameIds) {
      const ageDays = (now - (ageMap.get(gameId) || now)) / (1000 * 60 * 60 * 24);
      const ageDecay = Math.max(1, Math.log(ageDays + 2));

      const raw = (viewMap.get(gameId) || 0) * 1
        + (wishlistMap.get(gameId) || 0) * 3
        + (followMap.get(gameId) || 0) * 2
        + (commentMap.get(gameId) || 0) * 2;

      scores.set(gameId, raw / ageDecay);
    }

    // Normalize to 0-1
    const maxScore = Math.max(...scores.values(), 1);
    for (const [gameId, s] of scores) {
      scores.set(gameId, s / maxScore);
    }

    return scores;
  }
}
