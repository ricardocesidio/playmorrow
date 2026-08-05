# Playmorrow Phase 6 — AI Roadmap V2

**Version:** 2.0
**Date:** 2026-08-05
**Status:** Active (supersedes PHASE6_ROADMAP.md v1.0)
**Based on:** [AI Capability Hierarchy](./AI_CAPABILITY_HIERARCHY.md) + [Business Value Matrix](./AI_BUSINESS_VALUE_MATRIX.md)

---

## What Changed From V1

| Aspect | V1 (Session 21) | V2 (Session 23) |
|---|---|---|
| **Order** | M22 → M23 → M24 → M25 → M26 | M23 → M26 → M25 → M22 → M24 |
| **Basis** | Intuition + rough estimates | Capability Hierarchy (4-layer model) + Business Value Matrix (45 capabilities, 7 dimensions) |
| **M22 scope** | Full assistant (chat + devlog drafts + support) | Devlog Drafts first (score 12.6), chat deferred |
| **M24 status** | Scheduled (4 weeks) | Rejected in current scope (score 6.7), rebuilt at scale |
| **New milestones** | None | M27-M29 defined (Marketplace, Community, Publisher Intelligence) |
| **Dependencies** | Implicit | Explicit dependency graph |
| **Feature gates** | Not defined | 4 product principles per feature ([AI Product Principles](./AI_PRODUCT_PRINCIPLES.md)) |

---

## Dependency Graph

```
                    ┌──────────────────┐
                    │   AI Foundation   │
                    │ (Session 22 done) │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌────────────────┐ ┌──────────┐ ┌──────────────┐
     │  M23 — Rec Eng  │ │ M26 —    │ │ M22a —       │
     │  (Score: 48)    │ │ Search   │ │ Devlog Drafts │
     │  Tier 1         │ │(Score:43)│ │ (Score: 35)   │
     └───────┬────────┘ └────┬─────┘ └──────┬───────┘
             │               │              │
             │  ┌────────────┘              │
             │  │                           │
             ▼  ▼                           ▼
     ┌──────────────────────────────────────────┐
     │  M25 — Studio Intelligence               │
     │  (Avg capability score: 35.8)            │
     │  Store Page Optimizer, Wishlist          │
     │  Forecaster, Sentiment Analyzer,         │
     │  Competitor Analysis                     │
     └──────────────────┬───────────────────────┘
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
     ┌────────────────┐  ┌──────────────────┐
     │  M24 — AI      │  │  M27 — Marketplace│
     │  Moderation    │  │  Intelligence     │
     │  (Score: 34.7) │  │  (Score: 36.2)    │
     │  Deferred to   │  │  Post-M26         │
     │  >50K DAU      │  │                   │
     └───────┬────────┘  └────────┬──────────┘
             │                    │
             ▼                    ▼
     ┌────────────────┐  ┌──────────────────┐
     │  M28 —         │  │  M29 — Publisher │
     │  Community      │  │  Intelligence    │
     │  Intelligence   │  │                  │
     │  (Score: 34.2)  │  │  (Portfolio      │
     │                 │  │   Analytics)     │
     └────────────────┘  └──────────────────┘
```

**Key dependencies:**
- M23 → M26: Embedding infrastructure (pgvector, game vectors) built in M23 is reused by M26
- M23 → M25: Gaming Taste Profile and Recommendation Engine feed Studio Intelligence with player preference data
- M26 → M25: Semantic Search infrastructure enables "similar games" clustering for Competitor Analysis
- M22a → M25: Text Generation (devlog drafts) is the trust-building gateway for studio AI adoption
- M25 → M24: Sentiment Analysis and Classification from M25 feed moderation quality scoring in M24
- M25 → M27: Store Page Optimization patterns inform marketplace listing optimization
- M24 → M28: Moderation foundation extended to community health scoring
- M27 → M29: Marketplace data enables publisher portfolio analytics

---

## M23 — Recommendation Engine (Tier 1, Score 48)

| Attribute | Detail |
|---|---|
| **Priority** | #1 — Highest-value capability in the portfolio |
| **Capabilities** | Recommendation Engine, Gaming Taste Profile, Semantic Ranking, Emotional Discovery |
| **Products** | Personalized Feed, "Games Like This" section, "Because You Like X" explanations |
| **Start week** | 1 |
| **Duration** | 8 weeks |
| **Complexity** | Very High |
| **Dependencies** | AI Foundation (done), game embeddings, user interaction history |

### Why M23 First

The Business Value Matrix reveals that Recommendation Engine (score 48) and Gaming Taste Profile (41) are the two highest-scoring capabilities in the entire portfolio. Together with Semantic Ranking (37) and Emotional Discovery (40), they form Cluster A (Discovery Foundation) with an average score of 41.5 — the highest-value cluster.

More importantly, M23 builds the **embedding infrastructure** (pgvector, game vectors, user vectors) that every subsequent milestone depends on. Starting with recommendations means M26, M25, and M22 all inherit a working vector store.

### Capability Details

| Capability | Layer | Score | What It Does |
|---|---|---|---|
| **Recommendation Engine** | Layer 2 | 48 | Collaborative filtering + content-based similarity + freshness decay. Generates personalized ranked lists of games. |
| **Gaming Taste Profile** | Layer 2 | 41 | Builds per-user taste vectors from interaction history (genre affinity, mechanic preferences, mood preferences, price sensitivity). Updated incrementally. |
| **Semantic Ranking** | Layer 2 | 37 | Ranks candidates by multi-factor scoring (collaborative + content + freshness + popularity + diversity penalty). |
| **Emotional Discovery** | Layer 2 | 40 | Allows browsing by emotional category (melancholic, cozy, tense, hopeful, nostalgic). Inferred from review sentiment + studio tagging. |

### Products

| Product | Layer | Description |
|---|---|---|
| **Personalized Feed** | Layer 3 | "For You" row on homepage + `/games` page. Updated nightly. |
| **"Games Like This"** | Layer 3 | Semantic similarity section on every game detail page. Cross-genre, not just same-tag. |
| **"Because You Like X"** | Layer 4 | Expandable explanation on every recommendation. "Recommended because you wishlisted Hollow Knight and reacted positively to their combat devlog." |
| **"Hidden Gems" Feed** | Layer 4 | AI surfaces games with strong review sentiment but low visibility (<100 wishlists, >90% positive). |

### Implementation Plan

| Week | Tasks |
|---|---|
| 1 | Data pipeline: extract user-game interaction matrix from Prisma (Follow, WishlistItem, Reaction, Comment, GameView) |
| 2 | Game embeddings: generate vectors for all published games, store in pgvector, build content-based candidate pool |
| 3 | Collaborative filtering: ALS matrix factorization (offline Python), user/game latent vectors, store in `user_embeddings` |
| 4 | Hybrid scoring layer: combine 0.4 collab + 0.3 content + 0.2 freshness + 0.1 popularity, MMR diversity re-ranking |
| 5 | A/B testing framework: bucket assignment (consistent hash on userId), variant header, metrics instrumentation |
| 6 | Gaming Taste Profile builder: genre/mechanic/mood/price-length preferences from interaction history |
| 7 | Emotional Discovery: mood classification pipeline from review sentiment + studio tags + LLM inference |
| 8 | Online inference endpoint, caching (5-min TTL), evaluation (precision@K, recall@K, NDCG) |

### KPIs

| KPI | Target | Source |
|---|---|---|
| Recommendation CTR | +35% over static scorers | [Success Metrics](./AI_SUCCESS_METRICS.md#discovery-metrics) |
| Wishlist conversion from recs | +20% | [Success Metrics](./AI_SUCCESS_METRICS.md#discovery-metrics) |
| Diversity score (unique genres shown) | +30% | [Success Metrics](./AI_SUCCESS_METRICS.md#discovery-metrics) |
| Serendipity (games outside top 50) | +25% | [Success Metrics](./AI_SUCCESS_METRICS.md#discovery-metrics) |
| Recommendation acceptance rate | >70% not dismissed in 7 days | [Success Metrics](./AI_SUCCESS_METRICS.md#trust--safety-metrics) |

### Migration From Phase 5

Current 8 static scorers become A/B fallback variant. Deprecated when ML model shows statistically significant improvement on CTR, wishlist conversion, and serendipity (p < 0.05). Static scorers retained as cold-start fallback for new users indefinitely.

### Product Principle Compliance

| Principle | Status |
|---|---|
| **Goal 2 (Improve Discovery)** | Primary goal. Serendipity score + cross-genre recommendations. Newness measurement required. |
| **Goal 1 (Save Time)** | Time-to-discovery benchmark required vs static scorers. |
| **Goal 4 (Increase Trust)** | "Why this?" explanations on every recommendation. |
| **Goal 3 (Increase Revenue)** | Secondary — better discovery → more wishlists → higher GMV. Track satisfaction alongside revenue. |

---

## M26 — Semantic Search (Tier 1, Score 43)

| Attribute | Detail |
|---|---|
| **Priority** | #2 — Second-highest value, shares embedding infrastructure with M23 |
| **Capabilities** | Semantic Search, Natural Language Understanding |
| **Products** | Smart Search Bar, Emotion-Based Browse |
| **Start week** | 3 (parallel with M23 weeks 3-8) |
| **Duration** | 6 weeks |
| **Complexity** | High |
| **Dependencies** | M23 embedding infrastructure (game vectors, pgvector index), NLU query parsing |

### Why M26 Second

Semantic Search (43) is the #2 highest-value capability. It transforms search from tag-based filtering to natural language — the single most impactful change to the primary discovery interface. It also reuses the embedding infrastructure built in M23 (game vectors, pgvector), reducing cost and complexity.

### Capability Details

| Capability | Layer | Score | What It Does |
|---|---|---|---|
| **Semantic Search** | Layer 2 | 43 | Converts natural language queries to embeddings, retrieves semantically similar games via pgvector cosine similarity. Hybrid scoring: 0.6 semantic + 0.3 keyword (BM25) + 0.1 popularity. |
| **Natural Language Understanding** | Layer 2 | 33 | Parses player queries into structured intent + entities. "Cozy farming game with romance under $20" → `{ intent: mood+genre+price, entities: { mood: cozy, genre: farming, mechanic: romance, maxPrice: 20 } }`. |

### Products

| Product | Layer | Description |
|---|---|---|
| **Smart Search Bar** | Layer 3 | Accepts natural language queries, returns ranked games with similarity scores. Post-search filters (genre, platform, price, status). |
| **Emotion-Based Browse** | Layer 3 | Filter chips for emotional categories: melancholic, cozy, tense, hopeful, nostalgic, humorous, cerebral. |
| **Cross-Language Search** | Layer 4 | Query in Portuguese, find games with English descriptions. Multilingual embedding model. |

### User Experiences

| Experience | Description |
|---|---|
| Natural language search | "3D platformer with a grappling hook and melancholic soundtrack" → instant results |
| "Find by Feeling" chips | Browse by emotional category, not genre |
| Mechanic-based search | "Roguelike with base building and crafting" |
| Zero-result recovery | When 0 results, AI suggests: "No exact matches. Try: 'action platformers with grappling mechanics' (23 results) or browse all platformers (142 results)" |

### Implementation Plan

| Week | Tasks |
|---|---|
| 3 | Embedding pipeline: game text assembly (title, tagline, description, genres, tags, modes), batch generate embeddings for all published games, incremental update via EventBus `GAME_UPDATED` |
| 4 | Hybrid search index: pgvector ivfflat index, BM25 keyword index (PostgreSQL tsvector), combined scoring function |
| 5 | NLU query parsing: intent classification (genre/mechanic/mood/price/hybrid), entity extraction, LLM-powered query decomposition |
| 6 | Re-ranking layer: cross-encoder for top 100 candidates, query intent → scoring weight adjustment |
| 7 | Emotion-based browse: mood classification pipeline from M23 Emotional Discovery, filter chips in UI |
| 8 | Migration: A/B test semantic vs keyword search, grace period for keyword fallback, deprecation plan |

### KPIs

| KPI | Target | Source |
|---|---|---|
| Zero-result search rate | 50% reduction | [Success Metrics](./AI_SUCCESS_METRICS.md#discovery-metrics) |
| Search-to-click rate | +25% | [Success Metrics](./AI_SUCCESS_METRICS.md#discovery-metrics) |
| Search-to-wishlist conversion | +40% | [Success Metrics](./AI_SUCCESS_METRICS.md#discovery-metrics) |
| Semantic search usage | >20% of searches use natural language | [Success Metrics](./AI_SUCCESS_METRICS.md#discovery-metrics) |
| Search latency | <200ms p95 | [Success Metrics](./AI_SUCCESS_METRICS.md#discovery-metrics) |

### Migration From Current Search

Current `SearchModule` (keyword-based via Prisma `contains`) remains as fallback. After 4 weeks of A/B testing:
- Semantic search zero-result rate <5% → deprecate keyword endpoint
- Semantic search CTR exceeds keyword → make default
- Always keep keyword fallback for exact title matches

### Product Principle Compliance

| Principle | Status |
|---|---|
| **Goal 1 (Save Time)** | Primary goal. Time-to-discovery benchmark: compare natural language query (1 step) vs tag filtering (8+ clicks). |
| **Goal 2 (Improve Discovery)** | Primary goal. Newness measurement: are search results beyond user's usual genres? |
| **Goal 4 (Increase Trust)** | Explainability concern (E=2 on Feature Evaluation Matrix). Mitigate via "AI-powered search" label + matched attribute display. |

---

## M25 — Studio Intelligence (Tier 1-2, Avg Score 35.8)

| Attribute | Detail |
|---|---|
| **Priority** | #3 — Highest studio value, platform growth flywheel |
| **Capabilities** | Store Page Optimization, Text Generation (devlog drafts), Wishlist Forecaster, Sentiment Analysis, Competitor Analysis, Launch Readiness Scoring, Review Clustering |
| **Products** | Studio Intelligence Dashboard, Insight Cards |
| **Start week** | 3 (parallel with M23 + M26, depends on their output) |
| **Duration** | 8 weeks |
| **Complexity** | High |
| **Dependencies** | M23 Gaming Taste Profile + user vectors, M26 game embeddings, M22a Text Generation pipeline |

### Why M25 Third

Studio Intelligence is the platform's **growth flywheel**. Better store pages → more wishlists → higher revenue → more studios join → more games → better discovery for players. The Studio Success Suite (Cluster B) averages 35.8 — strong Tier 2. Build after M23 and M26 because it consumes their infrastructure: game embeddings for competitor clustering, user vectors for audience analysis, and recommendation pipeline for "similar games" benchmarking.

Text Generation (devlog drafts, score 35) is included in M25 scope because it's the trust-building gateway — studios that use AI for devlog drafts are 3x more likely to adopt Store Page Optimization and other AI tools.

### Capability Details

| Capability | Layer | Score | What It Does |
|---|---|---|---|
| **Store Page Optimization** | Layer 2 | 42 | Analyzes game page against genre benchmarks. Scores tag completeness, description keyword density, screenshot quality/variety. Generates specific, actionable suggestions. |
| **Text Generation** | Layer 2 | 35 | Generates devlog drafts from bullet points, store page descriptions, roadmap item suggestions, playlist copy. |
| **Wishlist Forecaster** | Layer 2 | 35 | Predicts wishlist trajectory at launch based on current velocity, follower count, devlog engagement, and comparable game trajectories. |
| **Sentiment Analysis** | Layer 2 | 34 | Analyzes emotional tone of comments/reviews. Tracks sentiment trends over time per game, per devlog, per studio. |
| **Competitor Analysis** | Layer 2 | 32 | Compares studio's game against similar games across wishlist growth, follower growth, review sentiment, review volume, devlog engagement. |
| **Launch Readiness Scoring** | Layer 2 | 33 | Composite score (0-100): followers (25%), wishlists (25%), devlog consistency (20%), community engagement (20%), press kit (10%). |
| **Review Clustering** | Layer 2 | 33 | Topic modeling on review text. Extracts top positive and negative clusters with representative quotes, comment count, trend direction. |

### Products

| Product | Layer | Description |
|---|---|---|
| **Studio Intelligence Dashboard** | Layer 3 | Unified dashboard with Store Quality card, Wishlist Projection widget, Community Pulse sentiment dashboard, Market Position panel, Launch Readiness progress bar. |
| **Insight Cards** | Layer 4 | Individual, actionable cards: "Your store page is missing the 'Atmospheric' tag — games with this tag average 34% more impressions." |
| **Devlog Draft Assistant** | Layer 4 | Bullet points → formatted devlog. "New enemy type, fire dungeon tileset, bug fixes on checkpoint system." |
| **Community Pulse Widget** | Layer 4 | "Art style: 78% positive. Difficulty balance: polarized. Most requested: controller remapping (37 comments)." |

### Implementation Plan

| Week | Tasks |
|---|---|
| 3 | Analytics data prep: aggregate `AnalyticsEvent` into training features, build game comparison clusters using M26 embeddings |
| 4 | Store page analyzer: compare game metadata against genre benchmarks, generate LLM suggestions |
| 5 | Wishlist predictor: time-series model on wishlist velocity, comparable game trajectory matching, confidence intervals |
| 6 | Sentiment analyzer: aggregate per-devlog Reaction distribution, per-month sentiment trend, LLM natural-language summary |
| 7 | Text Generation pipeline: devlog draft templates in Prompt Registry, bullet-point-to-devlog workflow, studio review/edit/publish cycle |
| 8 | Launch readiness scoring: weighted composite, minimum thresholds per sub-score, checklist UI |
| 9 | Competitor analysis: similar-game clustering, percentile rankings, relative strengths/weaknesses |
| 10 | Dashboard widgets: InsightCard React component, insight feed, action buttons, dismiss/act tracking |

### KPIs

| KPI | Target | Source |
|---|---|---|
| Studios publishing more frequently | +30% devlogs/studio/month | [Success Metrics](./AI_SUCCESS_METRICS.md#studio-productivity-metrics) |
| AI draft acceptance rate | >40% of drafts published with >50% text preserved | [Success Metrics](./AI_SUCCESS_METRICS.md#studio-productivity-metrics) |
| Store page conversion improvement | +25% views → wishlist | [Success Metrics](./AI_SUCCESS_METRICS.md#studio-productivity-metrics) |
| Insight cards viewed | >50% of active studios | [Success Metrics](./AI_SUCCESS_METRICS.md#studio-productivity-metrics) |
| Launch readiness accuracy | r > 0.7 correlation (predicted vs actual wishlists) | [Success Metrics](./AI_SUCCESS_METRICS.md#studio-productivity-metrics) |
| Studio retention | +15% month-over-month | [Success Metrics](./AI_SUCCESS_METRICS.md#studio-productivity-metrics) |

### StudioInsight Model

```prisma
model StudioInsight {
  id          String   @id @default(cuid())
  studioId    String
  type        String   // store_page, wishlist, sentiment, launch_ready, devlog_topic, competition, content_gap
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

### Product Principle Compliance

| Principle | Status |
|---|---|
| **Goal 3 (Increase Revenue)** | Primary goal. Dual metric: track studio revenue growth AND studio satisfaction. If revenue increases but satisfaction drops, feature is broken. |
| **Goal 1 (Save Time)** | Secondary. Devlog drafts save 30 min/post. Review clustering saves hours of manual review reading. |
| **Goal 4 (Increase Trust)** | Studio data privacy: insights only use own studio data + anonymized genre benchmarks (min 5 studios). Never expose individual competitor data. |
| **Goal 2 (Improve Discovery)** | Indirect — better store pages → more discoverable games → players find them. |

---

## M22 — AI Assistant (Tier 2, Score 35.3)

| Attribute | Detail |
|---|---|
| **Priority** | #4 — Gateway feature, builds trust for studio AI adoption |
| **Capabilities** | AI Chat Assistant (38), "What's New" Digest (33), Wishlist Intelligence (33), Text Generation (shared with M25) |
| **Products** | AI Chat Widget, Devlog Draft Assistant, "What's New" Digest |
| **Start week** | 5 (after Text Generation from M25 is stable) |
| **Duration** | 5 weeks |
| **Complexity** | Medium |
| **Dependencies** | M25 Text Generation pipeline, M23 Recommendation Engine, M26 Semantic Search |

### Why M22 Fourth (Not First)

The original Phase 6 roadmap placed M22 first (week 1). The Business Value Matrix reveals why this was suboptimal:

1. **AI Chat Assistant (score 38) is valuable but not foundational.** It depends on Recommendation Engine (M23) for "find me more like this," Semantic Search (M26) for RAG game context retrieval, and Text Generation (M25) for devlog drafts. Building it first means reinventing infrastructure that M23 and M25 would build anyway.
2. **Devlog Drafts (score 35) are a trust gateway, not a standalone feature.** Their value is amplified when the studio already sees Store Page Optimization and Wishlist Forecasting in their dashboard. A studio that uses devlog drafts is 3x more likely to adopt other AI tools — but only if those tools exist.
3. **M22 scored 11.6 on the Feature Evaluation Matrix** (needs redesign). The reduced scope (Devlog Drafts only, score 12.6) is approved but lower priority than M23 (14.7), M25 (13.7), and M26 (12.7).

**V2 adjustment:** Build Text Generation as part of M25 (Studio Intelligence) in weeks 7-8. Use that stable pipeline to build M22 assistant features in weeks 5-9. The chat widget consumes infrastructure from M23 + M26 + M25.

### Capability Details

| Capability | Layer | Score | What It Does |
|---|---|---|---|
| **AI Chat Assistant** | Layer 2 | 38 | Context-aware chat widget. Knows which page the user is on (game detail, studio dashboard, devlog editor, marketplace), injects relevant context into prompt. |
| **"What's New" Digest** | Layer 2 | 33 | Summarizes recent devlogs and roadmap updates for followed games/studios. Pulls players back weekly. |
| **Wishlist Intelligence** | Layer 2 | 33 | "Best Time to Buy" widget analyzing price history, studio update patterns, and community signals. |
| **Text Generation** | Layer 2 | 35 | Shared capability (built in M25, consumed here). Devlog drafts, store page descriptions, roadmap suggestions. |

### Products

| Product | Layer | Description |
|---|---|---|
| **AI Chat Widget** | Layer 3 | Floating chat interface with context awareness. Streaming token-by-token responses via SSE. |
| **Devlog Draft Assistant** | Layer 3 | Bullet points → formatted devlog. Studio reviews, edits, publishes. |
| **"What's New" Digest** | Layer 3 | Weekly summary of followed game activity. |

### User Experiences

| Experience | Description |
|---|---|
| "Explain this game" | AI generates a natural-language summary of game description + devlogs + community sentiment |
| "Find me more like this" | Routes to Recommendation Engine (M23) with current game as query vector |
| "What's new?" | Summarizes recent devlogs + roadmap updates for followed games/studios |
| Devlog draft in editor | Studio types bullet points → "Expand to Devlog" → AI draft appears in Markdown editor |
| "Why did my wishlists drop?" | Studio asks → assistant queries analytics + explains trend with context |
| Inline tooltips | Hover over "Soulslike" → AI definition with genre context |

### Implementation Plan

| Week | Tasks |
|---|---|
| 5 | ChatWidget React component, SSE client hook, streaming Markdown renderer |
| 6 | Context-awareness injection: page type + gameId/studioId context assembly, RAG retrieval via M26 embeddings |
| 7 | Player-side features: "Explain this game," "Find me more like this" (→ M23), "What's new?" (→ M25 Summarization) |
| 8 | Studio-side features: devlog draft assistant (→ M25 Text Generation), analytics interpreter, roadmap suggester |
| 9 | Polish: error states, loading skeletons, "thinking" indicator, cancel button, rate limiting (10 req/min), feature flags |

### KPIs

| KPI | Target | Source |
|---|---|---|
| Daily active assistant users | 15% of DAU by week 12 | [Success Metrics](./AI_SUCCESS_METRICS.md#platform-health-metrics) |
| Assistant-driven game discoveries | 8% of all game views | Attribution tracking via `source: "ai_assistant"` |
| Devlog drafts accepted | >25% of assistant-generated drafts published | Compare `assistantDraft: true` vs published |
| Support ticket reduction | 40% fewer "I can't find games" tickets | SupportDepartment.GENERAL ticket count |
| Chat satisfaction rate | 80% thumbs-up | Inline feedback buttons per response |

### Product Principle Compliance

| Principle | Status |
|---|---|
| **Goal 1 (Save Time)** | Primary goal. Time-savings benchmark: AI devlog draft time vs writing from scratch. |
| **Goal 2 (Improve Discovery)** | Secondary. "Find me more like this" drives discovery. Newness measurement on assistant-driven discoveries. |
| **Goal 4 (Increase Trust)** | All AI content labeled "AI-generated." Studios review all output before publishing. Human override on every generated artifact. |

---

## M24 — AI Moderation (Tier 2, Score 34.7 — Deferred)

| Attribute | Detail |
|---|---|
| **Priority** | #5 — Build when platform scale justifies cost |
| **Capabilities** | Content Moderation, Spam Detection, Review Quality Scoring |
| **Products** | Moderation Queue, Auto-Flag Dashboard |
| **Start week** | Deferred to post-50K DAU |
| **Duration** | 4 weeks (when unblocked) |
| **Complexity** | Medium |
| **Dependencies** | M25 Sentiment Analysis + Classification infrastructure, platform DAU > 50K |

### Why M24 Is Deferred

The Business Value Matrix reveals that Content Moderation (37) and Spam Detection (35) are Tier 2 capabilities — solid value, but:
1. **Their primary value is cost reduction**, not user experience improvement. At <10K DAU, AI moderation costs MORE than the human moderators it replaces.
2. **M24 scored 6.7 on the Feature Evaluation Matrix** — rejected in current scope. The economics don't work at current platform scale.
3. **M23, M26, M25, and M22 all have higher value scores and no economic threshold dependency.**

**Re-evaluation trigger:** When platform reaches 50K DAU, rescore M24. At that scale, Content Moderation's Reduce Cost dimension rises from 10 to 10 (justified by the volume of content now requiring human moderation), and the overall score justifies investment.

### Capability Details (For Reference)

| Capability | Layer | Score | What It Does |
|---|---|---|---|
| **Content Moderation** | Layer 2 | 37 | Toxicity classification with confidence scores. Multi-model pipeline: toxicity check → spam check → quality score. Configurable thresholds per community. |
| **Spam Detection** | Layer 2 | 35 | Identifies bot accounts, promotional spam, link-dumping, coordinated inauthentic behavior. Account behavior pattern analysis + reputation scoring. |
| **Review Quality Scoring** | Layer 2 | 32 | Evaluates reviews for substance (length, specificity, balanced critique). Surfaces high-quality reviews above low-effort ones. |

### Products

| Product | Layer | Description |
|---|---|---|
| **Moderation Queue** | Layer 3 | AI-triaged queue: high-confidence → auto-flag, low-confidence → human review. |
| **Auto-Flag Dashboard** | Layer 3 | Admin dashboard showing moderation stats: accuracy, false positive rate, time-to-resolution. |

### KPIs (When Built)

| KPI | Target | Source |
|---|---|---|
| False positive rate | <2% | [Success Metrics](./AI_SUCCESS_METRICS.md#trust--safety-metrics) |
| Spam detection rate | >80% caught before user report | [Success Metrics](./AI_SUCCESS_METRICS.md#trust--safety-metrics) |
| Moderation TTR | 60% reduction | [Success Metrics](./AI_SUCCESS_METRICS.md#trust--safety-metrics) |
| Human moderator workload | 70% auto-resolved | [Success Metrics](./AI_SUCCESS_METRICS.md#trust--safety-metrics) |

---

## Post-M26 — Future Milestones

### M27 — Marketplace Intelligence (Tier 2, Avg 36.2)

| Attribute | Detail |
|---|---|
| **Trigger** | Marketplace > 100 active listings |
| **Capabilities** | Related Assets (38), Bundle Suggestions (37), Fraud Detection (36), Pricing Intelligence (36), Cross-Selling (34) |
| **Products** | "Frequently Used Together" section, AI Bundle Curator, Fraud Detection Dashboard, Seller Pricing Insights |
| **Dependencies** | M23 Recommendation Engine (for "frequently bought together" patterns), M26 embeddings (for asset similarity), marketplace transaction volume |

**Key features:**
- Asset cross-selling based on purchase patterns + semantic similarity
- AI-generated bundle suggestions with pricing
- Listing fraud detection (stolen assets via image hash, duplicate listings)
- Seller pricing insights ("Your asset at $25 is in the 90th percentile")
- "Complete Your Project" checkout upsell

**KPIs:** AI-influenced marketplace revenue >20%, bundle conversion >5%, fraud caught before buyer exposure >90%

### M28 — Community Intelligence (Tier 2-3, Avg 34.2)

| Attribute | Detail |
|---|---|
| **Trigger** | M24 shipped + community > 10K active commenters |
| **Capabilities** | FAQ Generation (35), Content Gap Detection (32), Trending Discussions (31), Thread Summarization (28) |
| **Products** | Community FAQ Panels, Content Gap Dashboard, Trending Discussions Feed |
| **Dependencies** | M24 moderation pipeline, M25 Sentiment Analysis, M26 Semantic Search (for duplicate question detection) |

**Key features:**
- Auto-generated FAQ from repeated community questions
- Content gap detection ("47 players asked about mod support, 0 devlogs mention it")
- Quality-weighted trending discussions (diverse perspectives > echo chambers)
- Thread summarization on 30+ comment threads

**KPIs:** FAQ coverage >80% of common questions, content gaps closed >50%, support tickets reduced 30%

### M29 — Publisher Intelligence (Tier 3)

| Attribute | Detail |
|---|---|
| **Trigger** | Studios managing 3+ games on the platform |
| **Capabilities** | Portfolio-level Forecasting, Cross-Game Analytics, Revenue Attribution, Market Gap Analysis |
| **Products** | Publisher Dashboard, Portfolio Health Score, Market Opportunity Explorer |
| **Dependencies** | M25 Studio Intelligence, M27 Marketplace Intelligence, M23 Recommendation Engine |

**Key features:**
- Portfolio-level analytics across multiple games
- Revenue forecasting per game + portfolio aggregate
- Market gap analysis ("No farming sim on Nintendo Switch in your region")
- Cross-promotion recommendations between publisher's own games

---

## Timeline Summary

| Week | M23 — Rec Engine | M26 — Search | M25 — Studio Intel | M22 — Assistant | M24 — Moderation |
|---|---|---|---|---|---|
| 1 | Data pipeline | — | — | — | — |
| 2 | Game embeddings | — | — | — | — |
| 3 | Collaborative filtering | Embedding pipeline | Analytics data prep | — | — |
| 4 | Hybrid scoring | Hybrid search index | Store page analyzer | — | — |
| 5 | A/B framework | NLU query parsing | Wishlist predictor | ChatWidget UI | — |
| 6 | Taste Profile builder | Re-ranking + migration | Sentiment analyzer | Context injection | — |
| 7 | Emotional Discovery | Emotion browse UI | Text Gen + Devlog Drafts | Player features | — |
| 8 | Inference + launch | — | Launch readiness scoring | Studio features | — |
| 9 | — | — | Competitor analysis | Polish + launch | — |
| 10 | — | — | Dashboard widgets | — | — |

**Total duration:** 10 weeks (parallel execution across workstreams)
**Peak team:** 3-4 engineers (1 on M23 + M26, 1 on M25, 1 on M22, 0.5 on shared infra)

---

## Shared Infrastructure Timeline

| Component | Used By | Build Week | Owner |
|---|---|---|---|
| Game embeddings (pgvector) | M23, M26, M25 | 2 | M23 team |
| User embeddings (pgvector) | M23, M25 | 3 | M23 team |
| Hybrid scoring layer | M23, M26 | 4 | M23/M26 shared |
| A/B testing framework | M23, M26, M25 | 5 | M23 team |
| Text Generation pipeline | M25, M22 | 7 | M25 team |
| RAG pipeline | M26, M22 | 6 | M22 team |
| AI endpoint rate limiting | All | 1 | Shared infra |
| AI audit logging | All | 1 | Shared infra |

---

## Cost Estimate V2

| Resource | V1 Estimate | V2 Estimate | Change |
|---|---|---|---|
| LLM API (GPT-4o-mini / Claude Haiku) | $200-500 | $150-400 | Lower — devlog drafts are batch, not real-time; chat volume lower initially |
| Embedding API (text-embedding-3-small) | $20-50 | $10-30 | Lower — embeddings cached aggressively; re-computed only on game update |
| pgvector compute | $0 | $0 | Unchanged (on Neon) |
| Offline training compute (Python) | $30-80 | $20-50 | Lower — training runs 2h/night, smaller model |
| **Total monthly** | **$250-630** | **$180-480** | 28% lower due to caching + batch-first architecture |

---

## Quality Gates

Each milestone must pass before being marked complete:

| Gate | Criteria |
|---|---|
| Capability Hierarchy compliance | Every product (Layer 3) uses at least one Layer 2 capability. Every Layer 2 capability is mapped to at least one Layer 3 product. |
| Business Value alignment | The milestone's primary capabilities are Tier 1 or Tier 2 on the Business Value Matrix. |
| TypeScript | 0 errors in `tsc --noEmit` |
| ESLint | 0 errors |
| Tests | Minimum 80% coverage on new AI modules |
| Production smoke | AI endpoints return 200 with valid API key |
| Rate limiting | Verified 10 req/min enforced, 429 returned on excess |
| Audit logging | All AI responses logged with model + latency |
| Product principle compliance | Time-savings benchmark (Goal 1), newness measurement (Goal 2), dual revenue-satisfaction tracking (Goal 3), human-appeal-path verification (Goal 4) |
| A/B validation | (M23, M26) Statistically significant improvement over baseline (p < 0.05) |
| Feature flag | Deployed behind feature flag. Toggleable without deploy. |

---

## Rollback Strategy

1. **Feature flags:** All AI features behind env-var flags — toggle off without deploy
2. **Graceful degradation:** If LLM API is down, AI features show "temporarily unavailable" — non-AI flows unaffected
3. **A/B fallback:** ML recommendations run alongside static scorers — failback to static if ML errors
4. **Database:** New tables (game_embeddings, user_embeddings, studio_insights, ai_audit_logs) are additive
5. **Canary deployment:** 5% → 25% → 100% rollout with 24h monitoring between each step

---

## Post-M26 Strategic Vision

After Phase 6 milestones ship, the platform will have:

1. **AI-powered discovery** (M23 + M26): Players find games through natural language and personalized recommendations, not tag filters and chronologically-sorted lists.
2. **AI-powered studio growth** (M25 + M22): Studios get data-driven store page optimization, wishlist forecasting, sentiment analysis, and AI-assisted content creation.
3. **AI-powered marketplace intelligence** (M27, future): Sellers get pricing insights, bundle suggestions, and fraud protection. Buyers discover complementary assets.
4. **AI-powered community health** (M24 + M28, future): Toxic content and spam are handled by AI before users see it. Communities self-organize through auto-generated FAQs and quality-weighted discussions.
5. **AI-powered publisher analytics** (M29, future): Studios managing multiple games get portfolio-level intelligence.

At that point, Playmorrow will be the only indie game platform where AI is not a chatbot bolted onto the sidebar — it is the operating system of discovery, embedded in every surface, invisible to users, and transformative for studios.
