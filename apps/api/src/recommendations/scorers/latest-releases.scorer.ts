import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecommendationScorer } from './recommendation-scorer.interface';

@Injectable()
export class LatestReleasesScorer implements RecommendationScorer {
  name = 'latest-releases';

  constructor(private readonly prisma: PrismaService) {}

  async score(_userId: string, candidateGameIds: string[]): Promise<Map<string, number>> {
    if (candidateGameIds.length === 0) return new Map();

    const games = await this.prisma.game.findMany({
      where: { id: { in: candidateGameIds } },
      select: { id: true, status: true, releaseDate: true, createdAt: true, followersCount: true },
    });

    const now = Date.now();
    const scores = new Map<string, number>();

    for (const g of games) {
      const isReleased = g.status === 'RELEASED';
      const releaseTime = g.releaseDate?.getTime();
      if (!isReleased || !releaseTime) { scores.set(g.id, 0); continue; }

      const daysSinceRelease = (now - releaseTime) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - daysSinceRelease / 90);
      const popularityBoost = Math.log(g.followersCount + 1) / 10;

      scores.set(g.id, recencyScore + popularityBoost);
    }

    const maxScore = Math.max(...scores.values(), 1);
    for (const [gameId, s] of scores) {
      scores.set(gameId, s / maxScore);
    }

    return scores;
  }
}
