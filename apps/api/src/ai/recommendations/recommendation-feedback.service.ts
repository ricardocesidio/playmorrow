import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecommendationFeedbackAction } from '@playmorrow/database';

export interface FeedbackCounts {
  clicks: number;
  dismissals: number;
  wishlists: number;
  impressions: number;
  ctr: number;
}

export interface ImpressionResult {
  recorded: number;
  deduplicated: number;
  invalid: number;
}

/** Same (user, game) impression within this window is a duplicate (re-render). */
const IMPRESSION_DEDUP_WINDOW_MIN = 60;
const MAX_IMPRESSIONS_PER_REQUEST = 50;

/**
 * CTR + dismissal feedback for the M23 engine. Feeds the recommendation
 * metrics dashboard and the dismissal filter in HybridRecommenderService.
 */
@Injectable()
export class RecommendationFeedbackService {
  private readonly logger = new Logger(RecommendationFeedbackService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(userId: string, gameId: string, action: RecommendationFeedbackAction): Promise<void> {
    const game = await this.prisma.game.findFirst({
      where: { id: gameId, isPublished: true },
      select: { id: true },
    });
    if (!game) {
      this.logger.warn(`Feedback for unknown game ${gameId} ignored`);
      return;
    }

    await this.prisma.recommendationFeedback.create({ data: { userId, gameId, action } });
  }

  /**
   * Records feed impressions (CTR denominator). Deduplicated per
   * (user, game) within a 60-minute window so re-renders of the same page
   * don't inflate impressions. Only published games count.
   */
  async recordImpressions(userId: string, gameIds: string[]): Promise<ImpressionResult> {
    const raw = gameIds.slice(0, MAX_IMPRESSIONS_PER_REQUEST);
    if (raw.length === 0) return { recorded: 0, deduplicated: 0, invalid: 0 };

    const games = await this.prisma.game.findMany({
      where: { id: { in: raw }, isPublished: true },
      select: { id: true },
    });
    const validIds = new Set(games.map((g) => g.id));
    const invalid = [...new Set(raw)].filter((id) => !validIds.has(id)).length;

    const since = new Date(Date.now() - IMPRESSION_DEDUP_WINDOW_MIN * 60 * 1000);
    const existing = await this.prisma.recommendationFeedback.findMany({
      where: { userId, action: 'IMPRESSION', gameId: { in: raw }, createdAt: { gte: since } },
      select: { gameId: true },
      distinct: ['gameId'],
    });
    const seen = new Set(existing.map((r) => r.gameId));

    const toRecord = [...validIds].filter((id) => !seen.has(id));
    if (toRecord.length > 0) {
      await this.prisma.recommendationFeedback.createMany({
        data: toRecord.map((gameId) => ({ userId, gameId, action: 'IMPRESSION' as const })),
      });
    }

    // Everything sent that was neither recorded nor unknown was a duplicate
    // (repeated in the request, or already seen within the dedup window).
    return { recorded: toRecord.length, deduplicated: raw.length - toRecord.length - invalid, invalid };
  }

  /**
   * Deletes ALL recommendation feedback (clicks, dismissals, wishlists,
   * impressions) for the current user — "reset recommendation history"
   * (AI Constitution Art. 5 / Principle 3). Scoped to the session user only;
   * nothing else on the account is touched. Dismissal exclusions disappear
   * with the rows, so future feeds deterministically treat those games as
   * candidates again.
   */
  async resetForUser(userId: string): Promise<number> {
    const result = await this.prisma.recommendationFeedback.deleteMany({ where: { userId } });
    this.logger.log(`Recommendation feedback reset for user ${userId}: ${result.count} rows deleted`);
    return result.count;
  }

  async getDismissedGameIds(userId: string, days = 30): Promise<string[]> {
    const rows = await this.prisma.recommendationFeedback.findMany({
      where: {
        userId,
        action: 'DISMISSED',
        createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
      },
      select: { gameId: true },
    });
    return rows.map((r) => r.gameId);
  }

  /**
   * CTR and volume over the trailing window:
   *   CTR = CLICKED / IMPRESSION (per game or overall), capped at 1.
   * Impressions deduplicated at write time; clicks may repeat (re-clicking
   * the same recommendation is a legitimate signal).
   */
  async countFeedback(days = 7): Promise<FeedbackCounts> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [clicks, dismissals, wishlists, impressions] = await Promise.all([
      this.prisma.recommendationFeedback.count({ where: { action: 'CLICKED', createdAt: { gte: since } } }),
      this.prisma.recommendationFeedback.count({ where: { action: 'DISMISSED', createdAt: { gte: since } } }),
      this.prisma.recommendationFeedback.count({ where: { action: 'WISHLISTED', createdAt: { gte: since } } }),
      this.prisma.recommendationFeedback.count({ where: { action: 'IMPRESSION', createdAt: { gte: since } } }),
    ]);
    return {
      clicks,
      dismissals,
      wishlists,
      impressions,
      ctr: impressions > 0 ? Math.min(1, clicks / impressions) : 0,
    };
  }
}
