/**
 * Follow-Based Scorer: scores candidate games higher if they are followed by
 * studios/users that the current user also follows.
 *
 * "People who follow X also follow Y"
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecommendationScorer } from './recommendation-scorer.interface';

@Injectable()
export class FollowBasedScorer implements RecommendationScorer {
  name = 'follow-based';
  private readonly WEIGHT = 0.30;

  constructor(private readonly prisma: PrismaService) {}

  async score(userId: string, candidateGameIds: string[]): Promise<Map<string, number>> {
    if (candidateGameIds.length === 0) return new Map();

    // Find who the user follows
    const myFollows = await this.prisma.follow.findMany({
      where: { userId },
      select: { targetType: true, studioId: true, gameId: true },
    });
    const myStudioIds = myFollows.filter(f => f.targetType === 'STUDIO' && f.studioId).map(f => f.studioId!);
    const myGameIds = myFollows.filter(f => f.targetType === 'GAME' && f.gameId).map(f => f.gameId!);

    if (myStudioIds.length === 0 && myGameIds.length === 0) {
      return new Map(candidateGameIds.map(id => [id, 0]));
    }

    // Find users who follow the same things I follow
    const similarUsers = await this.prisma.follow.findMany({
      where: {
        OR: [
          { studioId: { in: myStudioIds } },
          { gameId: { in: myGameIds } },
        ],
        userId: { not: userId },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    const similarUserIds = similarUsers.map(u => u.userId);
    if (similarUserIds.length === 0) return new Map(candidateGameIds.map(id => [id, 0]));

    // Count how many similar users follow each candidate game
    const candidateFollows = await this.prisma.follow.groupBy({
      by: ['gameId'],
      where: {
        gameId: { in: candidateGameIds },
        userId: { in: similarUserIds },
        targetType: 'GAME',
      },
      _count: { userId: true },
    });

    const followCount = new Map(candidateFollows.map(f => [f.gameId!, f._count.userId]));
    const maxCount = Math.max(...followCount.values(), 1);

    const scores = new Map<string, number>();
    for (const gameId of candidateGameIds) {
      scores.set(gameId, (followCount.get(gameId) || 0) / maxCount);
    }

    return scores;
  }
}
