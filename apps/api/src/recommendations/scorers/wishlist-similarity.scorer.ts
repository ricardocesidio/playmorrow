/**
 * Wishlist Similarity Scorer: games that appear together in wishlists get scored higher.
 * If users who wishlisted game A also wishlisted game B, B is recommended.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecommendationScorer } from './recommendation-scorer.interface';

@Injectable()
export class WishlistSimilarityScorer implements RecommendationScorer {
  name = 'wishlist-similarity';
  private readonly WEIGHT = 0.20;

  constructor(private readonly prisma: PrismaService) {}

  async score(userId: string, candidateGameIds: string[]): Promise<Map<string, number>> {
    if (candidateGameIds.length === 0) return new Map();

    // Games in the user's wishlist
    const myWishlist = await this.prisma.wishlistItem.findMany({
      where: { userId },
      select: { gameId: true },
    });
    const myWishlistIds = myWishlist.map(w => w.gameId);
    if (myWishlistIds.length === 0) return new Map(candidateGameIds.map(id => [id, 0]));

    // Users who share wishlisted games with me
    const similarUsers = await this.prisma.wishlistItem.findMany({
      where: {
        gameId: { in: myWishlistIds },
        userId: { not: userId },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    const similarUserIds = similarUsers.map(u => u.userId);
    if (similarUserIds.length === 0) return new Map(candidateGameIds.map(id => [id, 0]));

    // Count co-wishlists for each candidate
    const coWishlists = await this.prisma.wishlistItem.groupBy({
      by: ['gameId'],
      where: {
        gameId: { in: candidateGameIds },
        userId: { in: similarUserIds },
      },
      _count: { userId: true },
    });

    const countMap = new Map(coWishlists.map(c => [c.gameId, c._count.userId]));
    const maxCount = Math.max(...countMap.values(), 1);

    const scores = new Map<string, number>();
    for (const gameId of candidateGameIds) {
      scores.set(gameId, (countMap.get(gameId) || 0) / maxCount);
    }

    return scores;
  }
}
