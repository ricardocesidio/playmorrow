export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
}

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  model: string;
}

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;
  embedText(text: string, options?: EmbeddingOptions): Promise<EmbeddingResult>;
  embedTexts(
    texts: string[],
    options?: EmbeddingOptions,
  ): Promise<EmbeddingResult[]>;
}
