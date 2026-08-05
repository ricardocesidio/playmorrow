import type { EmbeddingResult } from './embedding-provider.interface';
import type { ModerationResult } from './moderation-provider.interface';

export { EmbeddingResult };
export { ModerationResult };

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ToolResult {
  toolCallId: string;
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  stream?: boolean;
  metadata?: Record<string, string>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ChatResponse {
  id: string;
  content: string;
  role: 'assistant';
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
  model: string;
  latencyMs: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatStreamChunk {
  content: string;
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  toolCalls?: Partial<ToolCall>[];
  usage?: TokenUsage;
}

export const AI_PROVIDER = 'AI_PROVIDER';

export interface AIProvider {
  readonly name: string;
  readonly models: string[];
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatStreamChunk>;
  embed(texts: string[], options?: Record<string, unknown>): Promise<EmbeddingResult[]>;
  embedText(text: string, options?: { model?: string; dimensions?: number }): Promise<EmbeddingResult>;
  embedTexts(texts: string[], options?: { model?: string; dimensions?: number }): Promise<EmbeddingResult[]>;
  moderate(text: string): Promise<ModerationResult>;
  isConfigured(): boolean;
}
