import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingService } from '../rag/embedding.service';

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
  private embeddingCache = new Map<string, { embedding: number[]; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private prisma: PrismaService,
    private embeddingService: EmbeddingService,
  ) {}

  async getRecommendations(userId: string, limit = 10) {
    const tagSelect = {
      tags: { select: { tag: { select: { name: true } } } },
    } as const;

    const recentWishlist = await this.prisma.wishlistItem.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        game: {
          select: { id: true, title: true, description: true, ...tagSelect },
        },
      },
    });

    const followedStudios = await this.prisma.follow.findMany({
      where: { userId, targetType: 'STUDIO' },
      select: { studioId: true },
    });

    const followedStudioIds = followedStudios.map((f) => f.studioId).filter(Boolean) as string[];
    const recentGameIds = recentWishlist.map((w) => w.game?.id).filter(Boolean) as string[];

    const candidates = (await this.prisma.game.findMany({
      where: { isPublished: true, id: { notIn: recentGameIds } },
      select: {
        id: true, title: true, slug: true, description: true,
        genres: true, coverUrl: true, ...tagSelect,
        studio: { select: { id: true, name: true, slug: true } },
        _count: { select: { wishlistItems: true, followers: true } },
      },
      take: 50,
    })) as unknown as GameCandidate[];

    const scored: ScoredGame[] = await this.scoreWithEmbeddings(recentWishlist, candidates, followedStudioIds);

    const recommendations = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ tags: _tags, _count, score: _score, reasons, ...game }) => ({
        ...game,
        explanation: reasons.length > 0 ? reasons[0] : 'Popular on Playmorrow',
      }));

    return {
      recommendations,
      total: recommendations.length,
      method: recentWishlist.length > 0 ? 'semantic-embedding' : 'popularity-fallback',
    };
  }

  private async embedCached(texts: string[]): Promise<{ embedding: number[]; cached: boolean }[]> {
    const results: { embedding: number[]; cached: boolean }[] = [];
    const toGenerate: { text: string; index: number }[] = [];

    for (let i = 0; i < texts.length; i++) {
      const key = texts[i].substring(0, 200);
      const cached = this.embeddingCache.get(key);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        results[i] = { embedding: cached.embedding, cached: true };
      } else {
        toGenerate.push({ text: texts[i], index: i });
      }
    }

    if (toGenerate.length > 0) {
      const freshEmbeddings = await this.embeddingService.embedTexts(toGenerate.map(t => t.text));
      for (let j = 0; j < toGenerate.length; j++) {
        const key = toGenerate[j].text.substring(0, 200);
        const emb = freshEmbeddings[j].embedding;
        this.embeddingCache.set(key, { embedding: emb, timestamp: Date.now() });
        results[toGenerate[j].index] = { embedding: emb, cached: false };
      }
      this.logger.log(`Generated ${toGenerate.length} new embeddings (${results.filter(r => r.cached).length} cached)`);
    }

    return results;
  }

  private async scoreWithEmbeddings(
    wishlist: { game: { id: string; title: string; description: string | null } | null }[],
    candidates: GameCandidate[],
    followedStudioIds: string[],
  ): Promise<ScoredGame[]> {
    const wishlistGames = wishlist.filter((w) => w.game?.description).map((w) => w.game!);
    const hasEmbeddingData = wishlistGames.length > 0;

    if (!hasEmbeddingData) {
      return candidates.map((game) => ({
        ...game,
        score: Math.log2(game._count.wishlistItems + 1) + Math.log2(game._count.followers + 1),
        reasons: [],
      }));
    }

    try {
      const wishlistDescriptions = wishlistGames.map((g) => g.description!);
      const candidateDescriptions = candidates.map((g) => g.description ?? g.title);

      const wishlistEmbeddings = await this.embedCached(wishlistDescriptions);
      const candidateEmbeddings = await this.embedCached(candidateDescriptions);

      return candidates.map((game, i) => {
        let score = 0;
        const reasons: string[] = [];

        for (let j = 0; j < wishlistEmbeddings.length; j++) {
          const similarity = this.cosineSimilarity(
            wishlistEmbeddings[j].embedding,
            candidateEmbeddings[i].embedding,
          );
          score += similarity * 10;

          if (similarity > 0.7 && reasons.length === 0) {
            reasons.push(`Semantically similar to ${wishlistGames[j].title}`);
          }
        }

        if (followedStudioIds.includes(game.studio.id)) {
          score += 5;
          reasons.push(`From ${game.studio.name} (you follow this studio)`);
        }

        score += Math.log2(game._count.wishlistItems + 1);
        score += Math.log2(game._count.followers + 1);

        return { ...game, score, reasons };
      });
    } catch (err) {
      this.logger.warn(`Embedding failed, falling back to tag-based scoring: ${(err as Error).message}`);
      return this.scoreByTags(wishlist, candidates, followedStudioIds);
    }
  }

  private scoreByTags(wishlist: { game: { title: string; tags?: GameTagName[] } | null }[], candidates: GameCandidate[], followedStudioIds: string[]): ScoredGame[] {
    const userGameTags = wishlist.flatMap((w) => w.game?.tags?.map((gt: GameTagName) => gt.tag.name) ?? []);

    return candidates.map((game) => {
      let score = 0;
      const reasons: string[] = [];
      const gameTagNames = game.tags.map((gt) => gt.tag.name);

      for (const wish of wishlist) {
        if (!wish.game) continue;
        const wishTagNames = wish.game.tags?.map((gt: GameTagName) => gt.tag.name) ?? [];
        const sharedTags = wishTagNames.filter((t) => gameTagNames.includes(t));
        if (sharedTags.length > 0) {
          score += sharedTags.length * 3;
          if (reasons.length === 0) reasons.push(`Similar tags to ${wish.game.title}`);
        }
      }

      if (followedStudioIds.includes(game.studio.id)) {
        score += 5;
        reasons.push(`From ${game.studio.name}`);
      }

      score += Math.log2(game._count.wishlistItems + 1);
      score += Math.log2(game._count.followers + 1);

      return { ...game, score, reasons };
    });
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
