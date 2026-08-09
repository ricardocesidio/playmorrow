import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBus, PlaymorrowEvent } from '../../common/event-bus';
import { AIConfig } from '../config/ai.config';
import { EmbeddingService } from '../rag/embedding.service';
import { AIMetricsService } from '../observability/ai-metrics.service';
import { GameEmbeddingRepository } from './game-embedding.repository';

export interface RefreshResult {
  embedded: number;
  skipped: number;
  deleted: number;
  disabled: boolean;
}

const EMBEDDING_VERSION = 1;
const MAX_DESCRIPTION_CHARS = 1200;

/**
 * Keeps `game_embeddings` fresh for the M23 semantic path.
 *
 * - Nightly at 03:00 UTC (fail-gracefully: a failed run keeps the last good
 *   embeddings — Article 8 of the AI Constitution).
 * - Event-driven refresh on `game_published` so brand-new games are
 *   searchable within seconds.
 * - Deletes embeddings for games that are no longer published.
 */
@Injectable()
export class GameEmbeddingRefreshService implements OnModuleInit {
  private readonly logger = new Logger(GameEmbeddingRefreshService.name);
  private refreshing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingRepository: GameEmbeddingRepository,
    private readonly embeddingService: EmbeddingService,
    private readonly aiConfig: AIConfig,
    private readonly metrics: AIMetricsService,
    private readonly eventBus: EventBus,
  ) {}

  onModuleInit(): void {
    this.eventBus.on('game_published', (event: PlaymorrowEvent) => {
      if (event.gameId) {
        void this.refreshGame(event.gameId).catch((err) =>
          this.logger.warn(`Event-driven embedding refresh failed: ${(err as Error).message}`),
        );
      }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async refresh(): Promise<RefreshResult> {
    if (this.refreshing) {
      return { embedded: 0, skipped: 0, deleted: 0, disabled: false };
    }

    if (!this.aiConfig.embeddingsEnabled) {
      this.logger.log('Embedding refresh disabled (feature flag)');
      return { embedded: 0, skipped: 0, deleted: 0, disabled: true };
    }

    this.refreshing = true;
    try {
      const [games, existing] = await Promise.all([
        this.prisma.game.findMany({
          where: { isPublished: true },
          select: { id: true, title: true, tagline: true, description: true, updatedAt: true },
        }),
        this.embeddingRepository.findAll(),
      ]);

      const existingByGame = new Map(existing.map((e) => [e.gameId, e]));
      const publishedIds = games.map((g) => g.id);
      const deleted = await this.embeddingRepository.deleteOrphans(publishedIds);

      let embedded = 0;
      let skipped = 0;

      const toEmbed = games.filter((g) => {
        const current = existingByGame.get(g.id);
        if (!current) return true;
        return current.version < EMBEDDING_VERSION || current.updatedAt < g.updatedAt;
      });

      // Batches of 10 to bound memory and provider calls.
      for (let i = 0; i < toEmbed.length; i += 10) {
        const batch = toEmbed.slice(i, i + 10);
        try {
          const texts = batch.map((g) => this.buildContentText(g));
          const started = Date.now();
          const results = await this.embeddingService.embedTexts(texts);
          for (let j = 0; j < batch.length; j++) {
            const embedding = results[j]?.embedding;
            if (!embedding) continue;
            await this.embeddingRepository.upsert(batch[j].id, embedding, this.aiConfig.embeddingModel, EMBEDDING_VERSION);
            embedded += 1;
          }
          this.metrics.recordEmbedding({
            provider: this.aiConfig.defaultProvider,
            model: this.aiConfig.embeddingModel,
            tokens: results.reduce((acc, r) => acc + (r.tokens ?? 0), 0),
            textCount: batch.length,
            latencyMs: Date.now() - started,
            success: true,
            timestamp: new Date(),
          });
        } catch (err) {
          this.logger.error(`Embedding batch failed (${batch.length} games, kept last good): ${(err as Error).message}`);
        }
      }

      skipped = toEmbed.length - embedded;
      this.logger.log(`Embedding refresh: ${embedded} embedded, ${skipped} skipped, ${deleted} deleted`);
      return { embedded, skipped, deleted, disabled: false };
    } finally {
      this.refreshing = false;
    }
  }

  async refreshGame(gameId: string): Promise<boolean> {
    if (!this.aiConfig.embeddingsEnabled) return false;

    const game = await this.prisma.game.findFirst({
      where: { id: gameId, isPublished: true },
      select: { id: true, title: true, tagline: true, description: true },
    });
    if (!game) {
      await this.embeddingRepository.deleteByGameId(gameId);
      return false;
    }

    const result = await this.embeddingService.embedText(this.buildContentText(game));
    if (!result?.embedding) return false;
    await this.embeddingRepository.upsert(game.id, result.embedding, this.aiConfig.embeddingModel, EMBEDDING_VERSION);
    return true;
  }

  private buildContentText(game: {
    title: string;
    tagline: string | null;
    description: string | null;
  }): string {
    return [
      game.title,
      game.tagline,
      (game.description ?? '').slice(0, MAX_DESCRIPTION_CHARS),
    ].filter(Boolean).join('\n').slice(0, 4000);
  }
}
