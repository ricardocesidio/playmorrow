# Playmorrow AI — Product Tree

**Date:** 2026-08-05
**Status:** Planning (Phase 6)
**Depends on:** [AI Architecture](./AI_ARCHITECTURE.md), [AI Dependency Graph](./AI_DEPENDENCY_GRAPH.md), [Phase 6 Roadmap](./PHASE6_ROADMAP.md)

---

## Table of Contents

1. [How to Read This Tree](#how-to-read-this-tree)
2. [Player Experience](#player-experience)
3. [Studio Experience](#studio-experience)
4. [Marketplace Experience](#marketplace-experience)
5. [Community Experience](#community-experience)
6. [Feature Priority Index](#feature-priority-index)
7. [Build Sequence by Business Value](#build-sequence-by-business-value)

---

## How to Read This Tree

```
EXPERIENCE AREA (who benefits)
├── Feature Category (grouping)
│   ├── Leaf Feature (what users see)
│   │   └─↓ Powers by: capability that makes this work
│   │
│   ├── Leaf Feature
│   │   └─↓ Powers by: capability
│   │
│   └── [Mxx] = maps to Phase 6 milestone
│
└── Feature Category
```

**Tier symbols:**
- 🟢 **Tier 1** — Ship first. Highest user value + differentiation. M23+M26.
- 🔵 **Tier 2** — Ship second. Studio value + retention. M25.
- 🟡 **Tier 3** — Ship third. Quality of life + trust. M22a+M24.
- ⚪ **Tier 4** — Post-Phase 6. Future exploration.

**Status indicators:**
- `[✓]` Built (Session 22 foundation enables this)
- `[→]` Phase 6 target (in-scope for current roadmap)
- `[·]` Future (post-Phase 6 exploration)

---

## Player Experience

```
PLAYER EXPERIENCE
│
├── Discovery 🟢 Tier 1
│   │
│   ├── [→] Smart Search (natural language)                  M26
│   │   └─↓ C1 (NLU) + C2 (Embeddings) + C7 (Semantic Rank)
│   │   └─↓ "I want a pixel art metroidvania with a sad story"
│   │   └─↓ Hybrid: semantic (0.6) + keyword (0.3) + popularity (0.1)
│   │   └─↓ Priority Score: 12.7 — Approved
│   │
│   ├── [→] Personalized Recommendations Feed              M23
│   │   └─↓ C8 (Collab Filter) + C9 (Taste Profile) + C7 (Semantic Rank)
│   │   └─↓ "Because you liked Celeste and follow Matt Makes Games..."
│   │   └─↓ Priority Score: 14.7 — #1 overall
│   │
│   ├── [→] "Because You..." Explainability                   M23
│   │   └─↓ C11 (Explain) + C1 (NLU)
│   │   └─↓ Every recommendation includes visible reason
│   │   └─↓ Principle 2: Always Explain Recommendations
│   │
│   ├── [·] Mood Browser (Browse by Emotion)                  Post-M26
│   │   └─↓ C1 (NLU) + C6 (Sentiment) + C2 (Embeddings)
│   │   └─↓ Filters: melancholic, exciting, cozy, tense, hopeful, nostalgic
│   │   └─↓ Emotion tags from community sentiment + studio tagging
│   │
│   ├── [·] Hidden Gems (Under-Reviewed Games)                Post-M23
│   │   └─↓ C7 (Semantic Rank) + quality/review-count ratio
│   │   └─↓ Surfaces games with high quality but low visibility
│   │   └─↓ Currently served by static HiddenGemsScorer (Phase 5)
│   │
│   ├── [·] Game Comparison (Side-by-Side)                    Post-M26
│   │   └─↓ C1 (NLU) + C2 (Embeddings) + structured attributes
│   │   └─↓ "Compare these 3 games": mechanics, mood, price, reviews
│   │
│   └── [·] "If You Liked X, Try Y" Carousel                 Post-M23
│       └─↓ C7 (Semantic Rank) + C8 (Collab Filter)
│       └─↓ Appears on game detail page sidebar
│
├── Game Understanding 🔵 Tier 2
│   │
│   ├── [→] AI Game Summaries                                  M22
│   │   └─↓ C1 (NLU) + C4 (RAG)
│   │   └─↓ "Explain this game to me" → natural language summary
│   │   └─↓ Pulls from description, devlogs, community sentiment
│   │
│   ├── [·] Review Summaries (Pros/Cons)                      Post-M25
│   │   └─↓ C6 (Sentiment) + C1 (NLU)
│   │   └─↓ Aggregates community reviews → structured pros/cons
│   │   └─↓ "Players love: combat system. Players criticize: short campaign"
│   │
│   ├── [·] Difficulty Guide                                   Post-M25
│   │   └─↓ C1 (NLU) + community sentiment
│   │   └─↓ AI-generated difficulty estimate: "Harder than Hollow Knight, easier than Dark Souls"
│   │
│   └── [·] Accessibility Guide                                Post-M25
│       └─↓ C1 (NLU) + game metadata
│       └─↓ Auto-generates accessibility notes from game features
│
├── Collection 🟡 Tier 3
│   │
│   ├── [·] Wishlist Intelligence (When to Buy)               Post-M25
│   │   └─↓ C12 (Forecasting) + marketplace data
│   │   └─↓ "This game typically goes on sale 6 months after launch"
│   │   └─↓ "Price has never dropped below $12.99"
│   │
│   ├── [·] Backlog Prioritizer                               Post-M25
│   │   └─↓ C9 (Taste Profile) + C12 (Forecasting) + metadata
│   │   └─↓ "Based on your taste profile, play Hollow Knight first"
│   │   └─↓ Factors: genre affinity, playtime estimate, review scores
│   │
│   └── [→] Gaming Taste Profile                                M23
│       └─↓ C9 (Taste Profile) + C8 (Collab Filter)
│       └─↓ Per-user vector: genre weights, mechanic preferences, mood
│       └─↓ Updated continuously from follows, wishlists, reactions, views
│       └─↓ User controls: toggle signals, reset history, opt out
│
└── Exploration 🟡 Tier 3
    │
    ├── [·] "Surprise Me" Button                               Post-M23
    │   └─↓ C7 (Semantic Rank) + diversity maximization
    │   └─↓ Deliberately surfaces games outside user's usual genres
    │
    └── [·] Discovery Quests                                   Post-M26
        └─↓ C1 (NLU) + C7 (Semantic Rank)
        └─↓ Gamified discovery: "Find a game under $10 made by a solo dev"
        └─↓ Earn XP for exploring new genres
```

---

## Studio Experience

```
STUDIO EXPERIENCE
│
├── Analytics 🔵 Tier 2
│   │
│   ├── [→] Store Page Optimizer                               M25
│   │   └─↓ C1 (NLU) + C6 (Sentiment) + genre benchmarks
│   │   └─↓ "Your description is 40% shorter than top-performing RPGs"
│   │   └─↓ "Add 'procedural generation' tag — 78% of similar games use it"
│   │   └─↓ Priority Score: 13.7 — #2 overall
│   │
│   ├── [→] Wishlist Forecaster                                M25
│   │   └─↓ C12 (Forecasting) + comparable game trajectories
│   │   └─↓ "Based on current velocity, expect 2,500 wishlists by launch"
│   │   └─↓ Confidence intervals shown; always labeled as "estimate"
│   │   └─↓ Priority Score: 13.7 — #2 overall
│   │
│   ├── [→] Launch Readiness Score                              M25
│   │   └─↓ C12 (Forecasting) + multi-factor composite
│   │   └─↓ Score 0-100: followers (25%) + wishlists (25%) + devlog freq (20%)
│   │   └─↓ + community engagement (20%) + press kit (10%)
│   │   └─↓ Priority Score: 13.7 — #2 overall
│   │
│   ├── [→] Player Sentiment Analyzer                           M25
│   │   └─↓ C6 (Sentiment) + C1 (NLU)
│   │   └─↓ Per-devlog sentiment: "80% positive reactions on latest devlog"
│   │   └─↓ Trend line: "Sentiment trending upward since gameplay reveal"
│   │   └─↓ Priority Score: 13.7 — #2 overall
│   │
│   └── [·] Revenue Insights (post-payments scale)            Post-Phase 6
│       └─↓ C12 (Forecasting) + marketplace transaction data
│       └─↓ Revenue dashboard with AI commentary: "Revenue up 22% MoM"
│
├── Content 🟡 Tier 3
│   │
│   ├── [→] Devlog Topic Suggester                              M25
│   │   └─↓ C6 (Sentiment) + C12 (Forecasting)
│   │   └─↓ "Devlogs about game mechanics drive 3x more wishlists"
│   │   └─↓ "You haven't posted in 12 days — engagement is dropping"
│   │
│   ├── [→] AI Devlog Draft                                     M22a
│   │   └─↓ C1 (NLU) + C4 (RAG) + PromptRegistry ("devlog_draft")
│   │   └─↓ Given bullet points → generates first-draft devlog post
│   │   └─↓ Studio reviews and edits before publishing
│   │   └─↓ Priority Score: 12.6 — Approved (M22a scope)
│   │
│   ├── [→] Tag Optimizer                                       M25
│   │   └─↓ C7 (Semantic Rank) + genre benchmarks
│   │   └─↓ "Games with tag 'roguelike' + 'deckbuilder' get 45% more views"
│   │   └─↓ Suggests tag additions AND removals (irrelevant tags hurt)
│   │
│   └── [·] Roadmap Item Suggester                              M22
│       └─↓ C1 (NLU) + genre benchmarks
│       └─↓ "Games in your genre typically announce a demo 8 weeks before launch"
│       └─↓ Part of M22 AI Assistant (studio context mode)
│
├── Competitive 🔵 Tier 2
│   │
│   ├── [→] Competitor Analysis                                 M25
│   │   └─↓ C7 (Semantic Rank) + C12 (Forecasting)
│   │   └─↓ "Your game ranks 3rd among 12 similar upcoming metroidvanias"
│   │   └─↓ Charts: wishlist velocity vs genre peers
│   │
│   ├── [·] Pricing Benchmark                                  Post-M25
│   │   └─↓ C12 (Forecasting) + marketplace data
│   │   └─↓ "Games with similar scope and quality price at $14.99-$19.99"
│   │   └─↓ Requires marketplace sales data (post-Phase 5 maturity)
│   │
│   └── [·] Genre Positioning                                  Post-M25
│       └─↓ C7 (Semantic Rank) + market gap analysis
│       └─↓ "No farming sim on Nintendo Switch in your region"
│       └─↓ Genre saturation index: how crowded is your target market?
│
└── Assistant 🟡 Tier 3
    │
    ├── [→] Page Context-Aware AI                               M22
    │   └─↓ C1 (NLU) + C4 (RAG) + C14 (Memory)
    │   └─↓ Assistant knows which page the user is viewing
    │   └─↓ Game page: injects game metadata
    │   └─↓ Dashboard: injects studio stats + pending actions
    │
    ├── [→] Analytics Interpreter                                M22
    │   └─↓ C1 (NLU) + C12 (Forecasting)
    │   └─↓ "Why did my wishlists drop this week?" → queries analytics, explains
    │   └─↓ Part of M22 AI Assistant (studio context mode)
    │
    └── [·] AI Copilot (full agentic workflow)                Post-Phase 6
        └─↓ C1 (NLU) + C4 (RAG) + EventBus integration
        └─↓ "Plan my indie game launch" → multi-step agent
        └─↓ Queries games, marketplace, events; assembles action plan
```

---

## Marketplace Experience

```
MARKETPLACE EXPERIENCE
│
├── Safety 🟢 Tier 1
│   │
│   ├── [·] Fraud Detection                                    Post-M24
│   │   └─↓ C13 (Fraud) + C5 (Moderation)
│   │   └─↓ Transaction pattern analysis: velocity, amount, geography
│   │   └─↓ Auto-flag suspicious transactions; freeze pending review
│   │
│   ├── [·] Counterfeit Detection                              Post-M24
│   │   └─↓ C13 (Fraud) + C5 (Moderation) + asset fingerprinting
│   │   └─↓ Detect duplicate/resold assets
│   │   └─↓ Image similarity + metadata comparison
│   │
│   └── [→] Seller Trust Score (AI component)                M24+
│       └─↓ C13 (Fraud) + transaction history + dispute ratio
│       └─↓ Composite trust score per seller
│       └─↓ AI enhances existing verification system
│
├── Commerce 🟡 Tier 3
│   │
│   ├── [·] Price Recommendation                              Post-M25
│   │   └─↓ C12 (Forecasting) + C7 (Semantic Rank)
│   │   └─↓ "Assets with similar quality/scope sell for $5-$15"
│   │   └─↓ Demand elasticity: "At $10, estimated 50 sales/month"
│   │
│   ├── [·] Bundle Suggestions                                Post-M25
│   │   └─↓ C7 (Semantic Rank) + marketplace purchase patterns
│   │   └─↓ "Creators who bought this 3D model also bought this texture pack"
│   │   └─↓ "Bundle these 3 assets — 35% of buyers purchase all three"
│   │
│   └── [·] Demand Forecast                                   Post-M25
│       └─↓ C12 (Forecasting) + marketplace trends
│       └─↓ "Demand for pixel art tilesets is up 40% this quarter"
│
└── Discovery 🟡 Tier 3
    │
    ├── [·] Related Assets                                      M26
    │   └─↓ C7 (Semantic Rank) + C2 (Embeddings)
    │   └─↓ "Similar assets" on marketplace listing pages
    │   └─↓ Asset embeddings: title + description + tags + visual features
    │
    └── [·] Creator Discovery                                   M26
        └─↓ C7 (Semantic Rank) + seller metrics
        └─↓ "Top pixel art creators" → ranked by quality, sales, trust
```

---

## Community Experience

```
COMMUNITY EXPERIENCE
│
├── Trust & Safety 🟢 Tier 1
│   │
│   ├── [→] Toxicity-Free Comments (AI Moderation)              M24
│   │   └─↓ C5 (Moderation) + C1 (NLU)
│   │   └─↓ Toxicity scoring 0-1; auto-flag >0.9, human review 0.5-0.9
│   │   └─↓ Deliberately deferred: Priority Score 6.7 at current scale
│   │   └─↓ Revisit when platform reaches >100K DAU
│   │
│   ├── [→] Spam-Free Discussions                               M24
│   │   └─↓ C5 (Moderation) + pattern matching
│   │   └─↓ ML classifier replacing current regex-based SpamDetectionService
│   │   └─↓ 80% spam caught before user reports (target)
│   │
│   └── [→] Trending Discussions (AI-curated)                 M23+
│       └─↓ C6 (Sentiment) + C12 (Forecasting)
│       └─↓ AI identifies rising discussions before they trend
│       └─↓ "This devlog is generating 3x normal engagement — feature it"
│
├── Content Quality 🟡 Tier 3
│   │
│   ├── [·] Review Quality Scoring                             Post-M24
│   │   └─↓ C5 (Moderation) + C1 (NLU)
│   │   └─↓ Detect low-effort reviews ("great game" → score 0.1)
│   │   └─↓ "This review is short. Consider adding more detail."
│   │
│   └── [·] Duplicate Detection                                Post-M24
│       └─↓ C7 (Semantic Rank) + C2 (Embeddings)
│       └─↓ "A similar discussion already exists — join it instead"
│       └─↓ Reduces fragmentation across duplicate threads
│
└── Engagement 🟡 Tier 3
    │
    ├── [·] Smart Notifications                                Post-M23
    │   └─↓ C9 (Taste Profile) + C12 (Forecasting)
    │   └─↓ "A game like your wishlisted 'Hollow Knight' was just announced"
    │   └─↓ AI-generated notification content, personalized per user
    │
    └── [·] Personalized Digest                                Post-M23
        └─↓ C1 (NLU) + C9 (Taste Profile)
        └─↓ Weekly email: "3 games you might like, 2 devlogs from followed studios"
        └─↓ Generates natural language summary of the week
```

---

## Feature Priority Index

All leaf features ranked by Priority Score (from [AI Feature Evaluation Matrix](./AI_FEATURE_EVALUATION_MATRIX.md)):

### In-Scope (Phase 6 Roadmap)

| # | Feature | Milestone | Score | Tier | Category |
|---|---|---|---|---|---|
| 1 | Personalized Recommendations Feed | M23 | 14.7 | 🟢 | Player > Discovery |
| 1 | "Because You..." Explainability | M23 | 14.7 | 🟢 | Player > Discovery |
| 2 | Store Page Optimizer | M25 | 13.7 | 🔵 | Studio > Analytics |
| 2 | Wishlist Forecaster | M25 | 13.7 | 🔵 | Studio > Analytics |
| 2 | Launch Readiness Score | M25 | 13.7 | 🔵 | Studio > Analytics |
| 2 | Player Sentiment Analyzer | M25 | 13.7 | 🔵 | Studio > Analytics |
| 3 | Smart Search (Natural Language) | M26 | 12.7 | 🟢 | Player > Discovery |
| 4 | AI Devlog Draft | M22a | 12.6 | 🟡 | Studio > Content |
| 5 | AI Game Summaries | M22 | 11.6* | 🔵 | Player > Game Understanding |
| 5 | Page Context-Aware AI | M22 | 11.6* | 🟡 | Studio > Assistant |
| 5 | Analytics Interpreter | M22 | 11.6* | 🟡 | Studio > Assistant |
| 6 | Toxicity-Free Comments | M24 | 6.7 | 🟢 | Community > Trust |
| 6 | Spam-Free Discussions | M24 | 6.7 | 🟢 | Community > Trust |

\* M22 full scope scored 11.6 (Needs redesign). M22a (devlog drafts only) scored 12.6 (Approved).

### Future (Post-Phase 6)

| # | Feature | Capability Needed | Estimated Priority |
|---|---|---|---|
| F1 | Mood Browser (Browse by Emotion) | C1 + C6 + C2 | UV=5, D=5 → ~14.0 |
| F2 | Hidden Gems (Under-Reviewed) | C7 + quality ratio | UV=4, D=4 → ~12.5 |
| F3 | Game Comparison (Side-by-Side) | C1 + C2 + attributes | UV=4, D=5 → ~13.5 |
| F4 | Review Summaries (Pros/Cons) | C6 + C1 | UV=4, D=4 → ~12.5 |
| F5 | Wishlist Intelligence (When to Buy) | C12 + marketplace | UV=4, D=5 → ~13.5 |
| F6 | Backlog Prioritizer | C9 + C12 | UV=3, D=5 → ~11.0 |
| F7 | Fraud Detection | C13 + C5 | UV=3, D=4 → ~10.5 |
| F8 | Price Recommendation | C12 + C7 | UV=3, D=4 → ~10.5 |
| F9 | Competitor Analysis | C7 + C12 | UV=4, D=5 → ~13.5 |
| F10 | Roadmap Item Suggester | C1 + benchmarks | UV=3, D=4 → ~10.5 |
| F11 | Review Quality Scoring | C5 + C1 | UV=2, D=3 → ~7.0 |

---

## Build Sequence by Business Value

### Phase 1: Core Discovery (Weeks 1-8, parallel)

```
M23 RECOMMENDATION ENGINE       M26 SEMANTIC SEARCH
│                               │
├─ Personalized Feed            ├─ Smart Search
├─ "Because You..."             ├─ Hybrid Ranking
├─ Gaming Taste Profile         └─ Query Intent
└─ Collaborative Filtering
        │                               │
        └─────── Shared: C2, C3, C7 ────┘
```

**Why first:** These are the platform's highest-value differentiators. Recommendations (14.7) + Search (12.7) together transform the core discovery experience. They share embedding infrastructure (C2, C3, C7), so building both simultaneously is efficient.

### Phase 2: Studio Empowerment (Weeks 3-8, overlapping)

```
M25 STUDIO INTELLIGENCE
│
├─ Store Page Optimizer
├─ Wishlist Forecaster
├─ Launch Readiness Score
├─ Player Sentiment Analyzer
├─ Tag Optimizer
├─ Competitor Analysis
├─ Devlog Topic Suggester
└─ Revenue Insights (future)
```

**Why second:** Studos that get discovered through M23/M26 stay because M25 gives them tools to grow. Shop-floor + analytics = platform lock-in. Starts week 3 because C6 (sentiment) and C12 (forecasting) have no dependency on the recommendation pipeline.

### Phase 3: Assistant & Quality (Weeks 3-8, overlapping)

```
M22a DEVLOG DRAFTS              M22 AI ASSISTANT
│                               │
├─ AI Devlog Draft              ├─ AI Game Summaries
├─ Content context injection    ├─ Page Context-Aware AI
└─ Prompt template iteration    ├─ Analytics Interpreter
                                └─ Roadmap Item Suggester (future)
```

**Why third:** Lower Priority Score means lower urgency. Benefits from embedding infrastructure being production-hardened by the time it launches. Devlog drafts (12.6) ship first as a quick win; full assistant (11.6) requires scope redesign or additional value.

### Phase 4: Trust & Safety (Post-Phase 6, scale-dependent)

```
M24 AI MODERATION
│
├─ Toxicity Classification
├─ Spam Detection (ML)
├─ Auto-Flagging Pipeline
├─ Human Review Queue
└─ Appeals System
```

**Why deferred:** Priority Score 6.7 at current scale. Becomes valuable at >100K DAU when human moderation costs become significant. The foundation (C5 Moderation) is already built and can be deployed quickly when needed.

---

## Feature Coverage Heatmap

| | Player | Studio | Marketplace | Community |
|---|---|---|---|---|
| 🟢 Tier 1 | 2 shipped (M23, M26) | 0 shipped | 0 shipped | 1 deferred (M24) |
| 🔵 Tier 2 | 1 shipped (M22) | 4 shipped (M25) | 0 shipped | 0 shipped |
| 🟡 Tier 3 | 2 future | 2 shipped (M22a) | 4 future | 3 future |
| ⚪ Tier 4 | 2 future | 2 future | 2 future | 2 future |
| **Total** | **7 features** | **8 features** | **6 features** | **6 features** |

**Phase 6 delivers:** 12 features across Player (3), Studio (7), and Community (2).
**Post-Phase 6:** 15 features across all four areas.
**Coverage balance:** Studio-heavy in Phase 6 — deliberately, because studios are the supply side and their tools compound platform value.

---

*This tree is updated as features are built, reprioritized, or deferred based on platform growth and user feedback.*
