import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecommendationFeedbackAction } from '@playmorrow/database';

export interface FeedbackCounts {
  clicks: number;
  dismissals: number;
  wishlists: number;
}

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

  async countFeedback(days = 7): Promise<FeedbackCounts> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [clicks, dismissals, wishlists] = await Promise.all([
      this.prisma.recommendationFeedback.count({ where: { action: 'CLICKED', createdAt: { gte: since } } }),
      this.prisma.recommendationFeedback.count({ where: { action: 'DISMISSED', createdAt: { gte: since } } }),
      this.prisma.recommendationFeedback.count({ where: { action: 'WISHLISTED', createdAt: { gte: since } } }),
    ]);
    return { clicks, dismissals, wishlists };
  }
}
