export interface VectorDocument {
  id: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, string | number | boolean | null>;
  sourceType?: string;
  sourceId?: string;
  createdAt?: Date;
}

export interface VectorSearchResult {
  document: VectorDocument;
  score: number;
}

export interface VectorSearchOptions {
  topK?: number;
  minScore?: number;
  filter?: Record<string, string | number | boolean>;
}

export interface VectorStore {
  readonly name: string;
  addDocument(doc: VectorDocument): Promise<void>;
  addDocuments(docs: VectorDocument[]): Promise<void>;
  search(
    query: string | number[],
    options?: VectorSearchOptions,
  ): Promise<VectorSearchResult[]>;
  delete(id: string): Promise<void>;
  deleteBySource(sourceType: string, sourceId: string): Promise<void>;
}
