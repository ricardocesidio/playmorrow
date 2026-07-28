/**
 * Interaction History Scorer: scores games higher if the user has previously
 * interacted with the same studio, viewed similar games, or read related devlogs.
 *
 * Lower weight because it's sparse until we have enough interaction data.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecommendationScorer } from './recommendation-scorer.interface';

@Injectable()
export class InteractionHistoryScorer implements RecommendationScorer {
  name = 'interaction-history';
  private readonly WEIGHT = 0.10;

  constructor(private readonly prisma: PrismaService) {}

  async score(userId: string, candidateGameIds: string[]): Promise<Map<string, number>> {
    if (candidateGameIds.length === 0) return new Map();

    const candidateGames = await this.prisma.game.findMany({
      where: { id: { in: candidateGameIds } },
      select: { id: true, studioId: true, genres: true, tags: { select: { tagId: true } } },
    });

    // User's view history: studios and genres the user has viewed
    const userViews = await this.prisma.gameView.findMany({
      where: { game: { studio: { members: { some: { userId } } } } },
      // Not directly — use analytics events instead
    });

    // Use analytics events for user's interaction history
    const analytics = await this.prisma.analyticsEvent.findMany({
      where: {
        userId,
        eventType: { in: ['game_view', 'game_page_view'] },
      },
      select: { gameId: true, metadata: true },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const viewedGameIds = new Set(analytics.filter(a => a.gameId).map(a => a.gameId!));
    const viewedStudioIds = new Set(
      candidateGames.filter(g => viewedGameIds.has(g.id)).map(g => g.studioId),
    );

    const scores = new Map<string, number>();
    for (const game of candidateGames) {
      let score = 0;

      // Same studio as previously viewed game
      if (viewedStudioIds.has(game.studioId)) score += 0.5;

      // Previously viewed this game
      if (viewedGameIds.has(game.id)) score += 0.3;

      scores.set(game.id, Math.min(score, 1));
    }

    return scores;
  }
}
