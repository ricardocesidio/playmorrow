import { Injectable, Logger } from '@nestjs/common';
import { ProviderFactory } from '../providers/provider.factory';
import type { AIProvider, EmbeddingResult } from '../interfaces/ai-provider.interface';
import { AIConfig } from '../config/ai.config';
import { TextChunker } from './chunker';

export interface VectorDocument {
  id: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  sourceType: string;
  sourceId: string;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly chunker = new TextChunker({ maxTokens: 500, overlap: 0.1 });

  constructor(
    private readonly providerFactory: ProviderFactory,
    private readonly aiConfig: AIConfig,
  ) {}

  /**
   * The embedding model is configuration-driven (AI_EMBEDDING_MODEL), never
   * hardcoded by callers (AI Constitution Article 6 / Principle 8). The
   * provider receives the model explicitly so a provider swap or model change
   * is an env change, not a code change.
   */
  private embedOptions() {
    return { model: this.aiConfig.embeddingModel };
  }

  async embedText(text: string): Promise<EmbeddingResult> {
    const provider = this.providerFactory.getEmbeddingProvider();
    const results = await provider.embedTexts([text], this.embedOptions());
    return results[0];
  }

  async embedTexts(texts: string[]): Promise<EmbeddingResult[]> {
    const provider = this.providerFactory.getEmbeddingProvider();
    return provider.embedTexts(texts, this.embedOptions());
  }

  async embedDocument(doc: {
    id: string;
    content: string;
    metadata: Record<string, unknown>;
    sourceType: string;
    sourceId: string;
  }): Promise<VectorDocument[]> {
    const chunks = this.chunker.chunk(doc.content, {
      sourceType: doc.sourceType,
      sourceId: doc.sourceId,
    });
    const texts = chunks.map((c) => c.text);
    const embeddings = await this.embedTexts(texts);

    return chunks.map((chunk, i) => ({
      id: `${doc.id}-${i}`,
      content: chunk.text,
      embedding: embeddings[i]?.embedding,
      metadata: { ...doc.metadata, chunkIndex: i, totalChunks: chunks.length },
      sourceType: doc.sourceType,
      sourceId: doc.sourceId,
    }));
  }

  chunkText(text: string): { index: number; text: string; tokenCount: number }[] {
    return this.chunker.chunk(text).map((c) => ({
      index: c.index,
      text: c.text,
      tokenCount: c.tokenCount,
    }));
  }
}
