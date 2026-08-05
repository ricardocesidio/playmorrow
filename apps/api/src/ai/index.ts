export { AIConfig } from './config/ai.config';
export { ProviderFactory } from './providers/provider.factory';
export { OpenAIProvider } from './providers/openai.provider';
export { AnthropicProvider } from './providers/anthropic.provider';
export { AIService } from './services/ai.service';

export { PgVectorStore } from './rag/vector-store.pgvector';
export { EmbeddingService } from './rag/embedding.service';
export { TextChunker } from './rag/chunker';
export type { TextChunk } from './rag/chunker';

export { PromptRegistry } from './prompts/prompt.registry';
export type { PromptTemplate } from './prompts/prompt.registry';
export { BUILT_IN_PROMPTS } from './prompts/built-in.prompts';

export { ConversationMemory } from './memory/conversation.memory';
export type { ConversationSession, ConversationMessage } from './memory/conversation.memory';

export { StreamService } from './streaming/stream.service';
export type { StreamCallbacks } from './streaming/stream.service';

export { AIMetricsService } from './observability/ai-metrics.service';
export type { ChatMetric, EmbeddingMetric, ModerationMetric } from './observability/ai-metrics.service';

export type {
  VectorDocument,
  VectorSearchOptions,
  VectorSearchResult,
  VectorStore,
} from './interfaces/vector-store.interface';

export type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  TokenUsage,
  AIProvider,
  ToolCall,
  ToolResult,
  ToolDefinition,
} from './interfaces/ai-provider.interface';

export type {
  EmbeddingOptions,
  EmbeddingResult,
  EmbeddingProvider,
} from './interfaces/embedding-provider.interface';

export type {
  ModerationResult,
  ModerationProvider,
} from './interfaces/moderation-provider.interface';
