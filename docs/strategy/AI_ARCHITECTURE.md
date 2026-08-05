# AI Architecture — Phase 6 Technical Design

**Date:** 2026-08-05  
**Status:** Planning  
**Applies to:** Phase 6 milestones M22-M26  

---

## 1. Current Architecture Compatibility

### 1.1 Modules Reusable for AI

The Phase 5 codebase contains 55 NestJS modules. The following are directly reusable or extendable for Phase 6:

| Module | Path | AI Use |
|--------|------|--------|
| **EventBusModule** | `apps/api/src/common/event-bus.module.ts` | All AI pipelines subscribe to `GAME_PUBLISHED`, `GAME_UPDATED`, `CONTENT_CREATED`, `DEVLOG_PUBLISHED`, etc. Used by M22 context assembly, M23 feature updates, M24 moderation triggers, M25 insight refresh, M26 embedding refresh |
| **SearchModule** | `apps/api/src/search/search.module.ts` | Extended for semantic search (M26). Current keyword search becomes hybrid fallback |
| **RecommendationsModule** | `apps/api/src/recommendations/recommendations.module.ts` | 8 static scorers become A/B test baseline; module restructured for M23 ML pipeline |
| **NotificationsModule** | `apps/api/src/notifications/notifications.module.ts` | AI-generated notification content: "A game like [your wishlisted game] was just announced" (M22/M26) |
| **FeedModule** | `apps/api/src/feed/feed.module.ts` | AI-curated feed ranking: `FeedEngineService` extended with ML relevance scores (M23) |
| **AnalyticsModule** | `apps/api/src/analytics/analytics.module.ts` | All AI metrics flow through `AnalyticsEvent` + `AnalyticsDailyAggregate` tables. M25 directly consumes analytics data |
| **ModerationModule** | `apps/api/src/moderation/moderation.module.ts` | `SpamDetectionService` replaced by ML classifier; `EscalationService` extended with AI triage (M24) |
| **PrismaModule** | `apps/api/src/prisma/prisma.module.ts` | Single PrismaClient instance — all AI services access it; pgvector columns added via migration |
| **AuthModule** | `apps/api/src/auth/auth.module.ts` | `OptionalSessionGuard` already attached globally — AI endpoints reuse existing auth; `@Throttle()` for 10 req/min on AI endpoints |
| **UsersModule** | `apps/api/src/users/users.module.ts` | User preference vectors for recommendations; user content for moderation history |
| **GamesModule** | `apps/api/src/games/games.module.ts` | Game content source for embeddings, descriptions, tags |
| **StudiosModule** | `apps/api/src/studios/studios.module.ts` | Studio analytics source for M25 insights |
| **DevlogsModule** | `apps/api/src/devlogs/devlogs.module.ts` | Devlog content for assistant context, embedding source |
| **CommentsModule** | `apps/api/src/comments/comments.module.ts` | Comment content for sentiment analysis, moderation |
| **FollowsModule** | `apps/api/src/follows/follows.module.ts` | Follow graph for collaborative filtering |
| **WishlistModule** | `apps/api/src/wishlist/wishlist.module.ts` | Wishlist data for collaborative filtering (strong signal) |
| **ReactionsModule** | `apps/api/src/reactions/reactions.module.ts` | Reaction data for interaction matrix |
| **UploadModule** | `apps/api/src/upload/upload.module.ts` | No direct AI use, but upload validation runs before AI processing |
| **ReportsModule** | `apps/api/src/reports/reports.module.ts` | Existing ModerationReports become training data for M24 |

### 1.2 EventBus Integration

The existing EventBus (`apps/api/src/common/event-bus.ts`) is a simple in-process event emitter:

```typescript
// apps/api/src/common/event-bus.ts (current)
export type PlaymorrowEvent = {
  type: string;
  actorId?: string;
  targetId?: string;
  targetType?: string;
  studioId?: string;
  gameId?: string;
  metadata?: Record<string, unknown>;
};
```

Phase 6 adds AI subscribers for the following events:

```typescript
// apps/api/src/ai/ai-event-subscribers.ts (new, Phase 6)

@Injectable()
export class AiEventSubscribers implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly embeddingService: EmbeddingService,
    private readonly moderationPipeline: ModerationPipeline,
  ) {}

  onModuleInit() {
    // M26: Regenerate embedding when game content changes
    this.eventBus.on('GAME_PUBLISHED', (e) => {
      this.embeddingService.generateGameEmbedding(e.gameId!);
    });
    this.eventBus.on('GAME_UPDATED', (e) => {
      this.embeddingService.generateGameEmbedding(e.gameId!);
    });

    // M24: Run moderation on new content
    this.eventBus.on('CONTENT_CREATED', (e) => {
      void this.moderationPipeline.classify(e);
    });

    // M23: Update recommendation features on interaction
    this.eventBus.on('FOLLOW_CREATED', (e) => {
      void this.embeddingService.updateUserVector(e.actorId!);
    });
    this.eventBus.on('WISHLIST_ADDED', (e) => {
      void this.embeddingService.updateUserVector(e.actorId!);
    });

    // M25: Refresh studio insights on data change
    this.eventBus.on('DEVLOG_PUBLISHED', (e) => {
      void this.embeddingService.scheduleInsightRefresh(e.studioId!);
    });
  }
}
```

### 1.3 Prisma Models Providing Training Data

All Phase 6 features use existing models — no schema changes to existing tables:

| Feature | Source Models |
|---------|---------------|
| User embeddings (M23) | `User`, `Follow`, `WishlistItem`, `Reaction`, `Comment`, `GameView`, `DevlogLike` |
| Game embeddings (M22, M23, M26) | `Game` (title, description, tagline, genres, modes), `GameTag`, `Tag`, `Comment`, `Devlog` |
| Moderation training (M24) | `ModerationReport` (labeled data), `Comment`, `Devlog` |
| Studio analytics (M25) | `AnalyticsEvent`, `AnalyticsDailyAggregate`, `StudioWeeklyReport`, `StudioHealthScore`, `Game` (status, followersCount, wishlistsCount) |
| Content context (M22) | `Game`, `Devlog`, `DevlogScreenshot`, `RoadmapItem`, `Comment`, `Studio`, `StudioMember` |

### 1.4 Rate Limiting

The global `CustomThrottlerGuard` (`apps/api/src/common/custom-throttler.guard.ts`) with default 60 req/min is already wired in `app.module.ts`:

```typescript
// apps/api/src/app.module.ts (current, line 78)
ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
```

AI endpoints override with stricter limits:

```typescript
// apps/api/src/ai/ai.controller.ts (new)
@Controller('api/ai')
export class AiController {
  @Post('chat')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async chat(@Req() req, @Body() body: ChatDto) { ... }

  @Get('recommendations')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async recommendations(@Req() req, @Query() query: RecommendationsDto) { ... }

  @Post('moderate')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  async moderate(@Body() body: ModerateDto) { ... }
}
```

---

## 2. Provider Abstraction Layer

### 2.1 AIProvider Interface

```typescript
// apps/api/src/ai/providers/ai-provider.interface.ts

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  model: string;
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter' | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface EmbeddingResult {
  embeddings: number[][];
  model: string;
  dimensions: number;
}

export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
}

export abstract class AIProvider {
  abstract readonly name: string;

  abstract chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<ChatResponse>;

  abstract chatStream(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncIterable<string>;

  abstract embed(texts: string[]): Promise<EmbeddingResult>;

  abstract moderate(text: string): Promise<ModerationResult>;
}
```

### 2.2 Concrete Implementations

```typescript
// apps/api/src/ai/providers/openai.provider.ts

@Injectable()
export class OpenAIProvider extends AIProvider {
  readonly name = 'openai';
  private client: OpenAI;

  constructor(private readonly config: ConfigService) {
    super();
    this.client = new OpenAI({
      apiKey: this.config.getOrThrow('AI_API_KEY'),
    });
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const completion = await this.client.chat.completions.create({
      model: options?.model ?? this.config.get('AI_MODEL') ?? 'gpt-4o-mini',
      messages: messages as any,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
    });
    const choice = completion.choices[0]!;
    return {
      id: completion.id,
      model: completion.model,
      content: choice.message.content ?? '',
      finishReason: choice.finish_reason as ChatResponse['finishReason'],
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: options?.model ?? this.config.get('AI_MODEL') ?? 'gpt-4o-mini',
      messages: messages as any,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: true,
    });
    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content ?? '';
    }
  }

  async embed(texts: string[]): Promise<EmbeddingResult> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });
    return {
      embeddings: response.data.map((d) => d.embedding),
      model: response.model,
      dimensions: 1536,
    };
  }

  async moderate(text: string): Promise<ModerationResult> {
    const response = await this.client.moderations.create({ input: text });
    const result = response.results[0]!;
    return {
      flagged: result.flagged,
      categories: result.categories as Record<string, boolean>,
      categoryScores: result.category_scores as Record<string, number>,
    };
  }
}
```

```typescript
// apps/api/src/ai/providers/anthropic.provider.ts

@Injectable()
export class AnthropicProvider extends AIProvider {
  readonly name = 'anthropic';
  private client: Anthropic;

  constructor(private readonly config: ConfigService) {
    super();
    this.client = new Anthropic({
      apiKey: this.config.getOrThrow('AI_API_KEY'),
    });
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    // Anthropic API format differs from OpenAI — transform messages
    const system = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const response = await this.client.messages.create({
      model: options?.model ?? this.config.get('AI_MODEL') ?? 'claude-3-haiku-20240307',
      system: system?.content,
      messages: userMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      max_tokens: options?.maxTokens ?? 2048,
    });

    return {
      id: response.id,
      model: response.model,
      content: response.content[0]?.type === 'text'
        ? response.content[0].text
        : '',
      finishReason: response.stop_reason === 'end_turn' ? 'stop' : null,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  // Anthropic does not offer embeddings or moderation APIs natively.
  // These delegate to a configured embedding provider (e.g., OpenAI or Voyage).
  async embed(texts: string[]): Promise<EmbeddingResult> {
    throw new Error('Anthropic does not provide embeddings. Use AI_EMBEDDING_PROVIDER=openai.');
  }

  async moderate(text: string): Promise<ModerationResult> {
    throw new Error('Anthropic does not provide moderation. Use AI_MODERATION_PROVIDER=openai.');
  }
}
```

### 2.3 AIModule with Factory Pattern

```typescript
// apps/api/src/ai/ai.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from './providers/ai-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: AIProvider,
      useFactory: (config: ConfigService): AIProvider => {
        const primary = config.get('AI_PROVIDER', 'openai');
        switch (primary) {
          case 'openai':
            return new OpenAIProvider(config);
          case 'anthropic':
            return new AnthropicProvider(config);
          default:
            throw new Error(`Unknown AI_PROVIDER: ${primary}`);
        }
      },
      inject: [ConfigService],
    },
    ChatService,
    EmbeddingService,
    RagService,
    AiEventSubscribers,
  ],
  exports: [AIProvider, ChatService, EmbeddingService, RagService],
})
export class AIModule {}
```

Provider selection via environment variables:

```bash
# .env
AI_PROVIDER=openai           # openai | anthropic
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini         # default model for chat
AI_EMBEDDING_PROVIDER=openai # if different from AI_PROVIDER
AI_MODERATION_PROVIDER=openai
```

---

## 3. Data Pipeline

### 3.1 Game Embeddings

```typescript
// apps/api/src/ai/services/embedding.service.ts

@Injectable()
export class EmbeddingService {
  private readonly EMBEDDING_VERSION = 1;

  constructor(
    private readonly ai: AIProvider,
    private readonly prisma: PrismaService,
  ) {}

  /** Builds the text representation of a game for embedding. */
  private buildGameText(game: {
    title: string;
    tagline?: string | null;
    description?: string | null;
    genres?: string | null;
    modes?: string | null;
  }): string {
    const parts: string[] = [
      `Title: ${game.title}`,
      game.tagline ? `Tagline: ${game.tagline}` : null,
      game.description ? `Description: ${game.description}` : null,
      game.genres ? `Genres: ${game.genres}` : null,
      game.modes ? `Modes: ${game.modes}` : null,
    ];
    return parts.filter(Boolean).join('\n');
  }

  /** Generate embedding for a single game and store in pgvector. */
  async generateGameEmbedding(gameId: string): Promise<void> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { tags: { include: { tag: true } } },
    });

    if (!game || !game.isPublished) return;

    const text = this.buildGameText(game);
    const result = await this.ai.embed([text]);
    const embedding = result.embeddings[0]!;

    await this.prisma.$executeRaw`
      INSERT INTO game_embeddings (game_id, embedding, version, updated_at)
      VALUES (${gameId}, ${embedding}::vector, ${this.EMBEDDING_VERSION}, NOW())
      ON CONFLICT (game_id)
      DO UPDATE SET embedding = EXCLUDED.embedding, version = EXCLUDED.version, updated_at = NOW()
    `;
  }

  /** Batch generate embeddings for all published games (initial load). */
  async generateAllEmbeddings(): Promise<{ total: number; failed: number }> {
    const games = await this.prisma.game.findMany({
      where: { isPublished: true },
      include: { tags: { include: { tag: true } } },
    });

    let failed = 0;
    const batchSize = 20;

    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize);
      const texts = batch.map((g) => this.buildGameText(g));

      try {
        const result = await this.ai.embed(texts);
        for (let j = 0; j < batch.length; j++) {
          await this.prisma.$executeRaw`
            INSERT INTO game_embeddings (game_id, embedding, version, updated_at)
            VALUES (${batch[j]!.id}, ${result.embeddings[j]!}::vector, ${this.EMBEDDING_VERSION}, NOW())
            ON CONFLICT (game_id)
            DO UPDATE SET embedding = EXCLUDED.embedding, version = EXCLUDED.version, updated_at = NOW()
          `;
        }
      } catch {
        failed += batch.length;
      }
    }

    return { total: games.length, failed };
  }
}
```

### 3.2 User Embeddings (Collaborative Filtering)

User vectors are computed offline (Python) and stored back in pgvector:

```sql
-- apps/api/prisma/migrations/xxx_add_user_embeddings/migration.sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE user_embeddings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  embedding vector(256),
  version INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON user_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
```

The offline pipeline extracts user-game interaction matrices:

```python
# scripts/ml/train_collaborative.py (new)
import numpy as np
from prisma import Prisma
from implicit.als import AlternatingLeastSquares

async def train():
    db = Prisma()
    await db.connect()

    # Build user-game interaction matrix
    users = await db.user.find_many(where={"role": "PLAYER"})
    games = await db.game.find_many(where={"isPublished": True})

    user_ids = [u.id for u in users]
    game_ids = [g.id for g in games]

    # Weighted interaction matrix
    matrix = lil_matrix((len(user_ids), len(game_ids)))

    # Follows (weight: 5)
    follows = await db.follow.find_many(where={"targetType": "GAME"})
    for f in follows:
        if f.userId in user_idx and f.gameId in game_idx:
            matrix[user_idx[f.userId], game_idx[f.gameId]] += 5

    # Wishlists (weight: 10)
    wishlists = await db.wishlistitem.find_many()
    for w in wishlists:
        if w.userId in user_idx and w.gameId in game_idx:
            matrix[user_idx[w.userId], game_idx[w.gameId]] += 10

    # Reactions (weight: 2)
    reactions = await db.reaction.find_many()
    for r in reactions:
        if r.userId in user_idx:
            # Find associated game...
            pass

    # Train ALS
    model = AlternatingLeastSquares(factors=256, iterations=15)
    model.fit(matrix.tocsr())

    # Store user vectors back to PostgreSQL
    user_factors = model.user_factors
    for i, uid in enumerate(user_ids):
        embedding = user_factors[i].tolist()
        await db.$execute_raw(
            """
            INSERT INTO user_embeddings (user_id, embedding, version, updated_at)
            VALUES ($1, $2::vector, 1, NOW())
            ON CONFLICT (user_id) DO UPDATE SET embedding = EXCLUDED.embedding, updated_at = NOW()
            """,
            uid, embedding,
        )
```

### 3.3 Vector Store Configuration

Neon PostgreSQL already has pgvector as an extension (enabled via the Neon dashboard). Verify:

```sql
-- Check if pgvector is available
SELECT * FROM pg_available_extensions WHERE name = 'vector';

-- Enable if not already
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify
SELECT * FROM pg_extension WHERE extname = 'vector';
```

Index strategy:

```sql
-- Game embeddings: IVF (inverted file) for similarity search
CREATE INDEX game_embedding_ivfflat_idx
  ON game_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- User embeddings: fewer users, fewer lists
CREATE INDEX user_embedding_ivfflat_idx
  ON user_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);
```

### 3.4 RAG Pipeline (Retrieval-Augmented Generation)

```typescript
// apps/api/src/ai/services/rag.service.ts

@Injectable()
export class RagService {
  constructor(private readonly prisma: PrismaService) {}

  /** Retrieve relevant game context for a query. */
  async retrieveContext(
    queryEmbedding: number[],
    limit: number = 5,
  ): Promise<{ gameId: string; title: string; description: string; similarity: number }[]> {
    const rows = await this.prisma.$queryRaw<Array<{
      game_id: string;
      title: string;
      description: string;
      similarity: number;
    }>>`
      SELECT
        g.id AS game_id,
        g.title,
        g.description,
        1 - (ge.embedding <=> ${queryEmbedding}::vector) AS similarity
      FROM game_embeddings ge
      JOIN games g ON g.id = ge.game_id
      WHERE g.is_published = true
      ORDER BY ge.embedding <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `;

    return rows.map((r) => ({
      gameId: r.game_id,
      title: r.title,
      description: r.description ?? '',
      similarity: Number(r.similarity),
    }));
  }

  /** Build a system prompt with retrieved context. */
  async buildContextualPrompt(
    query: string,
    context: Awaited<ReturnType<typeof this.retrieveContext>>,
  ): Promise<ChatMessage[]> {
    const contextBlock = context
      .map((c, i) => `[Game ${i + 1}] ${c.title}\n${c.description}`)
      .join('\n\n');

    return [
      {
        role: 'system',
        content: `You are Playmorrow AI, a game discovery assistant. 
Answer using the game context provided below. If the context doesn't 
contain relevant information, say so. Never invent game features.

Game Context:
${contextBlock}`,
      },
      {
        role: 'user',
        content: query,
      },
    ];
  }
}
```

---

## 4. API Design

### 4.1 Endpoints

| Method | Path | Purpose | Milestone | Rate Limit |
|--------|------|---------|-----------|------------|
| `POST` | `/api/ai/chat` | Streaming chat with context-aware assistant | M22 | 10 req/min |
| `GET` | `/api/ai/recommendations` | Personalized game recommendations | M23 | 30 req/min |
| `GET` | `/api/ai/search` | Semantic game search | M26 | 30 req/min |
| `POST` | `/api/ai/moderate` | Content moderation check | M24 | 20 req/min |
| `GET` | `/api/ai/insights/:studioId` | Studio intelligence cards | M25 | 20 req/min |
| `POST` | `/api/ai/embeddings/refresh` | Trigger embedding regeneration (admin) | M26 | 5 req/min |

### 4.2 Streaming Chat Endpoint (M22)

```typescript
// apps/api/src/ai/ai.controller.ts

@Controller('api/ai')
export class AiController {
  constructor(
    private readonly chatService: ChatService,
    private readonly recommendationsService: RecommendationsService,
    private readonly moderationService: ModerationService,
    private readonly insightsService: InsightsService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  @Post('chat')
  @UseGuards(AuthGuard)  // Must be authenticated
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async chat(@Req() req, @Body() body: ChatRequestDto, @Res() res: Response) {
    const userId = req.user.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const stream = this.chatService.streamChat({
        userId,
        message: body.message,
        context: body.context,   // { pageType, gameId?, studioId? }
        history: body.history,   // Previous messages
      });

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: 'AI service unavailable' })}\n\n`);
    } finally {
      res.end();
    }
  }
}

interface ChatRequestDto {
  message: string;
  context: {
    pageType: 'game_detail' | 'studio_dashboard' | 'devlog_editor' | 'marketplace' | 'feed' | 'search';
    gameId?: string;
    studioId?: string;
  };
  history?: { role: 'user' | 'assistant'; content: string }[];
}
```

### 4.3 Recommendations Endpoint (M23)

```typescript
@Get('recommendations')
@UseGuards(AuthGuard)
@Throttle({ default: { ttl: 60_000, limit: 30 } })
async getRecommendations(
  @Req() req,
  @Query() query: RecommendationsQueryDto,
): Promise<RecommendationsResponseDto> {
  const result = await this.recommendationsService.getRecommendations({
    userId: req.user.id,
    limit: query.limit ?? 20,
    excludeGameId: query.excludeGameId,
    variant: req.headers['x-recommendation-variant'] as string | undefined,
  });

  return {
    recommendations: result.games,
    explanations: result.explanations,
    variant: result.variant,
    cached: result.cached,
  };
}
```

### 4.4 Semantic Search Endpoint (M26)

```typescript
@Get('search')
@Throttle({ default: { ttl: 60_000, limit: 30 } })
async semanticSearch(
  @Query('q') query: string,
  @Query('limit') limit?: number,
  @Query('genre') genre?: string,
  @Query('platform') platform?: string,
  @Query('maxPrice') maxPrice?: number,
): Promise<SearchResponseDto> {
  // Hybrid: semantic + keyword + filter
  const results = await this.searchService.hybridSearch({
    query,
    limit: limit ?? 20,
    filters: {
      genre,
      platform,
      maxPriceCents: maxPrice ? maxPrice * 100 : undefined,
    },
  });

  return {
    results: results.games.map(g => ({
      ...g,
      similarity: g.similarity,
    })),
    query: {
      original: query,
      intent: results.queryIntent,
      embeddingModel: results.embeddingModel,
    },
  };
}
```

### 4.5 Studio Insights Endpoint (M25)

```typescript
@Get('insights/:studioId')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN', 'MODERATOR', 'OWNER')
@Throttle({ default: { ttl: 60_000, limit: 20 } })
async getInsights(
  @Param('studioId') studioId: string,
  @Req() req,
): Promise<InsightsResponseDto> {
  // Verify the requesting user is a member of this studio
  const membership = await this.prisma.studioMember.findUnique({
    where: { studioId_userId: { studioId, userId: req.user.id } },
  });
  if (!membership && req.user.role !== 'ADMIN') {
    throw new ForbiddenException('You are not a member of this studio');
  }

  const insights = await this.insightsService.getInsights(studioId);
  return {
    insights,
    generatedAt: new Date().toISOString(),
    studioId,
  };
}
```

---

## 5. Security Considerations

### 5.1 Data Exclusion from AI Context

The following data is **never** passed to any AI provider:

```typescript
// apps/api/src/ai/services/context-assembly.service.ts

const EXCLUDED_FIELDS = [
  'passwordHash',
  'email',
  'ipHash',
  'sessionHash',
  'tokenHash',
  'keyHash',
  'codeHash',
  'amountCents',       // Transaction amounts
  'stripeAccountId',   // Stripe identifiers
  'stripePaymentIntentId',
  'stripeEventId',
  'priceCents',        // Individual game pricing (aggregate stats only)
] as const;

export class ContextAssemblyService {
  /** Strip sensitive fields before passing data to AI provider. */
  sanitizeForAI<T extends Record<string, any>>(data: T): Partial<T> {
    const sanitized = { ...data };
    for (const field of EXCLUDED_FIELDS) {
      delete sanitized[field];
    }
    return sanitized;
  }
}
```

### 5.2 User PII Exclusion

- AI training never uses identifiable user data
- Collaborative filtering uses hashed user IDs only
- User embeddings stored with hashed IDs, correlated back via application layer
- RAG context includes only public game data, never user-specific PII

### 5.3 Rate Limiting

AI endpoints have stricter limits than the platform default (60 req/min):

| Endpoint | Limit | Rationale |
|----------|-------|-----------|
| Chat | 10 req/min | Most expensive (LLM tokens) |
| Recommendations | 30 req/min | Cached, computation-heavy |
| Search | 30 req/min | Cached embedding, pgvector query |
| Moderate | 20 req/min | LLM API call per content item |
| Insights | 20 req/min | Pre-computed, lightweight |

### 5.4 Content Filtering

All AI-generated content passes through moderation before display:

```typescript
// apps/api/src/ai/services/ai-content-guard.service.ts

@Injectable()
export class AiContentGuard {
  constructor(
    private readonly ai: AIProvider,
  ) {}

  async validateResponse(content: string): Promise<{
    safe: boolean;
    moderated: boolean;
    flags: string[];
  }> {
    const result = await this.ai.moderate(content);

    if (!result.flagged) {
      return { safe: true, moderated: false, flags: [] };
    }

    const flags = Object.entries(result.categories)
      .filter(([, flagged]) => flagged)
      .map(([category]) => category);

    return {
      safe: flags.length === 0,
      moderated: true,
      flags,
    };
  }
}
```

### 5.5 Audit Logging

All AI interactions are audit-logged:

```prisma
model AiAuditLog {
  id            String   @id @default(cuid())
  userId        String?
  endpoint      String   // chat, recommendations, search, moderate, insights
  provider      String   // openai, anthropic
  model         String?  // gpt-4o-mini, claude-3-haiku, text-embedding-3-small
  promptTokens  Int?
  completionTokens Int?
  latencyMs     Int?
  success       Boolean
  error         String?
  moderated     Boolean  @default(false)
  createdAt     DateTime @default(now())

  @@index([userId, createdAt])
  @@index([endpoint, createdAt])
  @@index([provider, createdAt])
  @@map("ai_audit_logs")
}
```

```typescript
// apps/api/src/ai/services/ai-audit.service.ts

@Injectable()
export class AiAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    endpoint: string;
    provider: string;
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    latencyMs: number;
    success: boolean;
    moderated: boolean;
    error?: string;
  }): Promise<void> {
    await this.prisma.aiAuditLog.create({ data: params });
  }
}
```

---

## 6. Deployment

### 6.1 Environment Variables

```bash
# Required
AI_PROVIDER=openai                     # openai | anthropic
AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx     # Provider API key

# Optional overrides
AI_MODEL=gpt-4o-mini                   # Default chat model
AI_EMBEDDING_PROVIDER=openai           # Separate embedding provider (if needed)
AI_MODERATION_PROVIDER=openai          # Separate moderation provider (if needed)
AI_FEATURE_ASSISTANT=true              # Feature flag: M22
AI_FEATURE_RECOMMENDATIONS=false       # Feature flag: M23
AI_FEATURE_MODERATION=false            # Feature flag: M24
AI_FEATURE_INSIGHTS=false              # Feature flag: M25
AI_FEATURE_SEARCH=false                # Feature flag: M26
AI_MAX_TOKENS=2048                     # Token budget per request
AI_CHAT_RATE_LIMIT=10                  # req/min for chat
```

### 6.2 Database Migration

```sql
-- apps/api/prisma/migrations/xxx_phase6_ai/migration.sql

-- pgvector extension (if not already enabled on Neon)
CREATE EXTENSION IF NOT EXISTS vector;

-- Game embeddings for semantic search + recommendations
CREATE TABLE game_embeddings (
  game_id TEXT PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
  embedding vector(1536),
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX game_embedding_ivfflat_idx
  ON game_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- User embeddings for collaborative filtering
CREATE TABLE user_embeddings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  embedding vector(256),
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX user_embedding_ivfflat_idx
  ON user_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- AI audit logs
CREATE TABLE ai_audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  prompt_tokens INT,
  completion_tokens INT,
  latency_ms INT,
  success BOOLEAN NOT NULL,
  error TEXT,
  moderated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ai_audit_user_idx ON ai_audit_logs(user_id, created_at);
CREATE INDEX ai_audit_endpoint_idx ON ai_audit_logs(endpoint, created_at);

-- Studio insights
CREATE TABLE studio_insights (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  suggestion TEXT,
  action_label TEXT,
  action_url TEXT,
  confidence FLOAT NOT NULL,
  metadata JSONB,
  dismissed_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX studio_insights_studio_idx ON studio_insights(studio_id, type);
CREATE INDEX studio_insights_created_idx ON studio_insights(studio_id, created_at);
```

### 6.3 App Module Registration

```typescript
// apps/api/src/app.module.ts — add to imports array

import { AIModule } from './ai/ai.module';

@Module({
  imports: [
    // ... existing imports ...
    AIModule,  // Global module via @Global()
  ],
})
export class AppModule {}
```

### 6.4 Python Offline Training Container

```dockerfile
# scripts/ml/Dockerfile (new)
FROM python:3.12-slim

WORKDIR /app

RUN pip install implicit numpy scipy prisma

COPY train_collaborative.py .
COPY train_sentiment.py .

CMD ["python", "train_collaborative.py"]
```

Run as a Fly.io Machine or scheduled task that connects to the same Neon database:

```yaml
# fly.ml.toml (new)
app = "playmorrow-ml"
primary_region = "iad"

[build]
  dockerfile = "scripts/ml/Dockerfile"

[[vm]]
  cpu_kind = "shared"
  cpus = 2
  memory = "2gb"

# Scheduled to run nightly
[http_service]
  internal_port = 8080
```

---

## 7. Error Handling

### 7.1 Graceful Degradation

```typescript
// apps/api/src/ai/services/chat.service.ts

@Injectable()
export class ChatService {
  constructor(
    private readonly ai: AIProvider,
    private readonly ragService: RagService,
    private readonly auditService: AiAuditService,
  ) {}

  async *streamChat(params: ChatParams): AsyncIterable<string> {
    const startTime = Date.now();
    let success = false;
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      // Phase 1: RAG retrieval (fast, local)
      const queryEmbedding = await this.ai.embed([params.message]);
      const context = await this.ragService.retrieveContext(
        queryEmbedding.embeddings[0]!,
      );

      // Phase 2: Build prompt
      const messages = await this.ragService.buildContextualPrompt(
        params.message,
        context,
      );

      // Phase 3: Stream response
      for await (const chunk of this.ai.chatStream(messages)) {
        yield chunk;
      }

      success = true;
    } catch (error) {
      // Graceful degradation: if AI fails, return fallback message
      yield '\n\n*AI assistant is temporarily unavailable. Our team has been notified.*';
      throw error;
    } finally {
      await this.auditService.log({
        userId: params.userId,
        endpoint: 'chat',
        provider: this.ai.name,
        model: undefined,
        promptTokens,
        completionTokens,
        latencyMs: Date.now() - startTime,
        success,
        moderated: false,
        error: success ? undefined : 'AI provider error',
      });
    }
  }
}
```

### 7.2 Feature Flag Guard

```typescript
// apps/api/src/ai/guards/ai-feature.guard.ts

@Injectable()
export class AiFeatureGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const feature = this.reflector.get<string>('aiFeature', context.getHandler());
    if (!feature) return true;

    const enabled = this.config.get(`AI_FEATURE_${feature.toUpperCase()}`, 'false');
    if (enabled !== 'true') {
      throw new ServiceUnavailableException(
        `AI feature ${feature} is not yet available`,
      );
    }
    return true;
  }
}

// Usage:
@Post('chat')
@SetMetadata('aiFeature', 'assistant')
@UseGuards(AiFeatureGuard)
async chat() { ... }
```

---

## 8. Monitoring & Observability

### 8.1 Key Metrics

| Metric | Instrument | Alert Threshold |
|--------|-----------|-----------------|
| AI endpoint latency (p95) | AiAuditLog latencyMs | >5000ms for chat, >500ms for search |
| AI failure rate | AiAuditLog success=false | >5% in 15-min window |
| Total AI cost (USD) | Sum of token usage × provider pricing | >$50/day |
| Chat engagement rate | AnalyticsEvent type=ai_chat_opened | <5% DAU after week 2 |
| Recommendation CTR | AnalyticsEvent type=ai_rec_clicked | <5% → revert to static scorers |
| Embedding staleness | game_embeddings.updated_at | >24h since last update |

### 8.2 Sentry Integration

```typescript
// apps/api/src/ai/services/chat.service.ts

import * as Sentry from '@sentry/node';

// Inside chat/stream methods:
Sentry.startSpan({ op: 'ai.chat', name: 'ChatStream' }, async (span) => {
  span.setAttribute('ai.provider', this.ai.name);
  span.setAttribute('ai.user_id', params.userId);
  // ... AI call ...
  span.setAttribute('ai.tokens_prompt', promptTokens);
  span.setAttribute('ai.tokens_completion', completionTokens);
  span.setAttribute('ai.latency_ms', latencyMs);
});
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// apps/api/src/ai/ai.service.spec.ts

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let mockAi: jest.Mocked<AIProvider>;
  let mockPrisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    mockAi = {
      name: 'test',
      embed: jest.fn().mockResolvedValue({
        embeddings: [[0.1, 0.2, 0.3]],
        model: 'test-model',
        dimensions: 3,
      }),
    } as any;

    mockPrisma = createMock<PrismaService>();
    service = new EmbeddingService(mockAi, mockPrisma);
  });

  it('generates embedding for published game', async () => {
    mockPrisma.game.findUnique.mockResolvedValue({
      id: 'game-1',
      title: 'Stardew Valley',
      description: 'A farming RPG',
      isPublished: true,
      tags: [],
    } as any);

    await service.generateGameEmbedding('game-1');

    expect(mockAi.embed).toHaveBeenCalledWith([
      expect.stringContaining('Stardew Valley'),
    ]);
    expect(mockPrisma.$executeRaw).toHaveBeenCalled();
  });

  it('skips embedding for unpublished game', async () => {
    mockPrisma.game.findUnique.mockResolvedValue({
      id: 'game-2',
      isPublished: false,
    } as any);

    await service.generateGameEmbedding('game-2');

    expect(mockAi.embed).not.toHaveBeenCalled();
  });
});
```

### 9.2 Integration Tests (Mocked AIProvider)

```typescript
// apps/api/src/ai/ai.controller.spec.ts

describe('AiController (e2e)', () => {
  // Use MockAIProvider that returns deterministic responses
  // Test rate limiting (expect 429 after 10 requests)
  // Test auth requirement (expect 401 without session)
  // Test feature flag (expect 503 when disabled)
});
```

### 9.3 Test Coverage Targets

| Module | Test Files | Target Coverage |
|--------|-----------|-----------------|
| AIModule | `ai.module.spec.ts` | Module wiring |
| AIProvider (OpenAI) | `openai.provider.spec.ts` | 90%+ |
| AIProvider (Anthropic) | `anthropic.provider.spec.ts` | 90%+ |
| ChatService | `chat.service.spec.ts` | 85%+ |
| EmbeddingService | `embedding.service.spec.ts` | 90%+ |
| RagService | `rag.service.spec.ts` | 85%+ |
| ModerationPipeline | `moderation-pipeline.spec.ts` | 85%+ |
| AiController | `ai.controller.spec.ts` | 80%+ (integration) |
| AiEventSubscribers | `ai-event-subscribers.spec.ts` | 85%+ |

---

## 10. Rollout Plan

### Phase 6a (Weeks 1-4): Foundation + Assistant
- AIModule + provider abstraction
- pgvector + game embeddings
- Chat endpoint + ChatWidget UI
- M22 Assistant MVP behind feature flag

### Phase 6b (Weeks 3-7): Recommendations + Moderation
- Collaborative filtering pipeline
- M23 Recommendations (A/B test vs static scorers)
- M24 Moderation (auto-flag for high-confidence)

### Phase 6c (Weeks 3-8): Studio Intelligence + Search
- M25 Insights dashboard widgets
- M26 Semantic search (A/B test vs keyword)

### Phase 6d (Week 8+): Stabilization
- A/B test evaluation for M23 and M26
- Cost optimization (cache tuning, model selection)
- Feature flag graduation (beta → GA)
- Documentation + monitoring dashboards
