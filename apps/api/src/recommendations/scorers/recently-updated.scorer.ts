import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecommendationScorer } from './recommendation-scorer.interface';

@Injectable()
export class RecentlyUpdatedScorer implements RecommendationScorer {
  name = 'recently-updated';

  constructor(private readonly prisma: PrismaService) {}

  async score(_userId: string, candidateGameIds: string[]): Promise<Map<string, number>> {
    if (candidateGameIds.length === 0) return new Map();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentDevlogs, recentRoadmaps, recentGames] = await Promise.all([
      this.prisma.devlog.groupBy({
        by: ['gameId'],
        where: { gameId: { in: candidateGameIds }, publishedAt: { gte: sevenDaysAgo } },
        _count: { id: true },
      }),
      this.prisma.roadmapItem.groupBy({
        by: ['gameId'],
        where: { gameId: { in: candidateGameIds }, updatedAt: { gte: sevenDaysAgo } },
        _count: { id: true },
      }),
      this.prisma.game.findMany({
        where: { id: { in: candidateGameIds } },
        select: { id: true, updatedAt: true },
      }),
    ]);

    const devlogMap = new Map(recentDevlogs.map(d => [d.gameId, d._count.id]));
    const roadmapMap = new Map(recentRoadmaps.map(r => [r.gameId, r._count.id]));
    const updateMap = new Map(recentGames.map(g => [g.id, g.updatedAt.getTime()]));

    const now = Date.now();
    const scores = new Map<string, number>();

    for (const gameId of candidateGameIds) {
      const devlogs = devlogMap.get(gameId) || 0;
      const roadmaps = roadmapMap.get(gameId) || 0;
      const lastUpdate = updateMap.get(gameId) || now;
      const hoursSinceUpdate = Math.max(1, (now - lastUpdate) / (1000 * 60 * 60));

      const raw = (devlogs * 3 + roadmaps * 2) / Math.log(hoursSinceUpdate + 2);
      scores.set(gameId, raw);
    }

    const maxScore = Math.max(...scores.values(), 1);
    for (const [gameId, s] of scores) {
      scores.set(gameId, s / maxScore);
    }

    return scores;
  }
}
