# Phase 6 Roadmap — AI & Platform Intelligence

**Status:** Planning  
**Date:** 2026-08-05  
**Target:** 8-12 weeks  
**Prerequisite:** Phase 5 RC3.1 GOLD Certified (88/100)  

---

## Overview

Phase 6 introduces five AI-powered capabilities that transform Playmorrow from a content platform into an intelligent game discovery and studio growth engine. Each milestone builds on previous work — M22 (Assistant) provides the LLM foundation, M23 (Recommendations) replaces Phase 5 static scorers with ML, M24 (Moderation) offloads human moderators, M25 (Studio Intelligence) gives creators data-driven insights, and M26 (Semantic Search) replaces tag-based filtering with natural language understanding.

**Total estimated effort:** ~28 weeks of engineering work across 5 concurrent workstreams.

---

## M22 — AI Assistant

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Embed a contextual AI copilot across the platform |
| **Start week** | 1 |
| **Duration** | 6 weeks |
| **Complexity** | High |
| **Dependencies** | LLM API key (OpenAI or Anthropic), game embeddings (M26 feeds this) |

### Scope

**Player-side:**
- "Explain this game to me" — generates a natural-language summary of game description, devlogs, and community sentiment
- "Find me more like this" — routes to recommendation engine with the current game as query vector
- "What's new?" — summarizes recent devlogs and roadmap updates for followed games/studios
- Inline tooltips: hover over any game mechanic term auto-explains via LLM

**Studio-side:**
- Devlog draft assistant: given bullet points or a topic, generates a first-draft devlog post
- Analytics interpreter: "Why did my wishlists drop this week?" queries analytics service and explains trends
- Roadmap item generator: suggests roadmap items based on engine/genre benchmarks
- Page context-aware: the assistant knows which game page, dashboard, or editor the user is viewing

**Context awareness:**
- Assistant receives current page URL + type (game detail, studio dashboard, devlog editor, marketplace)
- Game pages: injects `gameId`, `studioId`, current `status`, `genres`, `tags`
- Dashboard pages: injects `studioId`, analytics snapshot, pending moderation items
- Devlog editor: injects current draft content, game metadata, previous devlogs

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend                                          │
│  ┌─────────────┐   ┌──────────────┐               │
│  │ ChatWidget  │   │ InlineTooltip│               │
│  └──────┬──────┘   └──────┬───────┘               │
│         │                 │                         │
│  ┌──────┴─────────────────┴───────┐                │
│  │       useAssistant() hook      │                │
│  │   (TanStack Query + SSE)       │                │
│  └──────────────┬─────────────────┘                │
└─────────────────┼──────────────────────────────────┘
                  │ SSE stream
┌─────────────────┼──────────────────────────────────┐
│  API            │                                  │
│  ┌──────────────┴──────────────┐                   │
│  │  AiChatController           │                   │
│  │  POST /api/ai/chat          │                   │
│  │  (SSE streaming response)   │                   │
│  └──────────────┬──────────────┘                   │
│                 │                                   │
│  ┌──────────────┴──────────────┐                   │
│  │  AiChatService              │                   │
│  │  - Context assembly         │                   │
│  │  - RAG retrieval            │                   │
│  │  - Prompt construction      │                   │
│  │  - Streaming to client      │                   │
│  └──────┬──────────────┬───────┘                   │
│         │              │                            │
│  ┌──────┴──────┐ ┌─────┴─────────┐                │
│  │ AIProvider  │ │ VectorStore   │                │
│  │ (abstraction│ │ (pgvector)    │                │
│  │  layer)     │ │               │                │
│  └─────────────┘ └───────────────┘                │
└────────────────────────────────────────────────────┘
```

### Implementation Plan

| Week | Tasks |
|------|-------|
| 1 | Provider abstraction (AIModule, AIProvider interface, OpenAIProvider, AnthropicProvider), env var config (`AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`) |
| 2 | RAG pipeline: game description embeddings, chunking strategy, pgvector similarity search, context assembly function |
| 3 | ChatWidget React component, SSE client hook, streaming Markdown renderer, context-awareness injection |
| 4 | Player-side features: explain-game, find-similar, whats-new summaries, inline tooltips |
| 5 | Studio-side features: devlog draft assistant, analytics interpreter, roadmap suggester |
| 6 | Polish: error states, loading skeletons, rate limiting (10 req/min on AI endpoints), audit logging, feature flags |

### Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily active assistant users | 15% of DAU by week 8 | Analytics event on chat open |
| Assistant-driven game discoveries | 8% of all game views | `source: "ai_assistant"` on GameView |
| Devlog drafts accepted | 25% of assistant-generated drafts | Compare `assistantDraft: true` vs published |
| Chat satisfaction rate | 80% thumbs-up | Inline feedback buttons per response |
| Support ticket reduction | 40% fewer "I can't find games" tickets | SupportDepartment.GENERAL ticket count |

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| LLM cost at scale ($0.01-0.05/request) | High | Cache frequent queries (TTL 1h), short-context mode for tooltips, token budget per request (max 2048), cost monitoring dashboard |
| Hallucination of game facts | High | Ground all responses in RAG-retrieved game data, display "Sources" citations, disclaimer: "AI-generated, verify with studio" |
| Latency on streaming (2-5s for full response) | Medium | Progressive rendering (stream tokens), skeleton UI, "thinking" indicator, cancel button |
| Prompt injection attacks | Medium | Input sanitization, system prompt hardening, output filtering |
| Provider lock-in | Low | Provider abstraction layer — swap OpenAI/Anthropic via env var, zero code changes |

### Future Extensions
- Voice assistant (Web Speech API → LLM → TTS)
- Multi-language (auto-detect user locale, respond in their language)
- Agentic workflows (multi-step: "Plan my indie game launch" → queries games, marketplace, events)
- Proactive suggestions ("You haven't checked on your wishlisted game in 2 weeks")

---

## M23 — Recommendation Engine

| Attribute | Detail |
|-----------|--------|
| **Purpose** | ML-based personalized recommendations replacing static scorers |
| **Start week** | 1 |
| **Duration** | 8 weeks |
| **Complexity** | Very High |
| **Dependencies** | Game embeddings (M26), user interaction history, A/B testing framework |

### Scope

Replace the current `RecommendationsModule` (which uses 8 static heuristic scorers — `TagSimilarityScorer`, `FollowBasedScorer`, `TrendingScorer`, `WishlistSimilarityScorer`, `InteractionHistoryScorer`, `HiddenGemsScorer`, `SimilarStudiosScorer`, `RecentlyUpdatedScorer`, `LatestReleasesScorer`) with an ML-based pipeline:

- **Collaborative filtering:** Collaborative filtering trained on user-game interactions (follows, wishlists, reactions, views, comments)
- **Content-based:** Embedding similarity of game descriptions, tags, and community reviews
- **Hybrid ranking:** Weighted combination of collaborative signal + content similarity + freshness decay
- **Cold-start fallback:** New users get trending/popular until interaction data accumulates
- **Explainability:** "Because you liked {game}" and "Players who followed {game} also follow..."

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Offline Pipeline (runs nightly via @Cron)              │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐  ┌───────────────┐│
│  │ Feature      │   │ Model        │  │ Embedding     ││
│  │ Engineering  │──▶│ Training     │─▶│ Store         ││
│  │              │   │              │  │ (pgvector)    ││
│  │ - User-game  │   │ - ALS matrix │  │               ││
│  │   matrix     │   │   factorization│ │ fresh daily  ││
│  │ - Game       │   │ - Game       │  │               ││
│  │   embeddings │   │   embeddings │  │               ││
│  └──────────────┘   └──────────────┘  └───────────────┘│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Online Inference (real-time, per-request)              │
│                                                         │
│  GET /api/ai/recommendations?userId=X&gameId=Y&limit=20│
│                                                         │
│  ┌──────────────┐   ┌──────────────┐  ┌───────────────┐│
│  │ Candidate    │   │ Scoring      │  │ Re-Ranking    ││
│  │ Generation   │──▶│ Layer        │─▶│ + Diversity   ││
│  │              │   │              │  │               ││
│  │ - Collaborative│ │ - Score =    │  │ - MMR for     ││
│  │   pool       │   │   0.4*collab │  │   diversity   ││
│  │ - Content    │   │ + 0.3*content│  │ - Freshness   ││
│  │   pool       │   │ + 0.2*fresh  │  │   boost       ││
│  │ - Trending   │   │ + 0.1*trend  │  │ - Dedupe vs   ││
│  │              │   │              │  │   viewed      ││
│  └──────────────┘   └──────────────┘  └───────────────┘│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  A/B Testing Framework                                  │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐  ┌───────────────┐│
│  │ Bucketing    │   │ Variant      │  │ Metrics       ││
│  │ (userId hash)│──▶│ Assignment   │──▶│ Collection    ││
│  │              │   │              │  │               ││
│  │ A: ML model  │   │ /api/ai/     │  │ CTR,          ││
│  │ B: static    │   │recommendations│  │ conversion,   ││
│  │   scorers    │   │(variant via  │  │ time-to-      ││
│  │              │   │ header)      │  │ wishlist      ││
│  └──────────────┘   └──────────────┘  └───────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Implementation Plan

| Week | Tasks |
|------|-------|
| 1 | Data pipeline: extract user-game interaction matrix from Prisma (Follow, WishlistItem, Reaction, Comment, GameView), export to Parquet for offline training |
| 2 | Game embeddings: use M26 embeddings to create content vectors, store in pgvector, build content-based candidate pool |
| 3 | Collaborative filtering: implement ALS (Alternating Least Squares) matrix factorization in Python (offline job), generate user/game latent vectors |
| 4 | Hybrid scoring layer: combine collaborative + content + freshness scores, implement in NestJS recommendation service |
| 5 | A/B testing framework: bucket assignment (consistent hash on userId), variant header, metrics instrumentation |
| 6 | Cold-start fallback: trending/popular for new users, genre-based for new games, gradual phase-in of collaborative signal |
| 7 | Online inference endpoint: `GET /api/ai/recommendations` with caching (5-min TTL), batch pre-computation for top users |
| 8 | Evaluation: offline metrics (precision@K, recall@K, NDCG), online A/B results, hyperparameter tuning |

### Migration from Phase 5 Scorers

Current 8 static scorers (`apps/api/src/recommendations/scorers/`) become fallback variant in A/B testing. They will be deprecated once the ML model shows statistically significant improvement (p < 0.05) on:
- CTR from recommendation feed
- Wishlist conversion from recommendations
- Discovery of games outside user's usual genres (serendipity)

### Metrics

| Metric | Target | Current Baseline |
|--------|--------|------------------|
| Recommendation CTR | +35% over static scorers | Static scorer CTR (measure week 1) |
| Wishlist conversion | +20% from recommendations | Static scorer conversion |
| Diversity score (unique genres shown) | +30% | Static scorer diversity |
| Serendipity (games found outside top 50) | +25% | Static scorer serendipity |
| Cold-start satisfaction | <2 days to first relevant rec | ~7 days with scorers |

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Cold start for new users | High | Trending/popular fallback, onboarding survey ("pick 3 games you like") |
| Training data quality / sparsity | High | Implicit feedback weighting (view=1, like=2, follow=3, wishlist=5), matrix regularization |
| Model drift (user preferences change) | Medium | Weekly retraining, online evaluation metrics with alerts |
| Python dependency in NestJS stack | Medium | Offline jobs run as separate Docker container (Python), NestJS only consumes inference outputs (stored in pgvector + JSON columns) |
| Computational cost | Low | Matrix factorization on <100K users is cheap (<$10/month), pgvector similarity search is indexed |

### Future Extensions
- Multi-modal recommendations (use screenshot embeddings alongside text)
- Real-time learning (update user vector after each interaction)
- Reinforcement learning (optimize for long-term engagement, not just CTR)
- Social graph recommendations ("friends of friends like...")

---

## M24 — AI Moderation

| Attribute | Detail |
|-----------|--------|
| **Purpose** | ML-assisted content moderation to augment human moderators |
| **Start week** | 1 |
| **Duration** | 4 weeks |
| **Complexity** | Medium |
| **Dependencies** | Existing ModerationModule + ModerationReport model, LLM API |

### Scope

Extend the existing `ModerationModule` (`apps/api/src/moderation/`) which currently uses rule-based `SpamDetectionService` and manual `EscalationService` with ML models:

- **Toxicity detection:** Classify comments, devlogs, and reviews as toxic/non-toxic with confidence score
- **Spam detection:** ML classifier replacing current regex-based `SpamDetectionService`
- **Review quality scoring:** Detect low-effort reviews ("great game" vs substantive)
- **Automated triage:** High-confidence toxic → auto-flag, low-confidence → human review queue
- **False-positive appeals:** Users can appeal auto-moderation decisions

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Content Created (comment, devlog, review, game update)    │
└────────────────────────┬───────────────────────────────────┘
                         │ EventBus: CONTENT_CREATED
                         ▼
┌────────────────────────────────────────────────────────────┐
│  ModerationPipeline                                       │
│                                                           │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────┐ │
│  │ Toxicity     │   │ Spam         │   │ Quality       │ │
│  │ Classifier   │──▶│ Classifier   │──▶│ Scorer        │ │
│  │              │   │              │   │               │ │
│  │ Score: 0-1   │   │ Score: 0-1   │   │ Score: 0-1    │ │
│  └──────┬───────┘   └──────┬───────┘   └──────┬────────┘ │
│         │                  │                   │          │
│         └──────────────────┴───────────────────┘          │
│                            │                              │
│                    ┌───────┴────────┐                     │
│                    │  Triage Logic  │                     │
│                    └───┬────────┬───┘                     │
│                        │        │                          │
│               Score > 0.9   Score 0.5-0.9                 │
│                        │        │                          │
│                        ▼        ▼                          │
│              ┌──────────┐ ┌───────────┐                   │
│              │ Auto-flag│ │ Human     │                   │
│              │ + hide   │ │ Review    │                   │
│              │ content  │ │ Queue     │                   │
│              └──────────┘ └───────────┘                   │
└────────────────────────────────────────────────────────────┘
```

### Implementation Plan

| Week | Tasks |
|------|-------|
| 1 | Train toxicity classifier: fine-tune on Jigsaw + game-specific labeled data from existing ModerationReports, export model to ONNX or call LLM API with moderation endpoint |
| 2 | Integration: wire `ModerationPipeline` into `CONTENT_CREATED` EventBus event, build human review queue UI in staff dashboard |
| 3 | Edge case handling: sarcasm, game-specific jargon ("kill the boss" ≠ violence), multilingual (EN first, ES/PT/FR in Phase 7), cultural context |
| 4 | Appeals system: flagged users can appeal with explanation, human moderator reviews, appeal success rate tracked as model quality metric |

### Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| False positive rate | <2% | Appeals upheld / total auto-flags |
| Spam caught before user reports | >80% | Spam auto-flag count vs spam reports |
| Moderation time-to-resolution | 60% reduction | Median time from report to resolution |
| User reports per day | 50% reduction | ModerationReport count with ReportReason.SPAM/HARASSMENT |
| Human moderator workload | 70% of decisions automated | Auto-resolved / total moderation actions |

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| False positives blocking legitimate content | High | Human-in-the-loop for 0.5-0.9 confidence, appeals system, never auto-delete — only auto-hide pending review |
| Cultural context misinterpretation | Medium | Game-specific language whitelist, community guidelines context in prompt, per-language models in future |
| Adversarial content (intentional misspellings) | Medium | Text normalization step before classification, continuous retraining on flagged content |
| LLM moderation API cost | Low | Batch moderation for non-urgent content, cache results, use smaller/cheaper model for high-confidence cases |

### Future Extensions
- Multi-language moderation (auto-detect language, route to language-specific classifier)
- Image moderation (screenshot/content moderation via vision models)
- Voice chat moderation (when voice chat feature is added)
- Predictive moderation (flag users likely to post toxic content based on history)

---

## M25 — Studio Intelligence

| Attribute | Detail |
|-----------|--------|
| **Purpose** | AI-powered analytics and insights for studio owners |
| **Start week** | 3 |
| **Duration** | 6 weeks |
| **Complexity** | High |
| **Dependencies** | AnalyticsModule data pipeline, historical game performance, LLM API, M26 game embeddings |

### Scope

Leverage the existing `AnalyticsModule` (`apps/api/src/analytics/`) which already tracks events via `AnalyticsEvent` and aggregates via `AnalyticsDailyAggregate`, plus `StudioHealthScore` snapshots, to provide AI-generated insights:

- **Store page optimization:** Analyzes game description, tags, screenshots against top-performing games in same genre, suggests improvements
- **Wishlist prediction:** ML model predicts wishlist trajectory based on current velocity + comparable games
- **Sentiment analysis:** Aggregates comment/reaction sentiment per devlog, per week, per game
- **Launch readiness scoring:** Composite score (0-100) based on followers, wishlists, devlog frequency, community engagement, press kit completeness
- **Devlog topic suggestions:** Analyzes which devlog topics correlate with wishlist spikes, suggests high-impact topics
- **Competition benchmarking:** How does this game compare to similar games at same development stage?

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Batch Analytics Jobs (nightly cron)                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Store Page   │  │ Wishlist     │  │ Sentiment    │          │
│  │ Analyzer     │  │ Predictor    │  │ Analyzer     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┴──────────────────┘                   │
│                           │                                     │
│                    ┌──────┴──────────┐                          │
│                    │  Insight Cards   │                          │
│                    │  (pre-computed)  │                          │
│                    └──────┬──────────┘                          │
└───────────────────────────┼─────────────────────────────────────┘
                            │ stored in StudioInsight model
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  GET /api/ai/insights/:studioId                                 │
│                                                                 │
│  Returns:                                                       │
│  {                                                              │
│    insights: [                                                  │
│      {                                                          │
│        id, type: "store_page", severity: "high",                │
│        title: "Your store page is missing key genre tags",      │
│        body: "Games with 'RPG' and 'Open World' tags see...",   │
│        suggestion: "Add 'RPG' and 'Open World' to your tags",   │
│        action: { label: "Edit Tags", url: "/dashboard/..." },   │
│        confidence: 0.92                                         │
│      },                                                         │
│      ...                                                        │
│    ]                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

### StudioInsight Model (new)

```prisma
model StudioInsight {
  id          String   @id @default(cuid())
  studioId    String
  type        String   // store_page, wishlist, sentiment, launch_ready, devlog_topic, competition
  severity    String   // low, medium, high, critical
  title       String
  body        String
  suggestion  String?
  actionLabel String?
  actionUrl   String?
  confidence  Float
  metadata    Json?
  dismissedAt DateTime?
  actedAt     DateTime?
  createdAt   DateTime @default(now())

  @@index([studioId, type])
  @@index([studioId, createdAt])
  @@map("studio_insights")
}
```

### Implementation Plan

| Week | Tasks |
|------|-------|
| 3 | Analytics data prep: aggregate AnalyticsEvent into training features, build game comparison clusters using M26 embeddings |
| 4 | Store page analyzer: compare game metadata (tags, description length, screenshot count, price) against genre benchmarks, generate LLM suggestions |
| 5 | Wishlist predictor: time-series model (ARIMA or Prophet) on wishlist velocity, comparable game trajectory matching, confidence intervals |
| 6 | Sentiment analyzer: aggregate per-devlog Reaction distribution, per-month sentiment trend, generate natural-language summary via LLM |
| 7 | Launch readiness scoring: weighted composite (followers 25%, wishlists 25%, devlog frequency 20%, community engagement 20%, press kit completeness 10%) |
| 8 | Dashboard widgets: InsightCard React component, insight feed in studio dashboard, action buttons, dismiss/act tracking |

### Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Studios publishing more frequently | +30% | Devlogs per studio per month |
| Store page conversion improvement | +25% | Views → wishlist conversion rate |
| Insight cards viewed | >50% of active studios | `StudioInsight.viewedAt` |
| Actions taken from insights | >20% of viewed insights | `StudioInsight.actedAt` set |
| Studio retention rate | +15% month-over-month | Studios with >=1 action in last 30 days |

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Inaccurate predictions damaging credibility | High | Show confidence intervals, label as "estimate" not "forecast", never show single-number predictions without range |
| Data privacy between studios | High | Insights only use own studio data + anonymized genre benchmarks (min 5 studios per benchmark), never expose individual competitor data |
| Analysis paralysis (too many insights) | Medium | Cap at 5 active insights per studio, severity-based prioritization, auto-dismiss low-severity after 30 days |
| LLM-generated text quality | Medium | Human review spot-checks for first month, feedback loop (thumbs up/down on insights) |

### Future Extensions
- Revenue forecasting (when payments scale)
- Marketing spend optimization (ROI prediction per channel)
- Team composition recommendations ("Studios your size typically have 2 artists")
- Market gap analysis ("No farming sim on Nintendo Switch in your region")

---

## M26 — Semantic Search

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Natural language game search replacing tag-based filtering |
| **Start week** | 3 |
| **Duration** | 6 weeks |
| **Complexity** | High |
| **Dependencies** | Game embeddings (feeds M22 and M23 as well), pgvector extension on Neon, existing SearchModule |

### Scope

Extend the existing `SearchModule` (`apps/api/src/search/`) which currently does keyword-based search via Prisma `contains` on game titles and descriptions, with:

- **Natural language queries:** "Find me a cozy farming game with romance options" → returns Stardew Valley-like games
- **Emotion-based search:** "Games that feel melancholy" or "Exciting multiplayer games"
- **Mechanic-based search:** "Roguelike with base building"
- **Cross-language search:** Query in Portuguese, find games with English descriptions
- **Hybrid search:** Combine semantic similarity with keyword match + popularity boost
- **Search filters as post-processing:** Genre, platform, price, status filters applied after semantic ranking

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Embedding Generation Pipeline (initial + incremental)          │
│                                                                 │
│  ┌──────────────────┐     ┌──────────────────┐                 │
│  │  Game Text        │     │  Embedding       │                 │
│  │  Assembly         │────▶│  Generation      │                 │
│  │                   │     │                   │                │
│  │  - title          │     │  AIProvider       │                │
│  │  - description    │     │  .embed(text)     │                │
│  │  - tagline        │     │  → float[1536]    │                │
│  │  - genres         │     │                   │                │
│  │  - tags           │     │  Stored in        │                │
│  │  - aggregate      │     │  game_embeddings  │                │
│  │    review text     │     │  (pgvector)       │                │
│  │  - mode labels    │     │                   │                │
│  └──────────────────┘     └──────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Search Query Flow                                              │
│                                                                 │
│  GET /api/ai/search?q=cozy+farming+with+romance&limit=20        │
│                                                                 │
│  ┌──────────────────┐                                           │
│  │  Query           │                                           │
│  │  Embedding       │ AIProvider.embed(query)                   │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │  Hybrid Search   │  0.6 * semantic_similarity                │
│  │  Scoring         │ + 0.3 * keyword_match (bm25)              │
│  │                   │ + 0.1 * popularity_score                  │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │  Re-Ranking      │  Cross-encoder for top 100 candidates     │
│  │                   │  → final ranking                          │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │  Filter Layer    │  Apply genre, platform, price, status     │
│  │                   │  filters (post-processing)               │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │  Response        │  Return games + similarity scores         │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

### GameEmbedding model (new)

```prisma
model GameEmbedding {
  gameId    String @id
  embedding Unsupported("vector(1536)")
  version   Int    @default(1)
  updatedAt DateTime @updatedAt

  game Game @relation(fields: [gameId], references: [id], onDelete: Cascade)

  @@map("game_embeddings")
}
```

### Database Migration

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE game_embeddings (
  game_id TEXT PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
  embedding vector(1536),
  version INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON game_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Implementation Plan

| Week | Tasks |
|------|-------|
| 3 | Embedding pipeline: game text assembly function, batch generate embeddings for all published games, store in pgvector, set up incremental update trigger via EventBus `GAME_UPDATED` |
| 4 | Hybrid search index: pgvector `ivfflat` index, BM25 keyword index (using PostgreSQL `tsvector`), combined scoring function |
| 5 | Re-ranking layer: cross-encoder model for top-K candidates, query intent classification (genre-seeking, mechanic-seeking, mood-seeking) |
| 6 | Migration: gradual rollout of semantic search (A/B vs current keyword), filter layer, deprecation of pure-keyword endpoint |

### Migration from Current Search

The current `SearchModule` remains as fallback. New `GET /api/ai/search` endpoints coexist with existing `/api/search`. After 4 weeks of A/B testing:
- If semantic search shows <5% zero-result rate (current baseline TBD) → deprecate keyword endpoint
- If semantic search CTR exceeds keyword → make default
- Always keep keyword fallback for exact title matches

### Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Zero-result search rate | 50% reduction | Search queries with 0 results |
| Search-to-click rate | +25% | Queries with >=1 click |
| Search-to-wishlist conversion | +40% | WishlistItem created from search result |
| Query understanding accuracy | >85% | Manually evaluated sample (weekly) |
| Search latency | <200ms p95 | API response time |

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Embedding quality for niche genres | High | Fine-tune embeddings on game-domain corpus (IGDB, Steam descriptions), test against curated query set |
| Multi-language support | Medium | Multilingual embedding model (e.g., `text-embedding-3-large`), cross-language benchmarks |
| Index freshness (new games not searchable) | Medium | EventBus `GAME_PUBLISHED` triggers immediate embedding, health check alerts if stale >24h |
| pgvector index size and performance | Low | IVF index with appropriate lists, monitor query times, plan for HNSW index upgrade at >10K games |
| Embedding API cost | Low | Batch generate, cache query embeddings (same query → same embedding), compute once store forever |

### Future Extensions
- Voice search ("Hey Playmorrow, find me...")
- Image-based search (upload a screenshot → find visually similar games)
- Personalized search ranking (boost based on user's interaction history)
- Faceted semantic search (natural language + filters combined seamlessly)

---

## Timeline

| Week | M22 — AI Assistant | M23 — Recommendation Engine | M24 — AI Moderation | M25 — Studio Intelligence | M26 — Semantic Search |
|------|-------------------|-----------------------------|---------------------|--------------------------|----------------------|
| 1 | Provider abstraction | Data pipeline | Toxicity model training | — | — |
| 2 | RAG pipeline | Game embeddings | Moderation pipeline integration | — | — |
| 3 | ChatWidget UI | Collaborative filtering | Edge case handling | Analytics data prep | Embedding pipeline |
| 4 | Player features | Hybrid scoring | Appeals system | Store page analyzer | Hybrid search index |
| 5 | Studio features | A/B framework | — | Wishlist predictor | Re-ranking layer |
| 6 | Polish + launch | Cold-start fallback | — | Sentiment + launch score | Migration + A/B test |
| 7 | — | Online inference | — | Dashboard widgets | — |
| 8 | — | Evaluation + launch | — | Polish + launch | — |

---

## Shared Infrastructure

These components are built once and shared across milestones:

| Component | Used By | Build Week |
|-----------|---------|------------|
| AIModule + AIProvider abstraction | M22, M24, M25 | 1 |
| pgvector extension + GameEmbedding model | M22, M23, M26 | 2 |
| RAG pipeline (game context retrieval) | M22, M26 | 2 |
| A/B testing framework | M23, M25 | 5 |
| AI endpoint rate limiting (10 req/min) | All | 6 |
| AI audit logging (source model + timestamp) | All | 6 |

---

## Quality Gates

Each milestone must pass before being marked complete:

| Gate | Criteria |
|------|----------|
| TypeScript | 0 errors in `tsc --noEmit` |
| ESLint | 0 errors |
| Tests | Minimum 80% coverage on new AI modules |
| Production smoke | AI endpoints return 200 with valid API key |
| Rate limiting | Verified 10 req/min enforced, 429 returned on excess |
| Audit logging | All AI responses logged with model + latency |
| A/B validation | (M23, M26 only) Statistically significant improvement over baseline |

---

## Cost Estimate

| Resource | Monthly Estimate | Notes |
|----------|-----------------|-------|
| LLM API (OpenAI GPT-4o-mini / Claude Haiku) | $200-500 | ~50K requests/month for assistant + moderation + insights |
| Embedding API (text-embedding-3-small) | $20-50 | ~20K embeddings for all games + queries |
| pgvector compute | $0 | Runs on existing Neon PostgreSQL |
| Offline training compute (Python) | $30-80 | Fly.io machine, runs 2h/night |
| **Total monthly** | **$250-630** | At scale; initial weeks ~$100 |

---

## Dependencies on Other Phases

| Dependency | Status | Resolution |
|------------|--------|------------|
| Phase 5 critical bugs (TD-01 through TD-04) | Fixed (Session 19) | ✅ Resolved |
| Phase 5 test coverage | 6/6 modules tested (Session 19) | ✅ Resolved |
| Phase 5 EventBus integration | Wired into MarketplaceService (Session 19) | ✅ Resolved |
| Stripe test mode stable | Needs verification | Verify before M22 week 1 |
| CI pipeline (Vitest + E2E) | Green | ✅ |
| Sentry error monitoring | Live in production | ✅ |

---

## Rollback Strategy

Each milestone is independently deployable and reversible:

1. **Feature flags:** All AI features behind `AI_ASSISTANT_ENABLED`, `ML_RECOMMENDATIONS_ENABLED`, etc. env vars — toggle off without deploy
2. **Graceful degradation:** If LLM API is down, AI features show "temporarily unavailable" message, non-AI flows unaffected
3. **A/B testing:** ML recommendations run alongside static scorers — failback to static if ML errors
4. **Database:** New tables (game_embeddings, studio_insights) are additive — no schema changes to existing models
5. **Canary deployment:** AI features deploy to 5% of users first, monitor error rates for 24h before 100% rollout

---

## Success Criteria

Phase 6 is considered complete when:

1. All 5 milestones deployed to production behind feature flags
2. A/B test results for M23 and M26 show statistically significant improvement
3. M24 auto-moderation handles >70% of decisions without human intervention
4. M25 insights are viewed by >50% of active studios
5. M22 assistant has >15% DAU engagement
6. Zero AI-related P0 incidents in first 2 weeks
7. AI cost per DAU <$0.002
