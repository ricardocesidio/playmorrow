import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecommendationScorer } from './recommendation-scorer.interface';

@Injectable()
export class HiddenGemsScorer implements RecommendationScorer {
  name = 'hidden-gems';

  constructor(private readonly prisma: PrismaService) {}

  async score(_userId: string, candidateGameIds: string[]): Promise<Map<string, number>> {
    if (candidateGameIds.length === 0) return new Map();

    const games = await this.prisma.game.findMany({
      where: { id: { in: candidateGameIds } },
      select: {
        id: true,
        viewsCount: true,
        wishlistsCount: true,
        followersCount: true,
        commentsCount: true,
      },
    });

    const scores = new Map<string, number>();
    for (const g of games) {
      if (g.viewsCount === 0) { scores.set(g.id, 0); continue; }

      const engagementRate = (g.wishlistsCount * 3 + g.followersCount * 2 + g.commentsCount * 2) / g.viewsCount;
      const visibilityPenalty = Math.log(g.viewsCount + 1);

      scores.set(g.id, engagementRate / visibilityPenalty);
    }

    const maxScore = Math.max(...scores.values(), 1);
    for (const [gameId, s] of scores) {
      scores.set(gameId, s / maxScore);
    }

    return scores;
  }
}
