import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecommendationScorer } from './recommendation-scorer.interface';

@Injectable()
export class SimilarStudiosScorer implements RecommendationScorer {
  name = 'similar-studios';

  constructor(private readonly prisma: PrismaService) {}

  async score(userId: string, candidateGameIds: string[]): Promise<Map<string, number>> {
    if (candidateGameIds.length === 0 || !userId) return new Map();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { studioMemberships: { select: { studioId: true } } },
    });
    if (!user || user.studioMemberships.length === 0) return new Map();

    const myStudioIds = user.studioMemberships.map(m => m.studioId);

    const [myTags, candidateStudios] = await Promise.all([
      this.prisma.gameTag.findMany({
        where: { game: { studioId: { in: myStudioIds } } },
        select: { tagId: true },
        distinct: ['tagId'],
      }),
      this.prisma.game.findMany({
        where: { id: { in: candidateGameIds }, studioId: { notIn: myStudioIds } },
        select: { id: true, studioId: true, genres: true },
      }),
    ]);

    const myTagSet = new Set(myTags.map(t => t.tagId));
    const filtered = candidateStudios.filter((g): g is typeof g & { studioId: string } => g.studioId !== null);
    const studioGameMap = new Map<string, { id: string; genres: string | null }[]>();
    for (const g of filtered) {
      const list = studioGameMap.get(g.studioId) || [];
      list.push(g);
      studioGameMap.set(g.studioId, list);
    }

    const scores = new Map<string, number>();
    for (const [studioId, games] of studioGameMap) {
      let tagOverlap = 0;
      const candidateTagIds = await this.prisma.gameTag.findMany({
        where: { game: { studioId } },
        select: { tagId: true },
        distinct: ['tagId'],
      });

      for (const t of candidateTagIds) {
        if (myTagSet.has(t.tagId)) tagOverlap++;
      }

      const overlapRatio = candidateTagIds.length > 0 ? tagOverlap / candidateTagIds.length : 0;
      for (const g of games) {
        scores.set(g.id, overlapRatio);
      }
    }

    const maxScore = Math.max(...scores.values(), 1);
    for (const [gameId, s] of scores) {
      scores.set(gameId, s / maxScore);
    }

    return scores;
  }
}
