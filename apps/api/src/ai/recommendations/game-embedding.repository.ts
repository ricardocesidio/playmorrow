import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface GameEmbeddingRow {
  id: string;
  gameId: string;
  embedding: number[];
  model: string;
  dimensions: number;
  version: number;
  updatedAt: Date;
}

export interface EmbeddingSearchHit {
  gameId: string;
  score: number;
}

/**
 * Raw-SQL repository for the `game_embeddings` table (pgvector).
 * The vector column is not representable in schema.prisma, so all access is
 * via parameterized raw SQL — mirroring the existing `ai_documents` pattern.
 * Game content only is stored here; no user data ever enters this table
 * (AI Constitution Article 5).
 */
@Injectable()
export class GameEmbeddingRepository {
  private readonly logger = new Logger(GameEmbeddingRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsert(gameId: string, embedding: number[], model: string, version: number): Promise<void> {
    const id = this.embeddingId(gameId);
    const vector = `[${embedding.join(',')}]`;
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "game_embeddings" ("id", "game_id", "embedding", "model", "dimensions", "version", "created_at", "updated_at")
       VALUES ($1, $2, $3::vector, $4, $5, $6, now(), now())
       ON CONFLICT ("game_id") DO UPDATE SET
         "embedding" = EXCLUDED."embedding",
         "model" = EXCLUDED."model",
         "dimensions" = EXCLUDED."dimensions",
         "version" = EXCLUDED."version",
         "updated_at" = now()`,
      id,
      gameId,
      vector,
      model,
      embedding.length,
      version,
    );
  }

  async findByGameId(gameId: string): Promise<GameEmbeddingRow | null> {
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT "id", "game_id"::text AS "gameId", "embedding"::text AS "embedding",
              "model", "dimensions", "version", "updated_at" AS "updatedAt"
       FROM "game_embeddings" WHERE "game_id" = $1 LIMIT 1`,
      gameId,
    );
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async findAll(): Promise<Array<{ gameId: string; embedding: number[]; updatedAt: Date; version: number; dimensions: number; model: string }>> {
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT "game_id"::text AS "gameId", "embedding"::text AS "embedding",
              "version", "dimensions", "model", "updated_at" AS "updatedAt"
       FROM "game_embeddings"`,
    );
    return rows.map((r) => ({
      gameId: String(r.gameId),
      embedding: this.parseVector(String(r.embedding)),
      version: Number(r.version),
      dimensions: Number(r.dimensions),
      model: String(r.model),
      updatedAt: new Date(String(r.updatedAt)),
    }));
  }

  /**
   * Cosine similarity search over the HNSW index. Returns gameIds ordered by
   * descending similarity with scores in [0,1].
   */
  async search(query: number[], topK: number, minScore = 0): Promise<EmbeddingSearchHit[]> {
    const vector = `[${query.join(',')}]`;
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT "game_id"::text AS "gameId",
              (1 - ("embedding" <=> $1::vector))::double precision AS "score"
       FROM "game_embeddings"
       ORDER BY "embedding" <=> $1::vector ASC
       LIMIT $2`,
      vector,
      topK,
    );
    return rows
      .map((r) => ({ gameId: String(r.gameId), score: Number(r.score) }))
      .filter((r) => r.score >= minScore);
  }

  async count(): Promise<number> {
    const rows = await this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT count(*)::int AS "count" FROM "game_embeddings"`,
    );
    return Number(rows[0]?.count ?? 0);
  }

  async deleteByGameId(gameId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM "game_embeddings" WHERE "game_id" = $1`,
      gameId,
    );
  }

  /** Removes embeddings for games that are no longer published. */
  async deleteOrphans(publishedGameIds: string[]): Promise<number> {
    const result = await this.prisma.$executeRawUnsafe(
      `DELETE FROM "game_embeddings"
       WHERE "game_id" <> ALL($1::text[])
       RETURNING "game_id"`,
      publishedGameIds,
    );
    if (result) this.logger.log(`Deleted ${result} stale game embeddings`);
    return result;
  }

  private embeddingId(gameId: string): string {
    return `game_${gameId}`;
  }

  private mapRow(row: Record<string, unknown>): GameEmbeddingRow {
    return {
      id: String(row.id),
      gameId: String(row.gameId),
      embedding: this.parseVector(String(row.embedding)),
      model: String(row.model),
      dimensions: Number(row.dimensions),
      version: Number(row.version),
      updatedAt: new Date(String(row.updatedAt)),
    };
  }

  private parseVector(v: string): number[] {
    const trimmed = v.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return trimmed.slice(1, -1).split(',').filter(Boolean).map(Number);
    }
    return trimmed.split(',').filter(Boolean).map(Number);
  }
}
