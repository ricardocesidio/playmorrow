import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  VectorDocument,
  VectorSearchOptions,
  VectorSearchResult,
  VectorStore,
} from '../interfaces/vector-store.interface';
import type { EmbeddingResult } from '../interfaces/embedding-provider.interface';

@Injectable()
export class PgVectorStore implements VectorStore {
  readonly name = 'pgvector';
  private embedFn?: (text: string) => Promise<EmbeddingResult>;

  constructor(
    private prisma: PrismaService,
  ) {}

  setEmbedFunction(fn: (text: string) => Promise<EmbeddingResult>): void {
    this.embedFn = fn;
  }

  async addDocument(doc: VectorDocument): Promise<void> {
    const embedding = doc.embedding ?? (this.embedFn ? (await this.embedFn(doc.content)).embedding : null);
    if (!embedding) {
      throw new Error('No embedding available for document');
    }

    const vectorLiteral = `[${embedding.join(',')}]`;
    const metadataObj = {
      ...doc.metadata,
      ...(doc.sourceType ? { sourceType: doc.sourceType } : {}),
      ...(doc.sourceId ? { sourceId: doc.sourceId } : {}),
    };

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "ai_documents" (id, content, metadata, embedding, source_type, source_id, created_at)
       VALUES ($1, $2, $3::jsonb, $4::vector, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE SET content = $2, metadata = $3::jsonb, embedding = $4::vector, source_type = $5, source_id = $6, updated_at = NOW()`,
      doc.id,
      doc.content,
      JSON.stringify(metadataObj),
      vectorLiteral,
      doc.sourceType ?? null,
      doc.sourceId ?? null,
    );
  }

  async addDocuments(docs: VectorDocument[]): Promise<void> {
    if (docs.length === 0) return;

    if (!this.embedFn) {
      const unembeddedCount = docs.filter((d) => !d.embedding).length;
      if (unembeddedCount > 0) {
        throw new Error(
          `${unembeddedCount} documents without embedding and no embed function configured`,
        );
      }
    }

    const statements = docs.map((doc) => {
      const embedding = doc.embedding ?? [];
      const vectorLiteral = `[${embedding.join(',')}]`;
      const metadataObj = {
        ...doc.metadata,
        ...(doc.sourceType ? { sourceType: doc.sourceType } : {}),
        ...(doc.sourceId ? { sourceId: doc.sourceId } : {}),
      };

      return this.prisma.$executeRawUnsafe(
        `INSERT INTO "ai_documents" (id, content, metadata, embedding, source_type, source_id, created_at)
         VALUES ($1, $2, $3::jsonb, $4::vector, $5, $6, NOW())
         ON CONFLICT (id) DO UPDATE SET content = $2, metadata = $3::jsonb, embedding = $4::vector, source_type = $5, source_id = $6, updated_at = NOW()`,
        doc.id,
        doc.content,
        JSON.stringify(metadataObj),
        vectorLiteral,
        doc.sourceType ?? null,
        doc.sourceId ?? null,
      );
    });

    await this.prisma.$transaction(statements);
  }

  async search(
    query: string | number[],
    options?: VectorSearchOptions,
  ): Promise<VectorSearchResult[]> {
    const topK = options?.topK ?? 5;
    const minScore = options?.minScore;

    let embedding: number[];

    if (Array.isArray(query)) {
      embedding = query;
    } else {
      if (!this.embedFn) {
        throw new Error('No embed function configured for text search');
      }
      const result = await this.embedFn(query);
      embedding = result.embedding;
    }

    const vectorLiteral = `[${embedding.join(',')}]`;

    let sql: string;
    let params: unknown[];

    if (options?.filter) {
      const filterConditions = Object.entries(options.filter)
        .map(
          ([key], idx) =>
            `AND metadata->>'${key}' = $${idx + 3}`,
        )
        .join(' ');
      const filterValues = Object.values(options.filter);

      sql = `
        SELECT id, content, metadata,
               1 - (embedding <=> $1::vector) AS score
        FROM "ai_documents"
        WHERE embedding IS NOT NULL ${filterConditions}
        ORDER BY score DESC
        LIMIT $2
      `;
      params = [vectorLiteral, topK, ...filterValues];
    } else {
      sql = `
        SELECT id, content, metadata,
               1 - (embedding <=> $1::vector) AS score
        FROM "ai_documents"
        WHERE embedding IS NOT NULL
        ORDER BY score DESC
        LIMIT $2
      `;
      params = [vectorLiteral, topK];
    }

    const rows = (await this.prisma.$queryRawUnsafe(sql, ...params)) as {
      id: string;
      content: string;
      metadata: Record<string, string | number | boolean | null>;
      score: number;
    }[];

    return rows
      .filter((r) => minScore === undefined || Number(r.score) >= minScore)
      .map((r) => ({
        document: {
          id: r.id,
          content: r.content,
          metadata: r.metadata,
        },
        score: Number(r.score),
      }));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM "ai_documents" WHERE id = $1`,
      id,
    );
  }

  async deleteBySource(sourceType: string, sourceId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM "ai_documents" WHERE source_type = $1 AND source_id = $2`,
      sourceType,
      sourceId,
    );
  }
}
