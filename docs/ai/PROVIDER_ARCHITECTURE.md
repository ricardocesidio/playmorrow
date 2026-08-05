# AI Foundation — Provider Architecture

**Date:** 2026-08-05

---

## Design Principle

The AI module follows the **Dependency Inversion Principle**. Application code depends on abstractions (`AIProvider`, `EmbeddingProvider`), not concretions (`OpenAIProvider`, `AnthropicProvider`). Providers are swapped via environment variables without changing application code.

---

## Provider Registry

```
AI_PROVIDER env var → ProviderFactory.getProvider() → AIProvider
                              ↓
              OpenAIProvider | AnthropicProvider | GeminiProvider | ...
```

## Interfaces

```typescript
interface AIProvider {
  readonly name: string;
  readonly models: string[];
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatStreamChunk>;
}

interface EmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;
  embedText(text: string): Promise<EmbeddingResult>;
  embedTexts(texts: string[]): Promise<EmbeddingResult[]>;
}

interface ModerationProvider {
  readonly name: string;
  moderate(text: string): Promise<ModerationResult>;
}
```

## Adding a New Provider

1. Create `google-gemini.provider.ts` implementing `AIProvider`
2. Register in `ProviderFactory.constructor()`
3. Set `AI_PROVIDER=gemini` + `GEMINI_API_KEY` env vars

**No other files change.**

## Rate Limiting + Retry

All providers implement exponential backoff with 3 retries:

```typescript
private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < this.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (this.isRateLimit(err) && attempt < this.maxRetries - 1) {
        await this.delay(Math.pow(2, attempt) * 1000);
        continue;
      }
      throw err;
    }
  }
}
```
