import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecommendationsService } from '../../recommendations/recommendations.service';
import { AIConfig } from '../config/ai.config';
import { EmbeddingService } from '../rag/embedding.service';
import { GameEmbeddingRepository } from './game-embedding.repository';
import { TasteSignalService, TasteSignals } from './taste-signal.service';

export type ForYouMethod = 'hybrid' | 'content' | 'trending' | 'legacy';

export type ReasonType =
  | 'semantic'
  | 'tag-affinity'
  | 'studio-follow'
  | 'popular'
  | 'trending'
  | 'hidden-gem'
  | 'fresh'
  | 'legacy';

export interface ForYouItem {
  gameId: string;
  score: number;
  reason: string;
  reasonType: ReasonType;
  sourceGameId?: string;
  title?: string;
  slug?: string;
  coverUrl?: string | null;
  studioName?: string;
}

export interface ForYouResult {
  items: ForYouItem[];
  nextCursor: { score: number; gameId: string } | null;
  hasMore: boolean;
  total: number;
  method: ForYouMethod;
  /**
   * Consent state for the session user: true/false when the M23 engine served
   * the request (in-bucket, authenticated), null for anonymous or out-of-bucket
   * sessions. The frontend uses `false` to invite the user to personalize.
   */
  personalizationEnabled: boolean | null;
}

interface CandidateDetail {
  id: string;
  title: string;
  studioId: string;
  studioName: string;
  updatedAt: Date;
  genreTokens: Set<string>;
  tagNames: string[];
  tagIds: string[];
  reasons: string[];
  baseScore: number;
  semanticScore: number;
  score: number;
}

const WEIGHT_BASE = 0.35;
const WEIGHT_TAG = 0.25;
const WEIGHT_SEMANTIC = 0.25;
const WEIGHT_FRESH = 0.05;
const WEIGHT_BEHAVIORAL = 0.10;

const SEMANTIC_CANDIDATE_LIMIT = 40;
const LEGACY_CANDIDATE_LIMIT = 100;
const DISMISSAL_WINDOW_DAYS = 30;
const VIEW_DEDUP_DAYS = 30;
const MMR_LAMBDA = 0.5;
const SIGNAL_EMBED_CAP = 8;

/**
 * M23 hybrid recommendation engine ("For You").
 *
 * Architecture (per AI_ARCHITECTURE.md):
 *   candidates = legacy 9-scorer pool (unchanged behavior) + pgvector
 *   semantic candidates from the user's taste vector
 *   final score  = 0.35 base + 0.25 tag affinity + 0.25 semantic + 0.05
 *                  freshness + 0.10 behavioral, followed by MMR diversity
 *                  re-ranking and a per-item explanation.
 *
 * Every path is fail-graceful (AI Constitution Article 8): embedding
 * failures degrade to content/trending, never to an error response.
 */
@Injectable()
export class HybridRecommenderService {
  private readonly logger = new Logger(HybridRecommenderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly legacy: RecommendationsService,
    private readonly tasteSignals: TasteSignalService,
    private readonly embeddingRepository: GameEmbeddingRepository,
    private readonly embeddingService: EmbeddingService,
    private readonly aiConfig: AIConfig,
  ) {}

  async getForYou(
    userId: string | null,
    limit = 20,
    cursor?: { score: number; gameId: string } | null,
  ): Promise<ForYouResult> {
    const cappedLimit = Math.max(1, Math.min(limit, 50));
    const inBucket = this.aiConfig.rolloutEnabled(userId ?? 'anonymous');

    if (!inBucket) {
      return this.legacyResult(userId, cappedLimit, cursor);
    }

    // Per-user consent (AI Constitution Art. 5 / Principle 3): personalization
    // requires the user to have opted in. Opted-out users get the deterministic
    // content path — no taste signals are gathered, nothing personal is read.
    const userPref = userId ? await this.getUserPreference(userId) : null;
    const personalizationOn =
      userId !== null && userPref?.personalizationEnabled === true && this.aiConfig.personalizationEnabled;

    const signals = personalizationOn ? await this.tasteSignals.gather(userId) : null;

    const [legacyResult, semanticHits, excludedIds] = await Promise.all([
      this.legacy.getRecommendations(userId, 'for-you', undefined, undefined, LEGACY_CANDIDATE_LIMIT),
      signals && this.aiConfig.semanticEnabled
        ? this.getSemanticCandidates(signals)
        : Promise.resolve([] as Array<{ gameId: string; score: number }>),
      userId ? this.getExcludedGameIds(userId) : Promise.resolve(new Set<string>()),
    ]);

    const legacyScores = new Map(legacyResult.items.map((i) => [i.gameId, i.score]));
    const legacyReasons = new Map(legacyResult.items.map((i) => [i.gameId, i.reasons]));
    const semanticByGame = new Map(semanticHits.map((h) => [h.gameId, h.score]));

    const candidateIds = [
      ...new Set([...legacyResult.items.map((i) => i.gameId), ...semanticByGame.keys()]),
    ].filter((id) => !excludedIds.has(id));

    if (candidateIds.length === 0) {
      return {
        items: [],
        nextCursor: null,
        hasMore: false,
        total: 0,
        method: this.inferMethod(signals, semanticByGame.size),
        personalizationEnabled: userId ? personalizationOn : null,
      };
    }

    const details = await this.fetchCandidateDetails(candidateIds);

    const scored = details
      .map((game) => this.hybridScore(game, signals, legacyScores.get(game.id) ?? 0, legacyReasons.get(game.id) ?? [], semanticByGame.get(game.id) ?? 0))
      .filter((g) => g.score > 0);

    const ranked = this.mmrRerank(scored, MMR_LAMBDA);
    const paged = this.pageByCursor(ranked, cappedLimit, cursor);

    const cardMap = await this.fetchCardDetails(paged.items.map((e) => e.id));

    const items = paged.items.map((entry) => {
      const explanation = this.explain(entry, signals);
      const card = cardMap.get(entry.id);
      return {
        gameId: entry.id,
        score: Math.round(entry.score * 100) / 100,
        reason: explanation.reason,
        reasonType: explanation.reasonType,
        ...(explanation.sourceGameId ? { sourceGameId: explanation.sourceGameId } : {}),
        ...(card ?? {}),
      };
    });

    return {
      items,
      nextCursor: paged.nextCursor,
      hasMore: paged.hasMore,
      total: ranked.length,
      method: this.inferMethod(signals, semanticByGame.size),
      personalizationEnabled: userId ? personalizationOn : null,
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // Candidates
  // ────────────────────────────────────────────────────────────────────────

  async getUserPreference(userId: string): Promise<{ personalizationEnabled: boolean } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { personalizationEnabled: true },
    });
  }

  /**
   * Persists personalization consent (AI Constitution Art. 5). Enabling
   * stamps `personalizationEnabledAt` (consent audit trail); disabling clears
   * it. The flag lives on the User row, so enforcement is server-side.
   */
  async setUserPreference(userId: string, enabled: boolean): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        personalizationEnabled: enabled,
        personalizationEnabledAt: enabled ? new Date() : null,
      },
    });
  }

  private async getSemanticCandidates(signals: TasteSignals): Promise<Array<{ gameId: string; score: number }>> {
    try {
      const texts = signals.signalGames
        .filter((g) => g.title && g.signal >= 0.8)
        .slice(0, SIGNAL_EMBED_CAP)
        .map((g) => g.title);

      if (texts.length === 0) return [];

      const embeddings = await this.embeddingService.embedTexts(texts);
      const tasteVector = this.averageVectors(embeddings.map((e) => e.embedding));
      if (!tasteVector) return [];

      // Dimension guard: a model/provider swap that changes the vector size
      // must fail loudly here (never query the DB with a mismatched vector).
      if (tasteVector.length !== this.aiConfig.embeddingDimensions) {
        this.logger.error(
          `Embedding dimension mismatch: got ${tasteVector.length}, configured ${this.aiConfig.embeddingDimensions}. ` +
            'Re-embed with AI_EMBEDDING_DIMENSIONS aligned to the DB column.',
        );
        return [];
      }

      return this.embeddingRepository.search(tasteVector, SEMANTIC_CANDIDATE_LIMIT, 0.15);
    } catch (err) {
      this.logger.warn(`Semantic candidate lookup degraded: ${(err as Error).message}`);
      return [];
    }
  }

  private async getExcludedGameIds(userId: string): Promise<Set<string>> {
    const [wishlist, follows, licenses, dismissals, recentViews] = await Promise.all([
      this.prisma.wishlistItem.findMany({ where: { userId }, select: { gameId: true } }),
      this.prisma.follow.findMany({ where: { userId, targetType: 'GAME' }, select: { gameId: true } }),
      this.prisma.purchasedLicense.findMany({
        where: { userId, active: true },
        select: { listing: { select: { gameId: true } } },
      }),
      this.prisma.recommendationFeedback.findMany({
        where: {
          userId,
          action: 'DISMISSED',
          createdAt: { gte: new Date(Date.now() - DISMISSAL_WINDOW_DAYS * 24 * 60 * 60 * 1000) },
        },
        select: { gameId: true },
      }),
      this.prisma.analyticsEvent.findMany({
        where: {
          userId,
          eventType: 'GAME_PAGE_VIEW',
          gameId: { not: null },
          timestamp: { gte: new Date(Date.now() - VIEW_DEDUP_DAYS * 24 * 60 * 60 * 1000) },
        },
        select: { gameId: true },
      }),
    ]);

    return new Set<string>([
      ...wishlist.map((w) => w.gameId),
      ...follows.map((f) => f.gameId!).filter((id): id is string => Boolean(id)),
      ...licenses.map((l) => l.listing.gameId).filter((id): id is string => Boolean(id)),
      ...dismissals.map((d) => d.gameId),
      ...recentViews.map((v) => v.gameId!).filter((id): id is string => Boolean(id)),
    ]);
  }

  private async fetchCandidateDetails(gameIds: string[]): Promise<CandidateDetail[]> {
    const games = await this.prisma.game.findMany({
      where: { id: { in: gameIds }, isPublished: true },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        title: true,
        genres: true,
        updatedAt: true,
        studio: { select: { id: true, name: true } },
        tags: {
          select: {
            tagId: true,
            tag: { select: { name: true, kind: true } },
          },
        },
      },
    });

    return games.map((g) => ({
      id: g.id,
      title: g.title,
      studioId: g.studio.id,
      studioName: g.studio.name,
      updatedAt: g.updatedAt,
      genreTokens: this.genreTokens(g.genres),
      tagNames: g.tags.map((t) => t.tag.name),
      tagIds: g.tags.map((t) => t.tagId),
      reasons: [],
      baseScore: 0,
      semanticScore: 0,
      score: 0,
    }));
  }

  // ────────────────────────────────────────────────────────────────────────
  // Scoring
  // ────────────────────────────────────────────────────────────────────────

  private hybridScore(
    game: CandidateDetail,
    signals: TasteSignals | null,
    baseScore: number,
    legacyReasons: string[],
    semanticScore: number,
  ): CandidateDetail {
    let total = 0;

    const normalizedBase = Math.min(1, baseScore / 100);
    total += normalizedBase * WEIGHT_BASE;

    const tagSimilarity = signals ? this.tagSimilarity(game, signals.tagAffinity) : 0;
    total += tagSimilarity * WEIGHT_TAG;

    total += semanticScore * WEIGHT_SEMANTIC;

    const fresh = this.freshnessScore(game.updatedAt);
    total += fresh * WEIGHT_FRESH;

    const behavioral = legacyReasons.some((r) => r.includes('activity') || r.includes('followed by'))
      ? 1
      : 0;
    total += behavioral * WEIGHT_BEHAVIORAL;

    if (legacyReasons.some((r) => r.includes('Hidden gem'))) {
      total *= 1.1;
    }

    return {
      ...game,
      baseScore: normalizedBase,
      semanticScore,
      reasons: legacyReasons,
      score: total,
    };
  }

  private tagSimilarity(game: CandidateDetail, affinity: Map<string, number>): number {
    if (affinity.size === 0 || game.tagIds.length === 0) return 0;
    let matched = 0;
    for (const tagId of game.tagIds) {
      if (affinity.has(tagId)) matched += 1;
    }
    return matched / Math.max(1, affinity.size) * Math.min(1, (game.tagIds.length / 3));
  }

  private freshnessScore(updatedAt: Date): number {
    const days = Math.max(0, (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7) return 1;
    if (days <= 30) return 0.6;
    if (days <= 90) return 0.3;
    return 0.1;
  }

  private genreTokens(genres: string | null): Set<string> {
    const tokens = new Set<string>();
    if (!genres) return tokens;
    for (const token of genres.split(',')) {
      const t = token.trim().toLowerCase();
      if (t) tokens.add(t);
    }
    return tokens;
  }

  // ────────────────────────────────────────────────────────────────────────
  // MMR re-ranking (diversity)
  // ────────────────────────────────────────────────────────────────────────

  private mmrRerank(scored: CandidateDetail[], lambda: number): CandidateDetail[] {
    const remaining = [...scored];
    const selected: CandidateDetail[] = [];

    while (remaining.length > 0 && selected.length < 50) {
      let bestIdx = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const diversityPenalty = selected.reduce(
          (max, s) => Math.max(max, this.genreSimilarity(candidate, s)),
          0,
        );
        const mmrScore = lambda * candidate.score - (1 - lambda) * diversityPenalty;
        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIdx = i;
        }
      }

      selected.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    }

    return selected;
  }

  private genreSimilarity(a: CandidateDetail, b: CandidateDetail): number {
    if (a.genreTokens.size === 0 || b.genreTokens.size === 0) return 0;
    let overlap = 0;
    for (const token of a.genreTokens) {
      if (b.genreTokens.has(token)) overlap += 1;
    }
    return overlap / Math.max(a.genreTokens.size, b.genreTokens.size);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Pagination + explanations
  // ────────────────────────────────────────────────────────────────────────

  private pageByCursor(
    ranked: CandidateDetail[],
    limit: number,
    cursor?: { score: number; gameId: string } | null,
  ): { items: CandidateDetail[]; nextCursor: { score: number; gameId: string } | null; hasMore: boolean } {
    // Deterministic pagination: ranking input is ordered by gameId and MMR
    // output is stable, so the cursor is a position in the ranked list —
    // no score comparison, no skipped/duplicated items across pages.
    let startIdx = 0;
    if (cursor) {
      const idx = ranked.findIndex((g) => g.id === cursor.gameId);
      if (idx !== -1) startIdx = idx + 1;
    }

    const page = ranked.slice(startIdx, startIdx + limit);
    const hasMore = ranked.length > startIdx + limit;
    const last = page[page.length - 1];
    return {
      items: page,
      nextCursor: hasMore && last
        ? { score: Math.round(last.score * 100) / 100, gameId: last.id }
        : null,
      hasMore,
    };
  }

  private explain(
    entry: CandidateDetail,
    signals: TasteSignals | null,
  ): { reason: string; reasonType: ReasonType; sourceGameId?: string } {
    if (entry.semanticScore >= 0.45 && signals) {
      const source = this.closestSignalGame(entry, signals);
      if (source) {
        return {
          reason: `Because you're into ${source.title}`,
          reasonType: 'semantic',
          sourceGameId: source.gameId,
        };
      }
    }

    if (signals && entry.tagIds.some((id) => signals.tagAffinity.has(id))) {
      const topTagId = entry.tagIds.find((id) => signals.tagAffinity.has(id));
      const source = signals.signalGames.find((g) => g.signal >= 0.8);
      if (topTagId && source) {
        return {
          reason: `More like ${source.title}`,
          reasonType: 'tag-affinity',
          sourceGameId: source.gameId,
        };
      }
    }

    if (signals && signals.followedStudioIds.includes(entry.studioId)) {
      return {
        reason: `From ${entry.studioName}, a studio you follow`,
        reasonType: 'studio-follow',
      };
    }

    const reason = entry.reasons.find((r) => !r.includes('activity'));
    if (reason) {
      const type = this.reasonLabelToType(reason);
      return { reason, reasonType: type };
    }

    // Truthful last resort — never claims popularity or affinity we cannot
    // back up (AI Constitution Art. 3 / Principle 2). The game IS in the feed,
    // so "Recommended for you" is always factually correct.
    return { reason: 'Recommended for you', reasonType: 'popular' };
  }

  private closestSignalGame(entry: CandidateDetail, signals: TasteSignals) {
    const matches = signals.signalGames.filter((g) => g.signal >= 0.8);
    return matches.find((g) => g.gameId !== entry.id && g.title) ?? matches[0];
  }

  private reasonLabelToType(reason: string): ReasonType {
    if (reason.includes('Hidden gem')) return 'hidden-gem';
    if (reason.includes('Trending')) return 'trending';
    if (reason.includes('Recently updated')) return 'fresh';
    if (reason.includes('Latest release')) return 'fresh';
    return 'popular';
  }

  private inferMethod(signals: TasteSignals | null, semanticHitCount: number): ForYouMethod {
    if (signals && semanticHitCount > 0) return 'hybrid';
    if (signals && this.tasteSignals.hasSignals(signals)) return 'content';
    return 'trending';
  }

  // ────────────────────────────────────────────────────────────────────────
  // Fallback to the legacy engine (feature flag off)
  // ────────────────────────────────────────────────────────────────────────

  private async fetchCardDetails(gameIds: string[]): Promise<Map<string, Pick<ForYouItem, 'title' | 'slug' | 'coverUrl' | 'studioName'>>> {
    if (gameIds.length === 0) return new Map();
    const games = await this.prisma.game.findMany({
      where: { id: { in: gameIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        studio: { select: { name: true } },
      },
    });
    return new Map(
      games.map((g) => [g.id, { title: g.title, slug: g.slug, coverUrl: g.coverUrl, studioName: g.studio.name }]),
    );
  }

  private async legacyResult(
    userId: string | null,
    limit: number,
    cursor?: { score: number; gameId: string } | null,
  ): Promise<ForYouResult> {
    const result = await this.legacy.getRecommendations(userId, 'for-you', undefined, undefined, limit, cursor);
    const cardMap = await this.fetchCardDetails(result.items.map((i) => i.gameId));
    return {
      items: result.items.map((i) => {
        const card = cardMap.get(i.gameId) ?? {};
        return {
          gameId: i.gameId,
          score: i.score,
          reason: i.reasons[0] ?? 'Popular on Playmorrow',
          reasonType: 'legacy' as ReasonType,
          ...card,
        };
      }),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      total: result.total,
      method: 'legacy',
      personalizationEnabled: null,
    };
  }

  private averageVectors(vectors: number[][]): number[] | null {
    const valid = vectors.filter((v) => v && v.length > 0);
    if (valid.length === 0) return null;
    const dim = valid[0].length;
    const sum = new Array(dim).fill(0);
    for (const v of valid) {
      for (let i = 0; i < dim; i++) sum[i] += v[i];
    }
    const magnitude = Math.sqrt(sum.reduce((acc, x) => acc + x * x, 0));
    if (magnitude === 0) return null;
    return sum.map((x) => x / magnitude);
  }
}
