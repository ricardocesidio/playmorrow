import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProviderFactory } from '../../ai/providers/provider.factory';

interface GameTagName {
  tag: { name: string };
}

interface GameCandidate {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  genres: string | null;
  coverUrl: string | null;
  tags: GameTagName[];
  studio: { id: string; name: string; slug: string };
  _count: { wishlistItems: number; followers: number };
}

interface ScoredGame extends GameCandidate {
  score: number;
  reasons: string[];
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private prisma: PrismaService,
    private providerFactory: ProviderFactory,
  ) {}

  async getRecommendations(userId: string, limit = 10) {
    const tagSelect = {
      tags: { select: { tag: { select: { name: true } } } },
    } as const;

    const recentWishlist = await this.prisma.wishlistItem.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        game: {
          select: {
            id: true,
            title: true,
            ...tagSelect,
          },
        },
      },
    });

    const followedStudios = await this.prisma.follow.findMany({
      where: { userId, targetType: 'STUDIO' },
      select: { studioId: true },
    });

    const followedStudioIds = followedStudios
      .map((f) => f.studioId)
      .filter(Boolean) as string[];

    const recentGameIds = recentWishlist
      .map((w) => w.game?.id)
      .filter(Boolean) as string[];

    const candidates = (await this.prisma.game.findMany({
      where: {
        isPublished: true,
        id: { notIn: recentGameIds },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        genres: true,
        coverUrl: true,
        ...tagSelect,
        studio: { select: { id: true, name: true, slug: true } },
        _count: { select: { wishlistItems: true, followers: true } },
      },
      take: 100,
    })) as unknown as GameCandidate[];

    const userGameTags = recentWishlist.flatMap((w) =>
      w.game?.tags?.map((gt: GameTagName) => gt.tag.name) ?? [],
    );

    const scored: ScoredGame[] = candidates.map((game) => {
      let score = 0;
      const reasons: string[] = [];
      const gameTagNames = game.tags.map((gt) => gt.tag.name);

      for (const wish of recentWishlist) {
        if (!wish.game) continue;
        const wishTagNames = wish.game.tags?.map((gt: GameTagName) => gt.tag.name) ?? [];
        const sharedTags = wishTagNames.filter((t) => gameTagNames.includes(t));
        if (sharedTags.length > 0) {
          score += sharedTags.length * 3;
          if (reasons.length === 0) {
            reasons.push(
              `similar tags to ${wish.game.title} (${sharedTags.slice(0, 2).join(', ')})`,
            );
          }
        }
      }

      if (followedStudioIds.includes(game.studio.id)) {
        score += 8;
        reasons.push(`From ${game.studio.name} (you follow this studio)`);
      }

      score += Math.log2(game._count.wishlistItems + 1);
      score += Math.log2(game._count.followers + 1);

      return { ...game, score, reasons };
    });

    const recommendations = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ tags: _tags, _count, score: _score, reasons, ...game }) => ({
        ...game,
        explanation:
          reasons.length > 0
            ? reasons[0]
            : 'Popular on Playmorrow',
      }));

    const hasHistory = recentWishlist.length > 0;

    return {
      recommendations,
      total: recommendations.length,
      method: hasHistory ? 'content-based' : 'popularity-fallback',
      basedOnTags: [...new Set(userGameTags)],
    };
  }
}
