# Playmorrow AI — Dependency Graph

**Date:** 2026-08-05
**Status:** Active (updated as Phase 6 architecture evolves)
**Depends on:** [AI Architecture](./AI_ARCHITECTURE.md), [Phase 6 Roadmap](./PHASE6_ROADMAP.md)

---

## Table of Contents

1. [Reading This Graph](#reading-this-graph)
2. [Foundation Layer (Built — Session 22)](#foundation-layer-built--session-22)
3. [AI Capability Dependencies](#ai-capability-dependencies)
4. [Milestone-to-Capability Mapping](#milestone-to-capability-mapping)
5. [Critical Path Analysis](#critical-path-analysis)
6. [Single-Point Dependencies](#single-point-dependencies)
7. [Build Order Implications](#build-order-implications)

---

## Reading This Graph

```
A → B      A depends on B (B must be built first)
A → B, C   A depends on B AND C
A ⇢ B      Loose dependency (A benefits from B but can ship without it)
[A]        Already built (Session 22)
[Mxx]      Milestone ID (M22, M23, etc.)
```

---

## Foundation Layer (Built — Session 22)

The entire foundation layer exists in `apps/api/src/ai/` as a `@Global()` NestJS module. No new dependencies required before feature work begins.

```
                          ┌───────────────────────────┐
                          │     [AIConfig]             │
                          │  AI_PROVIDER env var       │
                          │  model selection            │
                          │  rate limits + cost caps    │
                          └─────────────┬──────────────┘
                                        │ reads from
          ┌─────────────────────────────┼─────────────────────────────┐
          │                             │                             │
          ▼                             ▼                             ▼
┌──────────────────┐   ┌────────────────────────┐   ┌──────────────────────┐
│ [ProviderFactory] │   │  [AIMetricsService]    │   │  [PromptRegistry]    │
│                  │   │                        │   │                      │
│ .getProvider() → │   │  cost estimation        │   │  8 versioned         │
│   returns one of:│   │  latency tracking       │   │  prompt templates    │
│                  │   │  token counting         │   │                      │
│ ┌──────────────┐ │   │  per-model breakdown    │   │  - game_qa           │
│ │ OpenAIProvider│ │   │                        │   │  - devlog_draft      │
│ │ (chat+embed+ │ │   │ monitors ALL services ──┼───│  - search_query      │
│ │  moderate)   │ │   │                        │   │  - recommendation    │
│ └──────────────┘ │   └────────────────────────┘   │  - sentiment         │
│                  │                                │  - moderation        │
│ ┌──────────────┐ │   ┌────────────────────────┐   │  - insight_suggest   │
│ │ Anthropic    │ │   │  [ConversationMemory]   │   │  - support_reply    │
│ │ Provider     │ │   │                        │   │                      │
│ │ (chat only)  │ │   │  session context        │   │ feeds into →        │
│ └──────────────┘ │   │  message history        │   │  AIService.chat()   │
└────────┬─────────┘   │  auto-summarization     │   └──────────────────────┘
         │             │  GDPR deleteUserMemory  │
         │             └────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       [AIService]                                │
│                                                                 │
│  Central orchestrator. Consumes:                                 │
│  - ProviderFactory → AIProvider instance                         │
│  - PromptRegistry → resolved prompt templates                    │
│  - ConversationMemory → session context                          │
│  - StreamService → SSE streaming wrapper                         │
│  - AIMetricsService → logs every call                            │
│                                                                 │
│  Exposed via [AIController] (4 endpoints):                       │
│  POST /api/ai/chat       — SSE streaming chat                    │
│  POST /api/ai/embed      — text → vector embedding               │
│  POST /api/ai/moderate   — content moderation check               │
│  GET  /api/ai/providers  — list available providers              │
└─────────────────────────────────────────────────────────────────┘
         │
         │ provider used by
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Three interface contracts (apps/api/src/ai/interfaces/):         │
│                                                                  │
│  AIProvider        EmbeddingProvider        ModerationProvider    │
│  ├─ chat()         ├─ embed()               ├─ moderate()         │
│  ├─ chatStream()   ├─ dimensions            ├─ categories         │
│  └─                 └─ model                 └─ scores            │
│                                                                  │
│  VectorStore                                                    │
│  ├─ store(gameId, embedding)                                    │
│  ├─ search(queryEmbedding, limit) → similarity results           │
│  └─ delete(gameId)                                              │
└──────────────────────────────────────────────────────────────────┘
```

### Foundation Services Diagram

```
[AIConfig]
    │
    ├──→ [ProviderFactory]
    │        │
    │        ├──→ OpenAIProvider ──→ chat(), embed(), moderate()
    │        └──→ AnthropicProvider ──→ chat() only
    │                 │
    │                 │ delegates embed/moderate to OpenAI/Voyage
    │                 │
    ├──→ [EmbeddingService]
    │        │
    │        ├──→ AIProvider.embed()
    │        ├──→ PgVectorStore.store()
    │        ├──→ TextChunker.chunk()
    │        └──→ caching layer (query embeddings)
    │
    ├──→ [PromptRegistry]
    │        │
    │        ├──→ 8 built-in templates
    │        ├──→ versioned (v1, v2, ...)
    │        └──→ injects into AIService
    │
    ├──→ [ConversationMemory]
    │        │
    │        ├──→ Prisma (session storage)
    │        ├──→ auto-summarization via AIProvider.chat()
    │        └──→ GDPR: deleteUserMemory(userId)
    │
    ├──→ [StreamService]
    │        │
    │        └──→ SSE chunking + cancellation
    │
    └──→ [AIMetricsService]
             │
             ├──→ cost estimation ($/request)
             ├──→ latency (p50/p95/p99)
             ├──→ token tracking (prompt + completion)
             └──→ per-model breakdown
```

---

## AI Capability Dependencies

Each AI capability is a reusable building block. Capabilities compose into milestones.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CORE AI CAPABILITIES                              │
│                                                                         │
│  C1: Natural Language Understanding (NLU)                               │
│      └─→ AIProvider.chat() + PromptRegistry                             │
│      └─→ Parses: genre intent, mechanic intent, mood intent, comparison │
│                                                                         │
│  C2: Embeddings (Text → Vector)                                          │
│      └─→ AIProvider.embed() + EmbeddingService                          │
│      └─→ Game descriptions, devlogs, reviews, user queries               │
│                                                                         │
│  C3: Vector Storage & Similarity Search                                  │
│      └─→ PgVectorStore (pgvector on Neon PostgreSQL)                     │
│      └─→ Cosine similarity, IVFFlat index, top-K retrieval               │
│                                                                         │
│  C4: Retrieval-Augmented Generation (RAG)                                │
│      └─→ C2 (Embeddings) + C3 (Vector Store) + C1 (NLU)                │
│      └─→ Query → embed → search → assemble context → generate response  │
│                                                                         │
│  C5: Content Moderation                                                  │
│      └─→ ModerationProvider.moderate()                                   │
│      └─→ Toxicity scoring (0-1), spam scoring (0-1), quality scoring    │
│                                                                         │
│  C6: Sentiment Analysis                                                  │
│      └─→ C1 (NLU) + PromptRegistry ("sentiment" template)               │
│      └─→ Positive/negative/neutral + confidence + key phrases            │
│                                                                         │
│  C7: Semantic Ranking                                                    │
│      └─→ C2 (Embeddings) + C3 (Vector Store)                            │
│      └─→ Query embedding → cosine similarity → ranked results            │
│                                                                         │
│  C8: Collaborative Filtering (ML)                                        │
│      └─→ User-game interaction matrix (Python/ALS, offline)              │
│      └─→ User vectors, game vectors → latent factor similarity           │
│                                                                         │
│  C9: Gaming Taste Profile                                                │
│      └─→ C2 (Embeddings) + C8 (Collaborative Filtering)                 │
│      └─→ Per-user vector: genre weights, mechanic preferences, mood     │
│                                                                         │
│  C10: Streaming Response (SSE)                                           │
│      └─→ StreamService (already built, Session 22)                       │
│      └─→ AIProvider.chatStream() → SSE chunks → progressive render      │
│                                                                         │
│  C11: Explainability ("Why This?")                                       │
│      └─→ C1 (NLU) + structured game attributes                           │
│      └─→ "Because you liked {game}" + matched attribute list             │
│                                                                         │
│  C12: Time-Series Forecasting                                            │
│      └─→ Historical data (AnalyticsDailyAggregate) + genre benchmarks    │
│      └─→ Wishlist velocity, sales trajectory, launch timing              │
│                                                                         │
│  C13: Fraud Detection                                                    │
│      └─→ Transaction patterns + ModerationProvider                       │
│      └─→ Anomaly scoring, velocity checks, pattern matching              │
│                                                                         │
│  C14: Conversation Context (Memory)                                      │
│      └─→ ConversationMemory (already built, Session 22)                  │
│      └─→ Session persistence, auto-summarization, multi-turn             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Capability Dependency Graph

```
C1 (NLU)              ← foundation for all text-based AI
├──→ C4 (RAG)         ← C1 + C2 + C3
├──→ C6 (Sentiment)   ← C1 + PromptRegistry
├──→ C11 (Explain)    ← C1 + structured data
└──→ C14 (Memory)     ← C1 + ConversationMemory

C2 (Embeddings)       ← foundation for all vector-based AI
├──→ C3 (Vector Store)← C2 + pgvector
├──→ C4 (RAG)         ← C2 + C3 + C1
├──→ C7 (Semantic)    ← C2 + C3
├──→ C8 (Collab)      ← C2 + user-game matrix
└──→ C9 (Taste)       ← C2 + C8

C3 (Vector Store)     ← pgvector infrastructure
├──→ C4 (RAG)
├──→ C7 (Semantic)
└──→ C9 (Taste)

C5 (Moderation)       ← independent capability
├──→ C13 (Fraud)      ← C5 + transaction data
└──→ (standalone for content flagging)

C8 (Collab Filter)    ← offline ML pipeline
└──→ C9 (Taste)       ← C8 + C2

C10 (Streaming)       ← independent (built)
└──→ any chat feature

C12 (Forecasting)     ← independent (analytics data)
└──→ no AI dependency (statistical models)
```

### Dependency Chains (Longest Paths)

```
Shortest path → already built:
  C10 (Streaming) — zero dependencies on other capabilities [READY]

Medium path (1 layer):
  C1 (NLU) ← PromptRegistry [READY — built]
  C2 (Embeddings) ← AIProvider.embed() [READY — built]
  C5 (Moderation) ← ModerationProvider [READY — built]

Long path (2 layers):
  C3 (Vector Store) ← C2 (Embeddings) ← AIProvider
  C6 (Sentiment) ← C1 (NLU) ← PromptRegistry
  C7 (Semantic) ← C2 + C3 ← AIProvider + pgvector
  C11 (Explain) ← C1 (NLU) + structured data
  C13 (Fraud) ← C5 (Moderation) + transaction data

Deepest path (3 layers):
  C4 (RAG) ← C1 (NLU) + C3 (Vector) ← C2 (Embeddings) ← AIProvider
  C9 (Taste) ← C8 (Collab) + C2 (Embeddings) ← C3 (Vector)
```

---

## Milestone-to-Capability Mapping

Each Phase 6 milestone composes multiple capabilities:

```
M22 — AI ASSISTANT
├── C1  NLU (chat understanding, intent parsing)
├── C2  Embeddings (query embedding for RAG retrieval)
├── C3  Vector Store (game context retrieval)
├── C4  RAG (ground responses in game data)
├── C10 Streaming (SSE progressive rendering)
├── C11 Explainability ("why this game?")
└── C14 Memory (multi-turn conversation)

M23 — RECOMMENDATION ENGINE
├── C2  Embeddings (game text → vectors)
├── C3  Vector Store (game vector similarity)
├── C7  Semantic Ranking (content-based similarity)
├── C8  Collaborative Filtering (user-game latent factors)
├── C9  Gaming Taste Profile (per-user preference vector)
├── C11 Explainability ("because you liked…")
└── C1  NLU (explanation generation)

M24 — AI MODERATION
├── C5  Content Moderation (toxicity + spam scoring)
├── C1  NLU (context understanding, sarcasm detection)
└── (uses existing ModerationModule for queue + appeals)

M25 — STUDIO INTELLIGENCE
├── C1  NLU (insight generation, suggestion phrasing)
├── C6  Sentiment Analysis (community sentiment trends)
├── C12 Forecasting (wishlist trajectory, launch timing)
├── C2  Embeddings (game similarity for benchmarking)
├── C3  Vector Store (genre clustering for comparisons)
└── C7  Semantic Ranking (find comparable games)

M26 — SEMANTIC SEARCH
├── C2  Embeddings (query → vector, game → vector)
├── C3  Vector Store (similarity search)
├── C7  Semantic Ranking (hybrid: semantic + keyword + popularity)
├── C1  NLU (query intent classification)
└── C11 Explainability (why this game matched)
```

### Dependency Matrix: Milestone × Capability

| Capability | M22 Assistant | M23 Recs | M24 Moderation | M25 Studio | M26 Search |
|---|---|---|---|---|---|
| C1 NLU | **Hard** | Soft | **Hard** | **Hard** | Soft |
| C2 Embeddings | **Hard** | **Hard** | — | Soft | **Hard** |
| C3 Vector Store | **Hard** | **Hard** | — | Soft | **Hard** |
| C4 RAG | **Hard** | — | — | — | — |
| C5 Moderation | — | — | **Hard** | — | — |
| C6 Sentiment | — | — | — | **Hard** | — |
| C7 Semantic Rank | — | **Hard** | — | Soft | **Hard** |
| C8 Collab Filter | — | **Hard** | — | — | — |
| C9 Taste Profile | — | **Hard** | — | — | — |
| C10 Streaming | **Hard** | — | — | — | — |
| C11 Explainability | **Hard** | **Hard** | — | — | Soft |
| C12 Forecasting | — | — | — | **Hard** | — |
| C13 Fraud | — | — | — | — | — |
| C14 Memory | **Hard** | — | — | — | — |

**Hard** = milestone cannot function without this capability
**Soft** = milestone functions but is improved by this capability
— = no relationship

---

## Critical Path Analysis

### Which capabilities block the most features?

```
Capability                    Blocks    Features Blocked
──────────────────────────────────────────────────────────────────
C1  NLU                       4.5       M22, M23 (explain), M24, M25, M26 (intent)
C2  Embeddings                4.5       M22, M23, M25 (soft), M26
C3  Vector Store              4.5       M22, M23, M25 (soft), M26
C7  Semantic Ranking          2.5       M23, M25 (soft), M26
C11 Explainability            2.5       M22, M23, M26 (soft)
──────────────────────────────────────────────────────────────────
C4  RAG                       1         M22
C5  Moderation                1         M24
C6  Sentiment                 1         M25
C8  Collab Filter             1         M23
C9  Taste Profile             1         M23
C10 Streaming                 1         M22
C12 Forecasting               1         M25
C14 Memory                    1         M22
```

**Key insight:** C1, C2, and C3 are the critical foundation. They each block 4-5 features. These are already built in Session 22, which is why all Phase 6 milestones can start in parallel.

### Critical Path (Longest dependency chain for each milestone)

```
M22: C2 → C3 → C4 → M22
     (C2 + C3 already built → C4 takes ~2 weeks → M22 ~6 weeks)
     Critical path length: 8 weeks (RAG + Assistant)

M23: C2 → C8 → C9 → M23
     (C2 built → C8 offline pipeline ~3 weeks → C9 ~1 week → M23 ~8 weeks)
     Critical path length: 8 weeks (Collab Filter + Rec Engine)

M24: C5 → M24
     (C5 built → M24 ~4 weeks)
     Critical path length: 4 weeks (shortest)

M25: C1 → C6/C12 → M25
     (C1 built → C6 ~1 week, C12 ~2 weeks → M25 ~6 weeks)
     Critical path length: 8 weeks (Sentiment + Studio Intel)

M26: C2 → C3 → C7 → M26
     (C2 + C3 built → C7 ~1 week → M26 ~6 weeks)
     Critical path length: 7 weeks (Semantic Rank + Search)
```

**All critical paths are 4-8 weeks**, consistent with the Phase 6 timeline of 8 weeks.

---

## Single-Point Dependencies

### SPOF-1: AIProvider (via ProviderFactory)

```
ProviderFactory
    │
    ├──→ C1 (NLU)           ← embedded in 4.5 features
    ├──→ C2 (Embeddings)    ← embedded in 4.5 features
    ├──→ C5 (Moderation)    ← embedded in 1 feature
    └──→ C10 (Streaming)    ← embedded in 1 feature
```

**Risk:** If an LLM provider goes down, all AI features degrade simultaneously.

**Mitigation (already built):**
- `ProviderFactory` supports multiple providers — swap `AI_PROVIDER=openai` to `AI_PROVIDER=anthropic` via env var with zero code changes.
- Separate `AI_EMBEDDING_PROVIDER` and `AI_MODERATION_PROVIDER` allow mixing providers for different capabilities.
- `AIRateLimit` 10 req/min on chat prevents catastrophic cost spikes.
- Graceful degradation: if LLM is unavailable, AI surfaces show "temporarily unavailable" messages; non-AI flows are unaffected.

**Residual risk:** Low. Provider abstraction is already implemented and tested.

### SPOF-2: pgvector / Neon PostgreSQL

```
PgVectorStore (pgvector on Neon)
    │
    ├──→ C3 (Vector Store)  ← embedded in 4.5 features
    ├──→ C4 (RAG)           ← embedded in 1 feature
    ├──→ C7 (Semantic)      ← embedded in 2.5 features
    └──→ C9 (Taste)         ← embedded in 1 feature
```

**Risk:** Neon PostgreSQL outage kills all vector-based features (semantic search, recommendations, RAG). Non-vector features (chat without RAG, moderation) continue working.

**Mitigation:**
- All vector operations have fallback: recommendations → trending/popular, search → keyword-only.
- Neon has 99.95% uptime SLA.
- Embeddings are cached in-memory for recent queries (TTL: 1 hour).

**Residual risk:** Low. Vector features degrade gracefully.

### SPOF-3: PrismaService

```
PrismaService (single PrismaClient instance)
    │
    └──→ Every service reads/writes through Prisma
```

**Risk:** Database connection failure blocks all AI features.

**Mitigation:**
- AI features are additive — core platform (auth, game pages, dashboards) works without AI.
- Neon connection pooling handles >10,000 concurrent connections.
- Feature flags can disable AI without affecting any other functionality.

**Residual risk:** Very low. AI is fully detachable from the platform.

---

## Build Order Implications

### Recommended Build Sequence

Given the dependency analysis, the optimal build order is:

```
Week 1-2: Shared Infrastructure (already done — Session 22)
  ✓ AIModule + ProviderFactory
  ✓ EmbeddingService + PgVectorStore
  ✓ PromptRegistry + ConversationMemory
  ✓ StreamService + AIMetricsService
  ✓ AIController (4 endpoints)

Week 1-8 (parallel tracks):

  Track A (Discovery — highest user value):
    Week 1-2: C7 Semantic Ranking (uses C2, C3 — built)
    Week 3-5: C9 Gaming Taste Profile (uses C2, C8 built in parallel)
    Week 6-8: C8 Collaborative Filtering (Python/ALS, offline)
    Deploy: M23 Recommendation Engine (Week 8)

  Track B (Search — moderate user value):
    Week 1: C7 Semantic Ranking (shared with Track A)
    Week 2-4: Hybrid search index (semantic + keyword + popularity)
    Week 5-6: Query intent classification + re-ranking
    Deploy: M26 Semantic Search (Week 6)

  Track C (Studio — high studio value):
    Week 1-2: C12 Forecasting (statistical, no AI dependency)
    Week 3-4: C6 Sentiment Analysis (uses C1 — built)
    Week 5-6: Store page analyzer + launch readiness
    Deploy: M25 Studio Intelligence (Week 6)

  Track D (Assistant — lowest priority, highest complexity):
    Week 1-2: C4 RAG pipeline (uses C2, C3 — built)
    Week 3-4: ChatWidget UI + SSE client
    Week 5-6: Player-side features + devlog drafts
    Deploy: M22a Devlog Drafts (Week 6)
    Deploy: M22 AI Assistant (Week 8, if scope approved)

  Track E (Moderation — deferred):
    Deploy: M24 AI Moderation (Post-Phase 6, when platform scale justifies it)
```

### Why This Order?

1. **M23 (Recommendations) first** — highest Priority Score (14.7), blocks no other milestones, benefits from all shared infrastructure being already built.
2. **M26 (Semantic Search) second** — shares C2/C3/C7 with M23, low additional effort once embeddings exist.
3. **M25 (Studio Intelligence) third** — C6 (sentiment) and C12 (forecasting) have no dependency on the recommendation/search pipeline. Can start in parallel with Track A.
4. **M22 (AI Assistant) last** — lower Priority Score (11.6), depends on M23/M26 for RAG context quality, benefits from waiting until embedding infrastructure is production-hardened.
5. **M24 (AI Moderation) deferred** — rejected at current scope (6.7), becomes viable when platform reaches >100K DAU.

### What Can Be Parallelized

```
Independent (no shared dependencies):
  Track B (Search) + Track C (Studio) — can build simultaneously

Semi-dependent (share C7):
  Track A (Recs) and Track B (Search) both need C7 → build C7 once, share

Dependent (must wait):
  Track D (Assistant) → benefits from Track A's recommendation quality
  Track E (Moderation) → benefits from Track A's bias detection patterns
```

---

## Capability Readiness Dashboard

| Capability | Status | Blocks | Ready By |
|---|---|---|---|
| C1 NLU | **Built** (Session 22) | M22, M23, M24, M25, M26 | Now |
| C2 Embeddings | **Built** (Session 22) | M22, M23, M25, M26 | Now |
| C3 Vector Store | **Built** (Session 22) | M22, M23, M25, M26 | Now |
| C4 RAG | **Built** (Session 22) | M22 | Now |
| C5 Moderation | **Built** (Session 22) | M24 | Now |
| C6 Sentiment | **Needs prompt template** | M25 | Week 1-2 |
| C7 Semantic Rank | **Needs hybrid scoring** | M23, M25, M26 | Week 1-2 |
| C8 Collab Filter | **Needs Python pipeline** | M23 | Week 3-5 |
| C9 Taste Profile | **Needs C8** | M23 | Week 5-6 |
| C10 Streaming | **Built** (Session 22) | M22 | Now |
| C11 Explainability | **Needs structured data mapping** | M22, M23, M26 | Week 1-2 |
| C12 Forecasting | **Needs analytics aggregation** | M25 | Week 1-2 |
| C13 Fraud | **Not yet needed** | M24+ | Post-Phase 6 |
| C14 Memory | **Built** (Session 22) | M22 | Now |

**9 of 14 capabilities are already built.** The remaining 5 require 1-5 weeks of work each, all starting from built foundations.

---

*This graph is updated as new capabilities are built and as dependency relationships are discovered during implementation.*
