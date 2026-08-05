export interface TextChunk {
  index: number;
  text: string;
  metadata?: Record<string, unknown>;
  tokenCount: number;
}

export class TextChunker {
  constructor(private readonly options: { maxTokens: number; overlap: number }) {}

  chunk(text: string, metadata?: Record<string, unknown>): TextChunk[] {
    if (!text || text.trim().length === 0) return [];

    const words = text.split(/\s+/);
    const chunks: TextChunk[] = [];
    let current: string[] = [];
    let chunkIndex = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const candidate = [...current, word];
      const candidateText = candidate.join(' ');
      const candidateTokens = this.estimateTokens(candidateText);

      if (candidateTokens > this.options.maxTokens && current.length > 0) {
        chunks.push({
          index: chunkIndex++,
          text: current.join(' '),
          metadata,
          tokenCount: this.estimateTokens(current.join(' ')),
        });

        const overlapCount = Math.max(1, Math.floor(current.length * this.options.overlap));
        current = current.slice(-overlapCount);
        current.push(word);
      } else {
        current.push(word);
      }
    }

    if (current.length > 0) {
      chunks.push({
        index: chunkIndex,
        text: current.join(' '),
        metadata,
        tokenCount: this.estimateTokens(current.join(' ')),
      });
    }

    return chunks;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
