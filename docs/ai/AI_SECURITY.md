# AI Security Policy

**Date:** 2026-08-05

---

## API Key Protection

- All API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) accessed ONLY via `ConfigService`
- Never hardcoded, never logged, never returned in API responses
- Provider constructors gracefully handle missing keys (return null, not throw)
- `ProviderFactory.getProvider()` throws `BadRequestException` if no provider configured

## Authentication

- All AI endpoints use `@UseGuards(SessionAuthGuard)`
- Unauthenticated requests receive 401
- User ID attached to all AI calls for audit + cost tracking

## Rate Limiting

- AI endpoints: `@Throttle({ default: { limit: 10, ttl: 60000 } })` — 10 req/min
- Cost limit: `AI_COST_LIMIT_DAILY` env var (default $50/day)
- Provider-level retry with exponential backoff prevents DDOS on upstream APIs

## Content Safety

- All AI outputs pass through `ModerationProvider.moderate()`
- Flagged content returns `ModerationResult.flagged=true`
- Caller decides whether to block, warn, or allow

## Prompt Injection Prevention

- All user input validated via class-validator DTOs
- System prompts are immutable (registered in PromptRegistry)
- User messages cannot override system instructions

## GDPR Compliance

- `ConversationMemory.deleteUserMemory(userId)` — deletes all conversations
- User can request conversation history via `conversation.memory.getMessages(sessionId)`
- No PII in embedding context (game descriptions, devlogs, public content only)

## Audit Trail

All AI calls logged with:
```
userId | provider | model | promptTokens | completionTokens | latencyMs | cost | success
```

## Data Privacy

- AI context uses public platform data only (game descriptions, tags, reviews)
- Never: payment data, private messages, email addresses, passwords
- Embeddings generated from public content — no user PII in vector store
