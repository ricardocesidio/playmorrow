import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagSimilarityScorer } from './scorers/tag-similarity.scorer';
import { FollowBasedScorer } from './scorers/follow-based.scorer';
import { TrendingScorer } from './scorers/trending.scorer';
import { WishlistSimilarityScorer } from './scorers/wishlist-similarity.scorer';
import { InteractionHistoryScorer } from './scorers/interaction-history.scorer';
import { HiddenGemsScorer } from './scorers/hidden-gems.scorer';
import { SimilarStudiosScorer } from './scorers/similar-studios.scorer';
import { RecentlyUpdatedScorer } from './scorers/recently-updated.scorer';
import { LatestReleasesScorer } from './scorers/latest-releases.scorer';
import { InMemoryCacheProvider } from './in-memory-cache';
import type { RecommendationScorer } from './scorers/recommendation-scorer.interface';

interface RecommendationItem {
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
  'hidden-gems': 'Hidden gem — high engagement, low visibility',
  'similar-studios': 'From a similar studio',
  'recently-updated': 'Recently updated',
  'latest-releases': 'Latest release',
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
    hiddenGemsScorer: HiddenGemsScorer,
    similarStudiosScorer: SimilarStudiosScorer,
    recentlyUpdatedScorer: RecentlyUpdatedScorer,
    latestReleasesScorer: LatestReleasesScorer,
  ) {
    this.scorers = [
      tagScorer, followScorer, trendingScorer, wishlistScorer,
      interactionScorer, hiddenGemsScorer, similarStudiosScorer,
      recentlyUpdatedScorer, latestReleasesScorer,
    ];
  }

  async getRecommendations(
    userId: string | null,
    type: 'for-you' | 'trending' | 'similar-games' | 'hidden-gems' | 'similar-studios' | 'recently-updated' | 'latest-releases',
    gameId?: string,
    studioId?: string,
    limit: number = 20,
    cursor?: { score: number; gameId: string } | null,
  ): Promise<RecommendationResult> {
    const cappedLimit = Math.min(limit, 50);
    let candidateIds: string[];

    if (type === 'trending') {
      candidateIds = await this.getTrendingCandidates(cappedLimit + 1, cursor);
    } else if (type === 'similar-games' && gameId) {
      candidateIds = await this.getSimilarGameCandidates(gameId, cappedLimit + 1, cursor);
    } else if (type === 'hidden-gems') {
      candidateIds = await this.getHiddenGemsCandidates(cappedLimit + 1, cursor);
    } else if (type === 'similar-studios' && studioId) {
      candidateIds = await this.getSimilarStudioCandidates(studioId, cappedLimit + 1, cursor);
    } else if (type === 'recently-updated') {
      candidateIds = await this.getRecentlyUpdatedCandidates(cappedLimit + 1, cursor);
    } else if (type === 'latest-releases') {
      candidateIds = await this.getLatestReleaseCandidates(cappedLimit + 1, cursor);
    } else {
      candidateIds = userId
        ? await this.getPersonalizedCandidates(userId, cappedLimit + 1)
        : await this.getTrendingCandidates(cappedLimit + 1, cursor);
    }

    if (candidateIds.length === 0) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    const usedScorers = type === 'hidden-gems'
      ? this.scorers.filter(s => s.name === 'hidden-gems')
      : type === 'similar-studios'
        ? this.scorers.filter(s => s.name === 'similar-studios')
        : type === 'recently-updated'
          ? this.scorers.filter(s => s.name === 'recently-updated')
          : type === 'latest-releases'
            ? this.scorers.filter(s => s.name === 'latest-releases')
            : this.scorers;

    const scorePromises = usedScorers.map(s => s.score(userId || '', candidateIds));
    const allScores = await Promise.all(scorePromises);

    const finalScores = new Map<string, { total: number; reasons: string[] }>();
    for (const gameId of candidateIds) {
      finalScores.set(gameId, { total: 0, reasons: [] });
    }

    for (let si = 0; si < usedScorers.length; si++) {
      const scorer = usedScorers[si];
      const weight = WEIGHTS[scorer.name] || 1.0;
      const scores = allScores[si];
      const label = REASON_LABELS[scorer.name] || 'Recommended for you';
      for (const [gid, score] of scores) {
        const entry = finalScores.get(gid);
        if (entry && score > 0) {
          entry.total += score * weight;
          if (!entry.reasons.some(r => r === label)) {
            entry.reasons.push(label);
          }
        }
      }
    }

    const sorted = [...finalScores.entries()]
      .sort(([, a], [, b]) => b.total - a.total);

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

  private async getSimilarGameCandidates(gameId: string, limit: number, _cursor?: { score: number; gameId: string } | null): Promise<string[]> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { studioId: true, genres: true, tags: { select: { tagId: true } } },
    });
    if (!game) return [];

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

  private async getHiddenGemsCandidates(limit: number, _cursor?: { score: number; gameId: string } | null): Promise<string[]> {
    return (await this.prisma.game.findMany({
      where: { isPublished: true },
      select: { id: true, viewsCount: true, wishlistsCount: true, followersCount: true, commentsCount: true },
      orderBy: [{ viewsCount: 'asc' }],
      take: limit * 5,
    }))
      .filter(g => g.viewsCount > 0 && g.viewsCount < 1000)
      .sort((a, b) => {
        const scoreA = (a.wishlistsCount * 3 + a.followersCount * 2 + a.commentsCount * 2) / Math.log(a.viewsCount + 1);
        const scoreB = (b.wishlistsCount * 3 + b.followersCount * 2 + b.commentsCount * 2) / Math.log(b.viewsCount + 1);
        return scoreB - scoreA;
      })
      .map(g => g.id)
      .slice(0, limit);
  }

  private async getSimilarStudioCandidates(studioId: string, limit: number, _cursor?: { score: number; gameId: string } | null): Promise<string[]> {
    const myTags = await this.prisma.gameTag.findMany({
      where: { game: { studioId } },
      select: { tagId: true },
      distinct: ['tagId'],
    });
    const myTagSet = new Set(myTags.map(t => t.tagId));

    const sameTagGames = myTagSet.size > 0
      ? await this.prisma.gameTag.findMany({
          where: { tagId: { in: [...myTagSet] }, game: { studioId: { not: studioId }, isPublished: true } },
          select: { gameId: true },
          take: limit * 3,
        })
      : [];

    const studioCounts = new Map<string, number>();
    for (const g of sameTagGames) {
      studioCounts.set(g.gameId, (studioCounts.get(g.gameId) || 0) + 1);
    }

    return [...studioCounts.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([id]) => id)
      .slice(0, limit);
  }

  private async getRecentlyUpdatedCandidates(limit: number, _cursor?: { score: number; gameId: string } | null): Promise<string[]> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentDevlogs, recentRoadmaps, games] = await Promise.all([
      this.prisma.devlog.findMany({
        where: { publishedAt: { gte: sevenDaysAgo }, game: { isPublished: true } },
        select: { gameId: true },
        distinct: ['gameId'],
        take: limit * 2,
      }),
      this.prisma.roadmapItem.findMany({
        where: { updatedAt: { gte: sevenDaysAgo }, game: { isPublished: true } },
        select: { gameId: true },
        distinct: ['gameId'],
        take: limit * 2,
      }),
      this.prisma.game.findMany({
        where: { isPublished: true },
        select: { id: true, updatedAt: true },
        take: limit * 5,
      }),
    ]);

    const devlogIds = new Set(recentDevlogs.map(d => d.gameId));
    const roadmapIds = new Set(recentRoadmaps.map(r => r.gameId));

    const scored = games
      .filter(g => devlogIds.has(g.id) || roadmapIds.has(g.id))
      .map(g => ({
        id: g.id,
        score: (devlogIds.has(g.id) ? 3 : 0) + (roadmapIds.has(g.id) ? 2 : 0),
      }))
      .sort((a, b) => b.score - a.score);

    return scored.map(s => s.id).slice(0, limit);
  }

  private async getLatestReleaseCandidates(limit: number, _cursor?: { score: number; gameId: string } | null): Promise<string[]> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const games = await this.prisma.game.findMany({
      where: { isPublished: true, status: 'RELEASED', releaseDate: { gte: ninetyDaysAgo } },
      select: { id: true, releaseDate: true, followersCount: true },
      orderBy: [{ releaseDate: 'desc' }],
      take: limit,
    });

    return games.map(g => g.id);
  }
}
