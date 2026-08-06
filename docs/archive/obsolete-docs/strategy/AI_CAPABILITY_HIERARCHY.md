# Playmorrow AI — Capability Hierarchy

**Version:** 1.0
**Date:** 2026-08-05
**Status:** Active
**Purpose:** Defines the 4-layer AI product architecture. No capability without product. No product without value.

---

## Overview

Playmorrow AI is structured as a 4-layer hierarchy. Each layer depends on the layer below it and enables the layer above it. A capability in Layer 2 that never appears in a Layer 3 product should not exist. A Layer 3 product that delivers no measurable Layer 4 user experience should not ship.

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4 — User Experiences                                      │
│  How users interact with AI. The surface layer.                  │
│  "Because you like Hollow Knight" on recommendations.            │
│  AI-generated devlog draft in the editor.                        │
│  Toxicity warnings in comment threads.                           │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │  enables
                              │
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3 — Products                                              │
│  User-facing features built on capabilities. The feature layer.  │
│  AI Assistant, Smart Search Bar, Game Discovery Feed,            │
│  Studio Intelligence Dashboard, Moderation Queue.                │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │  enables
                              │
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2 — Capabilities                                          │
│  Reusable AI primitives. The functional layer.                   │
│  Semantic Search, Recommendation Engine, Content Moderation,     │
│  Sentiment Analysis, Text Generation, Summarization.             │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │  enables
                              │
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1 — Infrastructure                                        │
│  Foundation services used by all capabilities. The engine room.  │
│  Provider Abstraction, Embedding Service, Vector Store,          │
│  Streaming Service, Prompt Registry, Conversation Memory.        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer 1 — Infrastructure

Foundation services. Built once, used by every capability above. No user-facing behavior lives here — only plumbing.

### 1. Provider Abstraction (`AIProvider`)

| Attribute | Detail |
|---|---|
| **What** | Interface abstracting LLM providers (OpenAI, Anthropic, future) behind a single contract: `chat()`, `chatStream()`, `embed()`, `moderate()` |
| **Implementation** | `apps/api/src/ai/providers/` — OpenAIProvider, AnthropicProvider, ProviderFactory |
| **Config** | `AI_PROVIDER` env var selects active provider. Zero code changes to swap |
| **Used by** | Every Layer 2 capability that calls an LLM |

**Relationship to other layers:** Layer 2 capabilities inject `AIProvider` — they never call OpenAI or Anthropic directly. This means adding a new provider (e.g., Mistral, local Llama) requires updating one factory, not every capability.

**Example:** When `SentimentAnalysis` needs to classify a comment, it calls `this.ai.chat([...])`. Whether the response comes from GPT-4o-mini or Claude Haiku is transparent.

### 2. Embedding Service (`EmbeddingProvider`)

| Attribute | Detail |
|---|---|
| **What** | Generates vector embeddings for text (game descriptions, user queries, devlog content). Cached with TTL. |
| **Implementation** | `apps/api/src/ai/services/embedding.service.ts` |
| **Dimensions** | 1536 (text-embedding-3-small) or configurable |
| **Used by** | Semantic Search, Recommendation Engine, RAG pipeline |

**Relationship to other layers:** Embeddings are the bridge between natural language (Layer 4) and vector mathematics (Layer 1). A player types "cozy farming game with romance" in the search bar (Layer 4). The Smart Search Bar product (Layer 3) calls Semantic Search (Layer 2), which calls `EmbeddingProvider.embed("cozy farming game with romance")` (Layer 1) and compares against pre-computed game embeddings in the Vector Store (Layer 1).

**Example:** `EmbeddingService.generateGameEmbedding("game-123")` builds a text representation of the game's title, description, tagline, genres, and tags, generates a 1536-dimensional vector, and stores it in pgvector.

### 3. Vector Store (`pgvector`)

| Attribute | Detail |
|---|---|
| **What** | PostgreSQL extension for vector similarity search. Stores game embeddings, user embeddings, and content embeddings. |
| **Implementation** | `apps/api/src/ai/interfaces/vector-store.interface.ts` — PgVectorStore adapter |
| **Indexes** | IVF (Inverted File) with cosine distance operator (`<=>`) |
| **Tables** | `game_embeddings`, `user_embeddings` |
| **Used by** | Semantic Search, Recommendation Engine, RAG pipeline, Similarity-based discovery |

**Relationship to other layers:** Every Layer 2 capability that involves "find similar X" queries the Vector Store. It is the memory of the AI system — every embedding ever computed lives here, indexed and queryable in milliseconds.

**Example:** A user searches "fast-paced roguelike under $15" — the search pipeline generates a query embedding, runs `ORDER BY embedding <=> $queryEmbedding LIMIT 20` against `game_embeddings`, and returns the 20 most similar games.

### 4. Streaming Service (SSE)

| Attribute | Detail |
|---|---|
| **What** | Server-Sent Events infrastructure for streaming LLM responses token-by-token to the frontend. |
| **Implementation** | `apps/api/src/ai/streaming/` |
| **Used by** | AI Assistant (chat), AI-generated devlog drafts |

**Relationship to other layers:** Streaming is purely an infrastructure concern — it delivers tokens from the LLM provider to the browser. Layer 3 products (AI Assistant) use streaming to provide a real-time typing effect. Layer 4 experiences (the ChatWidget UI) animate tokens as they arrive.

**Example:** A studio opens the devlog editor and clicks "Generate Draft" (Layer 4). The Studio Intelligence Dashboard product (Layer 3) calls Text Generation capability (Layer 2), which calls `AIProvider.chatStream()` (Layer 1). Tokens stream through SSE to the browser, rendering progressively in the Markdown editor.

### 5. Prompt Registry

| Attribute | Detail |
|---|---|
| **What** | Versioned template system for all AI prompts. Centralizes prompt management — no hardcoded prompt strings in capability code. |
| **Implementation** | `apps/api/src/ai/prompts/` |
| **Templates** | 8+ built-in: `game-explain`, `devlog-draft`, `store-analyze`, `sentiment-summary`, `review-cluster`, `wishlist-forecast`, `search-intent`, `moderation-classify` |
| **Used by** | Every Layer 2 capability that calls an LLM |

**Relationship to other layers:** Capabilities reference prompts by name, not by string. Prompt improvements (better wording, more context, updated examples) are made in the registry without touching capability code. This separates the "what" (Layer 2 logic) from the "how" (Layer 1 prompt engineering).

**Example:** The `SentimentAnalyzer` capability calls `promptRegistry.render('sentiment-summary', { reviews, gameTitle })`. If the sentiment prompt is improved to handle sarcasm better, the capability code changes zero lines.

### 6. Conversation Memory

| Attribute | Detail |
|---|---|
| **What** | Session-based conversation history with automatic summarization for long conversations. |
| **Implementation** | `apps/api/src/ai/memory/` |
| **Features** | Sliding window (last N messages), automatic summarization when context exceeds token budget, GDPR deletion (`deleteUserMemory`) |
| **Used by** | AI Assistant (chat context), Devlog Draft (editing iterations) |

**Relationship to other layers:** Conversation memory enables multi-turn interactions in Layer 3 products. Without it, the AI Assistant would have amnesia — every message would be treated as a fresh conversation with no context.

**Example:** A player asks "Find me a game like Stardew Valley" (turn 1). The assistant returns 3 recommendations. The player says "I don't like pixel art, show me 3D ones" (turn 2). Memory injects the full conversation history into the prompt, so the assistant knows "it" refers to the 3 recommendations from turn 1.

### 7. AIMetricsService

| Attribute | Detail |
|---|---|
| **What** | Observability layer tracking cost, latency, token usage, and success rates per provider, per model, per endpoint. |
| **Implementation** | `apps/api/src/ai/observability/` |
| **Metrics** | Cost estimation ($), latency (ms), token count (prompt + completion), success/failure, moderation flags |
| **Database** | `ai_audit_logs` table and `ai_metrics` table |
| **Used by** | Every Layer 2 capability (wrapped around all AI calls) |

**Relationship to other layers:** Metrics are orthogonal — they wrap around every AI call at every layer. This enables cost monitoring (is GPT-4o-mini worth 3x the cost of Claude Haiku for sentiment analysis?), latency alerting (is the embedding service slowed down?), and billing attribution (which feature cost $200 this month?).

**Example:** After a chat completion, `AIMetricsService` records: `{ endpoint: 'chat', provider: 'openai', model: 'gpt-4o-mini', promptTokens: 450, completionTokens: 200, latencyMs: 1200, cost: $0.0012 }`.

### 8. Feature Flag System

| Attribute | Detail |
|---|---|
| **What** | Environment-variable-based feature flags for all AI capabilities and products. |
| **Implementation** | `apps/api/src/ai/config/` and `AiFeatureGuard` |
| **Flags** | `AI_FEATURE_ASSISTANT`, `AI_FEATURE_RECOMMENDATIONS`, `AI_FEATURE_MODERATION`, `AI_FEATURE_INSIGHTS`, `AI_FEATURE_SEARCH` |
| **Used by** | Every Layer 3 product (gates availability) |

**Relationship to other layers:** Feature flags operate at the product layer (Layer 3) but are infrastructure (Layer 1) because they control deployment, not functionality. A product toggled off at the flag level returns a 503 with a graceful message — no capability code changes.

**Example:** Semantic Search (M26) is deployed to production behind `AI_FEATURE_SEARCH=false`. The code is live, the index is built, but the endpoint returns 503. When the flag is toggled to `true`, search is instantly available — no deploy, no restart.

---

## Layer 2 — Capabilities

Reusable AI primitives. These are the "verbs" of the AI system — they do one thing well and are composed by products (Layer 3). A capability that no product uses should not exist. A capability used by only one product is a smell — either the product should own it directly, or the capability should be generalized.

### Core Intelligence

#### Semantic Search

| Attribute | Detail |
|---|---|
| **What** | Convert natural language queries into vector embeddings and retrieve semantically similar games. Hybrid scoring via 0.6 semantic + 0.3 keyword (BM25) + 0.1 popularity. |
| **Depends on** | Embedding Service, Vector Store, Prompt Registry (query intent classification) |
| **Used by** | Smart Search Bar (M26), AI Assistant (M22 — "find me more like this"), Recommendation Engine candidate generation |
| **Milestone** | M26 |

**Example:** Query "3D platformer with a grappling hook and melancholic soundtrack" → query embedding → pgvector cosine similarity → top 20 games → cross-encoder re-ranking → final 20 with scores.

#### Recommendation Engine

| Attribute | Detail |
|---|---|
| **What** | Generate personalized game recommendations using collaborative filtering + content-based similarity + freshness decay. |
| **Depends on** | Embedding Service, Vector Store, AnalyticsModule (user interaction data), user_embeddings |
| **Used by** | Personalized Feed (M23), Game Discovery Feed, "Games Like This" section, Homepage "For You" row |
| **Milestone** | M23 |

**Example:** User 42's interaction matrix (follows, wishlists, reactions, views) → ALS latent factors → cosine similarity against game vectors → scored candidates → MMR diversity re-ranking → personalized feed.

#### Natural Language Understanding

| Attribute | Detail |
|---|---|
| **What** | Parse player queries into structured intent: genre-seeking, mechanic-seeking, mood-seeking, price-seeking, or hybrid. Extract entities (genres, mechanics, price ranges, emotions). |
| **Depends on** | AIProvider, Prompt Registry (query-intent template) |
| **Used by** | Smart Search Bar (pre-processing), AI Assistant (routing), Emotional Discovery |
| **Milestone** | M26 |

**Example:** "Show me cozy farming games like Stardew Valley but shorter" → intent: `mood-seeking + genre-seeking + length-aware`. Entities: `{ genre: 'farming', mood: 'cozy', similarTo: 'Stardew Valley', maxLength: 'short' }`.

#### Text Generation

| Attribute | Detail |
|---|---|
| **What** | Generate coherent, context-aware text — devlog drafts, store page descriptions, roadmap item suggestions, bundle descriptions, playlist copy. |
| **Depends on** | AIProvider, Prompt Registry, Streaming Service, Conversation Memory |
| **Used by** | AI Assistant (devlog drafts), Studio Intelligence (store page suggestions), Playlist Generation |
| **Milestone** | M22 |

**Example:** Studio provides bullet points: "New enemy type, fire dungeon tileset, bug fixes on checkpoint system" → LLM expands into a 3-paragraph devlog draft with section headers, screenshots placeholders, and a call-to-action.

#### Summarization

| Attribute | Detail |
|---|---|
| **What** | Condense long content into concise summaries — review sentiment clusters, thread summaries, "What's New" feed digests, game description summaries. |
| **Depends on** | AIProvider, Prompt Registry |
| **Used by** | Review Summarization (player-side), Thread Summarization (community-side), "What's New" digest (AI Assistant), FAQ Generation |
| **Milestone** | M22 (What's New), M25 (Review Summarization) |

**Example:** 127 reviews → extracted themes: "Art style praised by 78% of reviewers. Checkpoint spacing criticized by 62%. Late-game difficulty spike mentioned in 41% of reviews." 3-sentence summary with percentages.

#### Classification

| Attribute | Detail |
|---|---|
| **What** | Assign content to categories — toxicity classification, spam detection, query intent classification, devlog topic classification, content type classification. |
| **Depends on** | AIProvider, Prompt Registry (classification templates) |
| **Used by** | Content Moderation (M24), Feed Ranking (content type), Devlog Optimization (topic classification), Fraud Detection |
| **Milestone** | M24 |

**Example:** Comment "this game sucks and the developer is a scammer" → toxicity classifier → `{ toxic: true, score: 0.87, categories: { harassment: 0.82, toxicity: 0.91 } }`. Above 0.85 threshold → auto-flag for review.

#### Sentiment Analysis

| Attribute | Detail |
|---|---|
| **What** | Analyze the emotional tone of text — positive, negative, neutral, with intensity. Track sentiment trends over time per game, per devlog, per studio. |
| **Depends on** | AIProvider, Prompt Registry |
| **Used by** | Studio Intelligence Dashboard (sentiment widgets), Store Page Analysis, Launch Readiness Score, Player Sentiment Analysis |
| **Milestone** | M25 |

**Example:** 500 comments across 12 devlogs → sentiment trend: "Sentiment has trended positive (+12%) since the combat rework devlog. 'Art style' is consistently the most positive theme. 'Difficulty balance' is the most polarizing."

#### Semantic Ranking

| Attribute | Detail |
|---|---|
| **What** | Rank a set of candidates by relevance to a user profile or query. Beyond pure similarity — incorporates freshness, diversity, popularity, and user preferences. |
| **Depends on** | Embedding Service, Vector Store, user_embeddings |
| **Used by** | Recommendations (re-ranking layer), Semantic Search (cross-encoder), Feed Ranking |
| **Milestone** | M23 |

**Example:** 200 candidate games → scored by: 0.35 collaborative signal + 0.25 content similarity + 0.15 freshness + 0.15 popularity + 0.10 diversity penalty (penalize same-genre saturation) → ranked top 20.

### Content Intelligence

#### Content Moderation

| Attribute | Detail |
|---|---|
| **What** | Classify content as toxic, spam, low-quality, or clean. Multi-model pipeline: toxicity check → spam check → quality score. Configurable thresholds per community. |
| **Depends on** | Classification, AIProvider.moderation() |
| **Used by** | Moderation Queue (M24), Auto-Flag Dashboard, Comment Filtering |
| **Milestone** | M24 |

**Example:** New comment posted → EventBus `CONTENT_CREATED` → moderation pipeline: toxicity=0.12 (safe), spam=0.04 (safe), quality=0.78 (good) → allowed through, no flag.

#### Store Page Optimization

| Attribute | Detail |
|---|---|
| **What** | Analyze a game's store page against genre benchmarks: tags completeness, description keyword density, screenshot quality/variety, overall score (0-100). Generate specific, actionable improvement suggestions. |
| **Depends on** | Text Generation, Sentiment Analysis, Embedding Service |
| **Used by** | Studio Intelligence Dashboard (M25), Launch Readiness Score |
| **Milestone** | M25 |

**Example:** Game-123 analyzed: "Your game is missing the 'Atmospheric' and 'Exploration' tags — metroidvanias with these tags average 34% more impressions. Add 3+ combat screenshots — 87% of top-performing action games show combat in their first 5 screenshots. Your description's keyword density for 'roguelike' is 40% below the genre average."

#### Gaming Taste Profile

| Attribute | Detail |
|---|---|
| **What** | Build a per-user taste vector from interaction history — genre affinity, mechanic preferences, mood preferences, price sensitivity, length preference, visual style preference. Updated incrementally. |
| **Depends on** | Embedding Service, AnalyticsModule |
| **Used by** | Recommendation Engine (cold-start / preference signal), Personalized Feed, "Because You Like" explanations |
| **Milestone** | M23 |

**Example:** User profile: `{ topGenres: ['Metroidvania', 'Roguelike'], topMechanics: ['Exploration', 'Parry system'], topMoods: ['Melancholic', 'Tense'], preferredLength: '10-30h', preferredPrice: '$10-20', visualStyle: ['Pixel art', 'Hand-drawn'] }`.

### Studio Intelligence

#### Wishlist Forecaster

| Attribute | Detail |
|---|---|
| **What** | Predict wishlist trajectory at launch based on current velocity, follower count, devlog engagement, and comparable game trajectories. Time-series model with confidence intervals. |
| **Depends on** | AnalyticsModule, Embedding Service (similar game matching) |
| **Used by** | Studio Intelligence Dashboard (M25), Launch Readiness Score |
| **Milestone** | M25 |

**Example:** "Based on your current growth rate (+12 wishlists/day) and 47 days until launch, projected launch-day wishlists: 2,100-2,800 (80% confidence). Similar games in your genre averaged 3,100 at launch. Recommendation: increase devlog frequency to 2x/week — studios at your stage publishing at that cadence see 40% higher wishlist growth."

#### Competitor Analysis

| Attribute | Detail |
|---|---|
| **What** | Compare a studio's game against similar games (same genre, price range, release status) across: wishlist growth, follower growth, review sentiment, review volume, devlog engagement, price stability. Show percentile rankings. |
| **Depends on** | Embedding Service, Sentiment Analysis, AnalyticsModule |
| **Used by** | Studio Intelligence Dashboard (M25) |
| **Milestone** | M25 |

**Example:** "Your wishlist growth rate is in the 73rd percentile for metroidvanias under $20. Your review volume is in the 31st percentile — consider a reviewer outreach campaign. Your follower-to-wishlist ratio (1:4.2) is above the 85th percentile — your audience is highly engaged, convert them."

#### Launch Readiness Scoring

| Attribute | Detail |
|---|---|
| **What** | Composite score (0-100) from: follower count (25%), wishlist count (25%), devlog consistency (20%), community engagement (20%), press kit completeness (10%). Each sub-score has minimum thresholds. |
| **Depends on** | Store Page Optimization, Wishlist Forecaster, Sentiment Analysis, AnalyticsModule |
| **Used by** | Studio Intelligence Dashboard (M25) |
| **Milestone** | M25 |

**Example:** "Launch Readiness: 72/100. ✅ Follower count above threshold (850/500). ✅ Wishlist count above threshold (2,100/1,000). ⚠️ Devlog consistency below target (1.2/week vs 2/week recommended). ⚠️ Press kit missing: gameplay trailer, press contact email."

### Marketplace Intelligence

#### Fraud Detection

| Attribute | Detail |
|---|---|
| **What** | Anomaly detection on marketplace listings and transactions — stolen assets (image hash comparison), duplicate listings (description similarity), suspicious pricing, buyer/seller behavior patterns, chargeback indicators. |
| **Depends on** | Classification, AnalyticsModule |
| **Used by** | Marketplace Fraud Detection (M27), Admin Dashboard, Transaction Monitoring |
| **Milestone** | M27 (future) |

**Example:** New listing: price $2 (90th percentile for category is $25), seller account created 3 hours ago, description 92% similar to existing listing → fraud score 0.89 → auto-flag for review.

#### Pricing Intelligence

| Attribute | Detail |
|---|---|
| **What** | Competitive pricing analysis — "Your pixel art tileset at $25 is in the 90th percentile for this category. The median for top-selling tilesets is $12." Informational, not prescriptive. |
| **Depends on** | AnalyticsModule |
| **Used by** | Pricing Intelligence panel (M27), Bundle Suggestions |
| **Milestone** | M27 (future) |

**Example:** "Games in your genre (Metroidvania) with similar review scores (85-90% positive) typically launch at $14.99. Your current listing is $19.99 — that's the 85th percentile for your category."

### Forecasting

| Attribute | Detail |
|---|---|
| **What** | Time-series prediction for any metric — wishlist growth, revenue trajectory, DAU trend, community growth. ARIMA/Prophet-style models. |
| **Depends on** | AnalyticsModule |
| **Used by** | Wishlist Forecaster (sub-component), Revenue Forecasting (M29), Studio Intelligence |
| **Milestone** | M25 |

**Example:** Daily wishlist count for the past 90 days → time-series model → projected wishlists at launch (47 days) → confidence interval.

### Ranking

| Attribute | Detail |
|---|---|
| **What** | Generic ranking primitives — by relevance, by freshness decay, by diversity (MMR), by engagement prediction, by quality score. Composable: mix weights based on context. |
| **Depends on** | None (pure algorithm) |
| **Used by** | Recommendation Engine, Semantic Search, Feed Ranking, Trending Discussions |
| **Milestone** | M23 (used by recs), M26 (used by search) |

**Example:** 100 feed items → scored by `0.4*followRelevance + 0.3*recency + 0.2*engagementPrediction + 0.1*diversityBonus` → ranked feed.

---

## Layer 3 — Products

User-facing features built on capabilities. These are what appear in the app — pages, widgets, dashboards, tools. Every product must use at least one Layer 2 capability and deliver at least one Layer 4 experience.

### AI Assistant (Chat Interface)

| Attribute | Detail |
|---|---|
| **Capabilities used** | Natural Language Understanding, Text Generation, Summarization, RAG (Retrieval-Augmented Generation), Semantic Search |
| **Milestone** | M22 |
| **Status** | Designed, pending implementation |

**Features:**
- [ ] Context-aware chat widget (page type + game/studio injected into prompt)
- [ ] "Explain this game" — natural-language summary of description + devlogs + sentiment
- [ ] "Find me more like this" — routes to recommendation engine
- [ ] "What's new?" — summarizes recent devlogs + roadmap updates
- [ ] Inline tooltips — hover over game mechanic terms for AI explanation
- [ ] Devlog draft assistant — bullet points → formatted devlog
- [ ] Analytics interpreter — "Why did my wishlists drop?" → trend explanation

### Smart Search Bar

| Attribute | Detail |
|---|---|
| **Capabilities used** | Semantic Search, Natural Language Understanding, Semantic Ranking |
| **Milestone** | M26 |
| **Status** | Designed, pending implementation |

**Features:**
- [ ] Natural language queries ("3D platformer with a grappling hook")
- [ ] Emotion-based search ("games that feel like Journey")
- [ ] Mechanic-based search ("roguelike with base building")
- [ ] Cross-language search (query in Portuguese, find English games)
- [ ] Hybrid scoring (semantic + keyword + popularity)
- [ ] Post-search filters (genre, platform, price, status)

### Game Discovery Feed

| Attribute | Detail |
|---|---|
| **Capabilities used** | Recommendation Engine, Semantic Ranking, Gaming Taste Profile |
| **Milestone** | M23 |
| **Status** | Designed, pending implementation |

**Features:**
- [ ] "For You" personalized feed row on homepage
- [ ] "Games Like This" section on game detail pages
- [ ] "Hidden Gems" feed (high-review-quality, low-visibility games)
- [ ] Cross-genre recommendations with "Because You Like X" explanations
- [ ] Playlist generation — AI-curated themed collections
- [ ] Content-aware feed ranking (devlog type + user engagement profile)

### Studio Intelligence Dashboard

| Attribute | Detail |
|---|---|
| **Capabilities used** | Store Page Optimization, Wishlist Forecaster, Sentiment Analysis, Competitor Analysis, Launch Readiness Scoring, Summarization, Text Generation |
| **Milestone** | M25 |
| **Status** | Designed, pending implementation |

**Features:**
- [ ] Store Page Quality score with actionable suggestions
- [ ] Wishlist Projection widget with confidence intervals
- [ ] Community Pulse sentiment dashboard (what players love / are confused by / want next)
- [ ] Market Position panel (percentile rankings vs similar games)
- [ ] Launch Readiness progress bar with checklist
- [ ] Review Insights tab (topic clusters, representative quotes, trends)
- [ ] Devlog Optimization suggestions (topics, timing, format)
- [ ] Content Gap Detection (what players are asking about that devlogs don't cover)

### Moderation Queue

| Attribute | Detail |
|---|---|
| **Capabilities used** | Content Moderation, Classification, Sentiment Analysis |
| **Milestone** | M24 |
| **Status** | Designed, score 6.7 (rejected in current scope — revisit at scale) |

**Features:**
- [ ] AI toxicity classification with confidence scores
- [ ] AI spam detection replacing regex-based service
- [ ] Review quality scoring (substance vs low-effort)
- [ ] Automated triage: high-confidence → auto-flag, low-confidence → human queue
- [ ] False-positive appeals system
- [ ] Moderation analytics dashboard (accuracy, false positive rate, TTR)

### Marketplace Fraud Detection

| Attribute | Detail |
|---|---|
| **Capabilities used** | Fraud Detection, Classification |
| **Milestone** | M27 (future) |
| **Status** | Planned, post-M26 |

**Features:**
- [ ] Suspicious listing detection (duplicate assets, unrealistically low prices)
- [ ] Transaction anomaly detection (rapid repeat purchases, chargeback risk)
- [ ] Seller/buyer reputation scoring
- [ ] Automated hold on high-risk transactions
- [ ] Admin dashboard fraud queue

---

## Layer 4 — User Experiences

How users interact with AI. These are the moments that make AI feel invisible — it's just Playmorrow working better. No user thinks "I'm using AI right now." They think "I found a great game" or "that was fast."

### Discovery Experiences

| Experience | Product | Capability | Description |
|---|---|---|---|
| **Natural language search in search bar** | Smart Search Bar | Semantic Search, NLU | User types "cozy farming game with romance options" and gets Stardew Valley-like games. No filters, no tags, no clicks. |
| **"Because you like X" on recommendations** | Game Discovery Feed | Recommendation Engine, Gaming Taste Profile | Every recommendation has an expandable "Why this?" section. "Recommended because you wishlisted Hollow Knight and reacted positively to their combat devlog." |
| **"Find by Feeling" emotion chips** | Smart Search Bar | NLU, Semantic Search | Browse by emotional category: melancholic, cozy, tense, hopeful, nostalgic. "Show me games that feel like Inside." |
| **"Hidden Gems" feed row** | Game Discovery Feed | Recommendation Engine, Semantic Ranking | AI surfaces games with strong review sentiment but low visibility. "These 5 games have 95%+ positive reviews and under 100 wishlists." |
| **"You Might Also Like" sidebar** | Game Discovery Feed | Recommendation Engine | On every game detail page — not just same-tag games, but structurally similar games the player would genuinely enjoy. |
| **"Games You Can Finish in a Weekend" playlist** | Game Discovery Feed | Text Generation, Recommendation Engine | AI-curated themed collections. Auto-generated copy describing why each collection exists. |

### Studio Experiences

| Experience | Product | Capability | Description |
|---|---|---|---|
| **AI-generated devlog draft in editor** | AI Assistant | Text Generation, NLU | Studio types bullet points → "Expand to Devlog" button → AI generates a formatted draft. Studio reviews, edits, publishes. |
| **Store Quality Score card on dashboard** | Studio Intelligence Dashboard | Store Page Optimization | "Your store page scores 67/100. Add these 3 tags (+12 impressions), add 2 combat screenshots (+8% conversion)." |
| **Wishlist Projection widget** | Studio Intelligence Dashboard | Wishlist Forecaster, Forecasting | "Projected launch-day wishlists: 2,100-2,800. You're tracking 15% above the genre average." |
| **Community Pulse sentiment dashboard** | Studio Intelligence Dashboard | Sentiment Analysis, Summarization | "Art style: 78% positive. Difficulty balance: polarized. Most requested: controller remapping (37 comments)." |
| **Launch Readiness checklist** | Studio Intelligence Dashboard | Launch Readiness Scoring, Store Page Optimization | Visual checklist: followers ✅, wishlists ✅, devlog consistency ⚠️, press kit ⚠️. Actionable recommendations for each gap. |
| **"What your players are asking about" panel** | Studio Intelligence Dashboard | Content Gap Detection, Summarization | "47 players have asked about mod support. 0 devlogs mention it. Consider a mod support FAQ post." |

### Community Experiences

| Experience | Product | Capability | Description |
|---|---|---|---|
| **Toxicity warnings in comment threads** | Moderation Queue | Content Moderation | High-confidence toxic comment auto-collapsed with "This comment was flagged by our moderation system. Click to view." Confirmed-clean comments appear normally. |
| **Review quality sorting** | Game Discovery Feed | Classification | Reviews sorted by substance, not chronology. "The combat system is satisfying but checkpoint spacing needs work" ranks above "10/10 GOTY." |
| **Thread summaries on long discussions** | Game Discovery Feed | Summarization | "This 47-comment thread is about difficulty balancing — 62% agree Act 2's boss needs tuning, 28% think it's fine, 10% suggest alternative solutions." |
| **Auto-generated FAQ sections** | Game Discovery Feed | Summarization, Classification | From community questions: "When is multiplayer coming? (Asked 12 times. Studio says: Q2 2027 — see devlog #14)." |
| **Trending Discussions with quality signals** | Game Discovery Feed | Ranking, Classification | Discussions ranked not just by volume but by quality: diverse perspectives > echo chambers, substantive debate > one-line takes. |
| **Spam auto-removal (invisible)** | Moderation Queue | Content Moderation | Spam comments never shown. No "removed by moderator" marker — they never existed in the user's view. User experiences a clean community. |

### Marketplace Experiences

| Experience | Product | Capability | Description |
|---|---|---|---|
| **"Frequently Used Together" on asset pages** | Marketplace | Recommendation Engine | "Buyers of this 3D character model also bought this animation pack and this environment kit." Based on purchase patterns + asset compatibility. |
| **Pricing insights on seller dashboard** | Marketplace Fraud Detection | Pricing Intelligence | "Your pixel art tileset at $25 is in the 90th percentile. Median for top-selling tilesets: $12. Consider $14.99 to align with category norms." |
| **Fraud auto-flag (invisible to buyers)** | Marketplace Fraud Detection | Fraud Detection | Suspicious listings flagged before buyer sees them. Stolen assets detected via image hash comparison. Legitimate buyers only see legitimate listings. |
| **"Complete Your Project" bundle at checkout** | Marketplace | Recommendation Engine | AI-suggested complementary assets based on what's in the cart. "Projects using this shader typically need a lighting pack (90% of purchasers also bought...)." |

### Assistant Experiences

| Experience | Product | Capability | Description |
|---|---|---|---|
| **"What's new?" digest** | AI Assistant | Summarization, Classification | Player opens assistant: "3 of your followed games posted devlogs this week. Eldritch Echoes added a new enemy type. Starfall announced their release date." |
| **"Why did my wishlists drop?" analytics chat** | AI Assistant | Text Generation, NLU, Forecasting | Studio asks: "Why did my wishlists drop 30% this week?" Assistant: "Your wishlist growth rate has been declining for 3 weeks. The drop correlates with reduced devlog frequency (3 posts in the past 30 days vs your usual 8). Studios in your genre posting 2x/week see 2.3x higher growth." |
| **Inline tooltip definitions** | AI Assistant | Text Generation, NLU | Player hovers over "Soulslike" → tooltip: "A subgenre of action RPGs characterized by challenging combat, environmental storytelling, and death-as-mechanic systems (losing progress on death). Popularized by Dark Souls." |
| **"Plan my game launch" agentic workflow** | AI Assistant | Text Generation, NLU, Semantic Search | Multi-step: "I have a metroidvania launching in 8 weeks. What should I do?" Assistant builds a checklist: "1. Post 4 more devlogs (2x/week), 2. Submit to 3 upcoming game festivals, 3. Reach out to 5 metroidvania content creators, 4. Create a press kit (currently missing: trailer, press contact)." |

---

## Architecture Rules

### Rule 1: No capability without product

Every Layer 2 capability must be used by at least one Layer 3 product. A capability built "just in case" decays — it's unmaintained, untested against real use, and costs cognitive overhead. Before building a capability, answer: **which product needs this?**

### Rule 2: No product without value

Every Layer 3 product must deliver at least one measurable Layer 4 user experience. "Measurable" means at least one of the [AI Success Metrics](./AI_SUCCESS_METRICS.md) applies and can be tracked. A product that ships without a success metric is a prototype, not a product.

### Rule 3: Layers are dependency boundaries

- Layer 1 never depends on Layer 2. Infrastructure knows nothing about specific capabilities.
- Layer 2 never depends on Layer 3. Capabilities should be reusable across multiple products.
- Layer 3 never depends on Layer 4. Products define features; experiences define how users interact. Products don't know about specific UI implementations.
- Layer 4 knows about all layers (it's the surface — it connects everything).

### Rule 4: One capability, one responsibility

A capability does one thing. If "Store Page Optimization" also does sentiment analysis, split out Sentiment Analysis as a separate capability. Composable primitives > monolithic services. This enables: independent testing, independent scaling, independent deprecation.

### Rule 5: Products compose capabilities

A product like "Studio Intelligence Dashboard" is not a capability — it's a composition of 7 capabilities (Store Page Analyzer, Wishlist Forecaster, Sentiment Analyzer, etc.) presented as a unified experience. The product coordinates capabilities; it does not implement them.

### Rule 6: Experiences are interaction patterns, not features

"AI-generated devlog draft in the editor" (Layer 4) is an interaction pattern that uses the AI Assistant product (Layer 3) which uses Text Generation (Layer 2) which uses AIProvider (Layer 1). An experience is not a feature ticket — it's a moment in the user's workflow where AI makes something better.

---

## Dependency Map

```
Layer 1 (Infrastructure)       Layer 2 (Capabilities)        Layer 3 (Products)           Layer 4 (Experiences)
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐       ┌──────────────────────┐
│ AIProvider          │──┬───▶│ Text Generation     │──┬───▶│ AI Assistant        │──┬───▶│ Devlog draft in      │
│ Embedding Service   │  │    │ Summarization       │  │    │                     │  │    │ editor               │
│ Vector Store        │  │    │ NLU                 │  │    │                     │  │    │ "What's new?" digest │
│ Streaming Service   │  │    │ Classification      │  │    │                     │  │    │ "Why did wishlists   │
│ Prompt Registry     │  │    └─────────────────────┘  │    └─────────────────────┘  │    │  drop?" chat         │
│ Conversation Memory │  │                             │                              │    │ Inline tooltips       │
│ AIMetricsService    │  │    ┌─────────────────────┐  │                              │    └──────────────────────┘
│ Feature Flags       │  │    │ Semantic Search     │──┤    ┌─────────────────────┐    │
└─────────────────────┘  │    │ NLU                 │  │    │ Smart Search Bar    │──┬─▶│ Natural language      │
                         │    │ Semantic Ranking    │  │    │                     │  │    │ search                │
                         │    └─────────────────────┘  │    └─────────────────────┘  │    │ Emotion-based browse  │
                         │                             │                              │    │ Cross-language search │
                         │    ┌─────────────────────┐  │                              │    └──────────────────────┘
                         │    │ Recommendation Eng  │──┤    ┌─────────────────────┐    │
                         │    │ Gaming Taste Profile│  │    │ Game Discovery Feed │──┬─▶│ "Because you like X"  │
                         │    │ Semantic Ranking    │  │    │                     │  │    │ "Hidden Gems" feed    │
                         │    │ Forecasting         │  │    │                     │  │    │ "Games Like This"     │
                         ├───▶│ Sentiment Analysis  │  │    │                     │  │    │ Playlist generation   │
                         │    │ Summarization       │  │    └─────────────────────┘  │    │ Review quality sort   │
                         │    │ Store Page Optimizer│  │                              │    │ Thread summaries      │
                         │    │ Wishlist Forecaster │  │    ┌─────────────────────┐    │    │ FAQ generation        │
                         │    │ Competitor Analysis │──┼───▶│ Studio Intel        │──┬─▶│ Store Quality Score   │
                         │    │ Launch Readiness    │  │    │ Dashboard           │  │    │ Wishlist Projection   │
                         │    │ Classification      │  │    │                     │  │    │ Community Pulse       │
                         │    └─────────────────────┘  │    └─────────────────────┘  │    │ Launch Readiness      │
                         │                             │                              │    │ Content Gap Detection │
                         │    ┌─────────────────────┐  │                              │    └──────────────────────┘
                         │    │ Content Moderation  │──┤    ┌─────────────────────┐    │
                         │    │ Classification      │  │    │ Moderation Queue    │──┬─▶│ Toxicity warnings     │
                         │    └─────────────────────┘  │    └─────────────────────┘  │    │ Spam auto-removal     │
                         │                             │                              │    │ Review quality scoring│
                         │    ┌─────────────────────┐  │                              │    └──────────────────────┘
                         │    │ Fraud Detection     │──┤    ┌─────────────────────┐    │
                         │    │ Pricing Intelligence│  │    │ Marketplace Fraud   │──┬─▶│ Fraud auto-flag       │
                         │    └─────────────────────┘  │    │ Detection           │  │    │ "Frequently Used      │
                         └─────────────────────────────┘    └─────────────────────┘  │    │  Together"            │
                                                                                     │    │ Pricing insights      │
                                                                                     │    │ Bundle suggestions    │
                                                                                     └──────────────────────┘
```

---

## How to Read This Document

- **Building an AI feature?** Start at Layer 3. Define the product. Then identify which Layer 2 capabilities it needs. Then check if Layer 1 already supports those capabilities.
- **Adding a new capability?** Verify it's used by at least one Layer 3 product in the roadmap. If not, don't build it.
- **Designing a new experience?** Start at Layer 4. Describe the moment. Then trace down to the product, capability, and infrastructure that enables it. If something in the chain is missing, that's the dependency.
- **Evaluating a platform change?** Start at Layer 1. If the Provider Abstraction changes (new provider), assess impact on all capabilities above it. If only one capability uses a Layer 1 service, the abstraction may be over-engineered.
