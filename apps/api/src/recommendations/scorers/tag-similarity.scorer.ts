/**
 * Tag Similarity Scorer: scores candidate games by how many tags they share
 * with games the user has interacted with (wishlisted, followed, viewed).
 *
 * Formula: score = shared_tags / max_possible_tags
 * Higher score = more tag overlap = more similar.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecommendationScorer } from './recommendation-scorer.interface';

@Injectable()
export class TagSimilarityScorer implements RecommendationScorer {
  name = 'tag-similarity';
  private readonly WEIGHT = 0.25;

  constructor(private readonly prisma: PrismaService) {}

  async score(userId: string, candidateGameIds: string[]): Promise<Map<string, number>> {
    if (candidateGameIds.length === 0) return new Map();

    // Get tags of games the user has interacted with (wishlist + follows)
    const wishlistedGameIds = (await this.prisma.wishlistItem.findMany({
      where: { userId },
      select: { gameId: true },
    })).map(w => w.gameId);

    const followedGameIds = (await this.prisma.follow.findMany({
      where: { userId, targetType: 'GAME' },
      select: { gameId: true },
    })).map(f => f.gameId!);

    const interactedIds = [...new Set([...wishlistedGameIds, ...followedGameIds])];
    if (interactedIds.length === 0) return new Map(candidateGameIds.map(id => [id, 0]));

    // Get tags for interacted games
    const interactedTags = await this.prisma.gameTag.findMany({
      where: { gameId: { in: interactedIds } },
      select: { tag: { select: { id: true } } },
    });
    const interactedTagIds = new Set(interactedTags.map(t => t.tag.id));

    if (interactedTagIds.size === 0) return new Map(candidateGameIds.map(id => [id, 0]));

    // Get tags for candidate games
    const candidateTags = await this.prisma.gameTag.findMany({
      where: { gameId: { in: candidateGameIds } },
      select: { gameId: true, tag: { select: { id: true } } },
    });

    // Build tag sets per candidate
    const candidateTagMap = new Map<string, Set<string>>();
    for (const ct of candidateTags) {
      const set = candidateTagMap.get(ct.gameId) || new Set();
      set.add(ct.tag.id);
      candidateTagMap.set(ct.gameId, set);
    }

    // Score: shared tags / total unique tags (user's + candidate's)
    const scores = new Map<string, number>();
    for (const gameId of candidateGameIds) {
      const gameTags = candidateTagMap.get(gameId);
      if (!gameTags || gameTags.size === 0) {
        scores.set(gameId, 0);
        continue;
      }
      let shared = 0;
      for (const tagId of gameTags) {
        if (interactedTagIds.has(tagId)) shared++;
      }
      const union = new Set([...interactedTagIds, ...gameTags]);
      scores.set(gameId, union.size > 0 ? shared / union.size : 0);
    }

    return scores;
  }
}
