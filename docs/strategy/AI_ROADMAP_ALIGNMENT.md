# AI Roadmap Alignment — Playmorrow

Review of each Phase 6 milestone against the AI philosophy, product principles, and business goals. Every milestone is evaluated for strategic fit before implementation begins.

---

## AI Philosophy

> **Assist Never Replace.** AI augments human creativity and decision-making. It surfaces insights, drafts content, and flags issues — but humans always have the final say. No AI-generated content is published without human review. No AI moderation action is taken without human confirmation above a confidence threshold.

### Core Principles

1. **Always Explain Recommendations** — Every AI suggestion includes a human-readable reason
2. **Respect Player Autonomy** — AI features are opt-in where possible; recommendations can be dismissed
3. **Respect Studio Ownership** — Studios own their data and AI outputs; no cross-studio training without consent
4. **Privacy By Default** — AI features work with minimal personal data; embeddings are anonymous where possible
5. **Reduce Friction** — AI should make things faster, not add steps
6. **Be Domain-Specialized** — Gaming-specific models and prompts, not generic ChatGPT wrappers
7. **Be Measurable** — Every AI feature ships with KPIs (see AI_SUCCESS_METRICS.md)
8. **Fail Gracefully** — When AI fails, the platform still works (fallback to non-AI behavior)
9. **Create Real Value** — No AI for AI's sake; features must solve real user problems

### Product Goals

| Goal | Description |
|------|-------------|
| **Improve Discovery** | Help players find games they'll love |
| **Save Users Time** | Reduce manual effort for players and studios |
| **Increase Trust** | Build a safer, more transparent platform |
| **Increase Revenue** | Drive marketplace and creator economy growth |

---

## M22 — AI Assistant

### Summary
Embed contextual AI across the platform so players and studios can get instant, relevant help. An AI copilot available from any page that understands Playmorrow's domain — games, devlogs, marketplace listings, and community content.

### Strategic Alignment

| Dimension | Assessment |
|-----------|------------|
| **Why it exists** | Players struggle to navigate a growing catalog; studios spend hours on routine content creation. An AI assistant embedded in-context reduces this friction immediately. |
| **Principles satisfied** | Assist Never Replace (drafts, doesn't publish), Reduce Friction (in-context help), Be Domain-Specialized (trained on game/devlog data), Create Real Value (solves navigation + writing problems) |
| **Product goals** | Save Users Time (primary — instant answers + content drafts), Improve Discovery (secondary — assistant can suggest games) |
| **Expected business impact** | 40% fewer support inquiries about finding games; 25% more devlog publishing frequency |
| **Expected user impact** | Players discover games faster without browsing; studios draft devlogs in minutes instead of hours |
| **Risks** | **Hallucinated game facts** — mitigated by RAG grounding in game database + explicit "this info comes from [source]" citations. **Cost at scale** — mitigated by gpt-4o-mini as default model with Claude fallback. **Over-reliance** — mitigated by making AI suggestions clearly labelled and dismissible. |
| **Dependencies** | AI Foundation (complete); needs RAG pipeline for game/devlog content |
| **KPIs** | Daily assistant users, assistant-driven game discoveries, devlog drafts accepted, assistant satisfaction NPS |
| **Decision Framework** | **Passes** — serves time-saving + discovery goals, measurable, explainable, fail-safe (degrades gracefully to no-AI platform behavior) |

### Technical Approach
- Contextual sidebar/panel on game pages, dashboard, and marketplace
- Grounded in Playmorrow data via RAG (not generic web knowledge)
- Streaming responses for perceived low latency
- Conversation memory scoped per session with summarization

---

## M23 — Recommendation Engine

### Summary
Replace static scoring heuristics with ML-based personalized recommendations. Uses collaborative filtering + content-based embeddings to surface games players are most likely to enjoy, with transparent explanations.

### Strategic Alignment

| Dimension | Assessment |
|-----------|------------|
| **Why it exists** | The current feed engine uses static rules (chronological + engagement scores). As the catalog grows beyond 100+ games, personalized recommendations become essential for discovery. Without ML, the homepage becomes noise. |
| **Principles satisfied** | Always Explain Recommendations (every rec shows "Because you liked X" or "Popular in Y genre"), Respect Player Autonomy (dismissible, tuneable preferences), Privacy By Default (on-device preference learning where possible), Be Measurable (CTR, conversion, diversity scores), Create Real Value (directly improves the core user journey) |
| **Product goals** | Improve Discovery (primary), Increase Trust (secondary — transparent why) |
| **Expected business impact** | 35% CTR improvement over baseline feed; 20% more wishlist additions from recommendation surfaces |
| **Expected user impact** | Dramatically better game discovery; less time scrolling; more games found that match individual taste |
| **Risks** | **Cold start problem** — new users with no history get poor recommendations; mitigated by content-based fallback (genre/popularity) + onboarding preference quiz. **Training data quality** — mitigated by user feedback loop (thumbs up/down on recommendations). **Filter bubble** — mitigated by serendipity injection (ensuring diversity score > 0.3). |
| **Dependencies** | Game embeddings from M22 (RAG pipeline), user interaction history, A/B testing framework for validation |
| **KPIs** | Recommendation CTR, wishlist conversion rate, diversity score, serendipity score, recommendation acceptance rate |
| **Decision Framework** | **Passes** — highest-value AI feature, directly measurable, provider-agnostic architecture (swappable between OpenAI/Claude/local embeddings) |

### Technical Approach
- Hybrid: collaborative filtering (user-user similarity) + content-based (game embedding similarity)
- Embeddings stored in pgvector, refreshed nightly
- A/B test framework: 10% traffic to ML recommendations vs. baseline feed
- Real-time re-ranking based on session context (current page, recent interactions)

---

## M24 — AI Moderation

### Summary
Scale content moderation beyond human capacity using AI-powered content flagging. Comments, devlogs, marketplace listings, and user profiles are screened automatically, with human-in-the-loop review for edge cases.

### Strategic Alignment

| Dimension | Assessment |
|-----------|------------|
| **Why it exists** | As the platform grows, manual moderation doesn't scale. AI moderation provides instant first-pass screening so human moderators focus on edge cases. Without it, toxic content goes unchecked during off-hours. |
| **Principles satisfied** | Assist Never Replace (human-in-the-loop for all actions), Fail Gracefully (flag for review, never auto-block), Be Measurable (false positive rate tracked weekly), Create Real Value (safer community = higher retention) |
| **Product goals** | Increase Trust (primary — cleaner, safer community), Save Users Time (secondary — faster moderation turnaround) |
| **Expected business impact** | 60% reduction in moderation response time; 80% of spam auto-detected before user reports |
| **Expected user impact** | Cleaner community discussions; faster response to toxic content; fewer negative experiences |
| **Risks** | **False positives** blocking legitimate content — mitigated by human review for all flags + confidence threshold (only auto-hide above 0.95 confidence). **Cultural context errors** — mitigated by gaming-domain fine-tuning + appeal process. **Adversarial evasion** — mitigated by continuous model updates + user reporting as backup. |
| **Dependencies** | Existing moderation queue + reports system, training data from historically reported content |
| **KPIs** | False positive rate, moderation time-to-resolution, user reports per day, moderation accuracy |
| **Decision Framework** | **Passes** — essential for platform trust at scale; human-in-the-loop design respects the philosophy; measurable via existing moderation queue infrastructure |

### Technical Approach
- Multi-class classifier: toxic, spam, harassment, self-promotion, NSFW
- Confidence scores per category; auto-hide only above 0.95
- Human review queue for 0.70–0.95 confidence
- Appeals process: users can request re-review of AI-flagged content
- Weekly model evaluation against ground truth from human reviewers

---

## M25 — Studio Intelligence

### Summary
Give indie studios the analytical capabilities that AAA studios have dedicated data teams for. AI-powered dashboards with trend analysis, sentiment tracking, competitor benchmarking, and launch readiness predictions.

### Strategic Alignment

| Dimension | Assessment |
|-----------|------------|
| **Why it exists** | AAA studios employ data analysts; indie studios don't have that budget. AI analytics democratizes data-driven decision making. This is Playmorrow's strongest differentiator vs. Steam/Epic — neither offers AI analytics to all studios. |
| **Principles satisfied** | Respect Studio Ownership (studios own their analytics data; no cross-studio data leakage), Reduce Friction (replaces spreadsheets + guesswork), Be Domain-Specialized (gaming metrics, not generic analytics), Create Real Value (directly impacts publishing and revenue decisions) |
| **Product goals** | Increase Revenue (primary — better store pages + pricing = more sales), Save Users Time (secondary — replaces manual analysis) |
| **Expected business impact** | 30% more frequent devlog publishing; 25% better store page conversion (wishlists per visitor) |
| **Expected user impact** | Studios make data-informed decisions about pricing, store page content, and launch timing without hiring analysts |
| **Risks** | **Inaccurate predictions** damaging credibility — mitigated by confidence intervals on all predictions + explicit "this is an estimate" language. **Data privacy between studios** — mitigated by strict data isolation; no cross-studio training. **Over-reliance on AI** — mitigated by educational content alongside insights explaining the "why". |
| **Dependencies** | Analytics data pipeline (must have sufficient historical data for meaningful trends), historical game performance data for benchmark comparisons |
| **KPIs** | Insight cards viewed, actions taken from insights, studio retention rate, launch readiness score accuracy |
| **Decision Framework** | **Passes** — unique differentiator; directly tied to revenue goal; no competitor offers this for free; measurable via studio retention + conversion rates |

### Technical Approach
- Insight cards: bite-sized AI findings surfaced on studio dashboard
- Trend detection: anomaly detection on follower/wishlist/comment time series
- Sentiment tracking: NLP on comments + devlog reactions, trended over time
- Competitor benchmarking: anonymized genre averages (never individual studio data)
- Launch readiness: ML model trained on historical launch data predicting wishlist counts
- All insights include confidence intervals and plain-English explanations

---

## M26 — Semantic Search

### Summary
Replace tag-based filtering with natural language game search. Players can describe what they want in plain English — "cozy farming game with romance and no combat" — and get relevant results even if no tags match exactly.

### Strategic Alignment

| Dimension | Assessment |
|-----------|------------|
| **Why it exists** | Tag-based search fails when players don't know the right tags, or when game experiences span multiple tags in nuanced ways. Semantic search captures intent, not just keywords. |
| **Principles satisfied** | Reduce Friction (no need to learn tag taxonomy), Be Domain-Specialized (game-specific embeddings), Fail Gracefully (falls back to keyword search when embeddings unavailable), Create Real Value (directly addresses the "I don't know how to search for this" problem) |
| **Product goals** | Save Users Time (primary — find games faster), Improve Discovery (primary — find games you couldn't with tags alone) |
| **Expected business impact** | 50% fewer zero-result searches; 40% more search-to-wishlist conversions |
| **Expected user impact** | "Find me a cozy farming game with romance options" just works. No more learning which tags to use. |
| **Risks** | **Embedding quality for niche genres** — mitigated by game-specific training data + fine-tuning on indie game corpus. **Multi-language support** — mitigated by starting English-only, expanding via multilingual embeddings. **Query ambiguity** — mitigated by returning diverse results + "Did you mean?" suggestions. |
| **Dependencies** | Game embeddings from M22 (RAG pipeline), pgvector search infrastructure, hybrid search (semantic + keyword fusion) |
| **KPIs** | Zero-result rate, search-to-click rate, search-to-wishlist rate, query understanding accuracy, semantic search adoption % |
| **Decision Framework** | **Passes** — highest friction-reduction feature for players; directly measurable via search analytics; falls back gracefully to existing keyword search |

### Technical Approach
- Dual-encoder: game descriptions embedded into pgvector; user queries embedded at search time
- Hybrid retrieval: semantic similarity + keyword BM25 fusion (reciprocal rank fusion)
- Query understanding: extract genre, mechanics, theme, platform from natural language queries
- Real-time: embeddings computed at search time; game embeddings refreshed on content changes
- Explainability: "Found X because it matches your description of Y"

---

## Cross-Milestone Dependencies

```
                    ┌─────────────────────────┐
                    │     M22 — AI Assistant   │
                    │   (Foundation + RAG)     │
                    └───────────┬─────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│  M23 — Rec Engine │ │ M24 — Moderation  │ │ M25 — Studio Intel│
│  (Recommendations)│ │  (Safety)         │ │  (Analytics)      │
└─────────┬─────────┘ └───────────────────┘ └───────────────────┘
          │
          ▼
┌───────────────────┐
│ M26 — Semantic    │
│       Search      │
└───────────────────┘
```

### Dependency Logic

| Milestone | Depends On | Why |
|-----------|-----------|-----|
| M23 (Recommendations) | M22 (RAG + embeddings) | Recommendations use the same game embeddings as the RAG pipeline; building embeddings once serves both features |
| M24 (Moderation) | M22 (Foundation) | Uses the same provider abstraction and moderation endpoints from the AI Foundation; no dependency on the game RAG pipeline |
| M25 (Studio Intelligence) | M22 (Foundation) | Uses chat/analysis endpoints from the foundation; requires historical data but not game embeddings |
| M26 (Semantic Search) | M22 (embeddings) + M23 (ranked retrieval) | Uses game embeddings for search; benefits from recommendation ranking models for result ordering |

### Execution Strategy

M22 must ship first — it builds the RAG pipeline that M23 and M26 depend on. M24 and M25 can be developed in parallel with M23 since they don't share infrastructure dependencies.

**Recommended order:**
1. M22 (AI Assistant + RAG) — Week 1-6
2. M23 (Recommendations) + M24 (Moderation) — Week 4-12 (parallel)
3. M26 (Semantic Search) — Week 10-14 (after M23 embeddings mature)
4. M25 (Studio Intelligence) — Week 4-12 (parallel with M23, no shared infra)

---

## Milestone Decision Scorecard

| Milestone | Philosophy Fit | Measurable | Risks Managed | Dependencies Clear | Value Score | **Verdict** |
|-----------|---------------|------------|---------------|--------------------|-------------|-------------|
| M22 — AI Assistant | High | Yes | Yes | Yes (complete) | 8/10 | **Approved** |
| M23 — Recommendations | High | Yes | Yes | Yes (M22) | 10/10 | **Approved** |
| M24 — Moderation | High | Yes | Yes | Yes | 7/10 | **Approved** |
| M25 — Studio Intelligence | High | Yes | Yes | Yes | 9/10 | **Approved** |
| M26 — Semantic Search | High | Yes | Yes | Yes (M22+M23) | 8/10 | **Approved** |

**All 5 milestones pass the decision framework.** No milestone violates the AI philosophy. Every milestone serves at least 2 product goals and has clear, measurable KPIs.

---

## What We Will NOT Build

Equally important: features that were considered and rejected because they violate the philosophy or don't create real value.

| Rejected Feature | Reason |
|-----------------|--------|
| AI-generated games (auto-create game listings) | Violates Respect Studio Ownership; studios must control their store presence |
| Full auto-moderation (AI blocks content without review) | Violates Assist Never Replace + Fail Gracefully |
| AI pricing that auto-changes studio prices | Violates Respect Studio Ownership; pricing is the studio's decision |
| Player behavior prediction for ad targeting | Violates Privacy By Default; Playmorrow does not sell user data |
| AI-generated reviews posing as real players | Violates Always Explain + Increase Trust; deceptive |
| Fully autonomous AI agent publishing content | Violates Assist Never Replace; human must always approve |
| Cross-studio training data sharing | Violates Respect Studio Ownership + Privacy By Default |

---

## Review Cadence

| Event | Frequency | Attendees | Purpose |
|-------|-----------|-----------|---------|
| Milestone kickoff | Per milestone | Engineering + Product | Review alignment, KPIs, risks before starting |
| Mid-milestone check | Biweekly | Engineering lead | Verify KPI tracking, adjust risks |
| Milestone retrospective | After each milestone | Full team | Compare actual vs expected impact; update roadmap |
| Quarterly strategic review | Quarterly | Engineering + Product + Leadership | Review all KPIs; adjust Phase 6 priorities |
