# M23 — Recommendation Engine (Hybrid)

**Milestone:** M23 — Recommendation Engine (AI & Platform Intelligence)
**Status:** 🟢 LIVE — governed 5% rollout, hardened (2026-08-09)
**Plan:** [`docs/ai/M23_IMPLEMENTATION_PLAN.md`](M23_IMPLEMENTATION_PLAN.md)
**Certifications:** [`docs/releases/M23_CERTIFICATION.md`](../releases/M23_CERTIFICATION.md) ·
[`docs/releases/M23_FINAL_HARDENING_CERTIFICATION.md`](../releases/M23_FINAL_HARDENING_CERTIFICATION.md) (🟢 READY FOR 25% GATE)
**Architecture:** [`AI_RECOMMENDATION_ARCHITECTURE.md`](AI_RECOMMENDATION_ARCHITECTURE.md) (current, authoritative)
**Related:** [AI Constitution](../../docs/strategy/AI_CONSTITUTION.md) · [Rollout](M23_ROLLOUT.md) · [Metrics](M23_METRICS.md)

> **2026-08-09 (Final Hardening):** personalization is now consent-gated
> (default off), impressions/CTR are instrumented (C-2), the embedding model
> is config-driven (C-3/T-1), refresh has dimension-abort + empty-catalog
> guards, ordering is deterministic, and the explainability fallback never
> fabricates. See the final hardening certification.

---

## What This Is

The **For You** game feed: a hybrid recommendation engine combining semantic
taste signals (vector similarity over game embeddings) with the legacy scoring
system as a reliability floor. When no AI signals exist, the feed is exactly
what the legacy system would have shown — so the feature **cannot be worse
than today**.

Rollout is progressive: 5% of users (stable hash bucket) get the new feed;
everyone else gets the legacy feed untouched. One env flag flips it off.

## Why Hybrid

The M23 plan proved a single-method engine is brittle (pure-AI fails on cold
start; pure-legacy never improves). The hybrid architecture gives:

| Method | Role | Failure mode | Result |
|---|---|---|---|
| Semantic | Primary personalization | Provider down / no embeddings | Skip → next |
| Legacy | Reliability floor | Never fails (pure DB math) | Always available |

Failure of the AI layer changes *rankings*, never *availability*. This is
Constitution Article 8 (Fail Gracefully) verified at the data-availability
layer.

## Architecture

```
                 ┌──────────────────────────────────────────────┐
   GET /for-you  │  ForYouController                             │
   (session)     │  └─ rollout bucket (stable hash on userId)    │
                 │     └─ HybridRecommenderService               │
                 │        ├─ flags: enabled / personalize /      │
                 │        │          semantic                    │
                 │        ├─ TasteSignalService                  │
                 │        │   ├─ wishlist (0.35)  views (0.25)   │
                 │        │   └─ tag affinity (0.25)  studio      │
                 │        │      affinity (0.05)  recency (0.10) │
                 │        ├─ SemanticCandidateService            │
                 │        │   ├─ embed signal-game titles (≤8)   │
                 │        │   ├─ cosine vs game_embeddings       │
                 │        │   └─ MMR diversify top 50            │
                 │        └─ legacy fallback (trending + hidden  │
                 │            gems + recent updates)             │
                 └──────────────────────────────────────────────┘
```

### Components

| File | Role |
|---|---|
| `for-you.controller.ts` | HTTP surface, session auth, rollout bucket check |
| `hybrid-recommender.service.ts` | Orchestration, flag logic, MMR, fallbacks |
| `taste-signal.service.ts` | Signal weighting (from wishlists, views, tags, studio, recency) |
| `game-embedding.repository.ts` | `game_embeddings` table access + semantic candidate lookup |
| `game-embedding-refresh.service.ts` | Nightly (3am) embedding refresh for published games |
| `recommendation-feedback.service.ts` | `FeedbackEvent` writes, dismissal window, validation |
| `SemanticSearchService` (`ai/services/`) | KNN vector search (`embedding <=> query`), 5-game cap, fallback chain |
| `recommendation.controller.ts` | `GET /api/ai/recommendations` (admin/content, debug-safe) |

### Config (env)

| Env | Default | Meaning |
|---|---|---|
| `RECOMMENDATIONS_ENABLED` | `true` | Master kill switch. `false` = legacy feed for everyone |
| `RECOMMENDATIONS_ROLLOUT_PCT` | `5` | Percent of users in the new-feed bucket |
| `RECOMMENDATIONS_PERSONALIZE` | `true` | Use taste signals (else trending floor) |
| `RECOMMENDATIONS_SEMANTIC` | `true` | Use semantic candidates (else content/legacy) |
| `RECOMMENDATIONS_CACHE_REFRESH` | `true` | Nightly embedding refresh cron |
| `RECOMMENDATIONS_FEED_REFRESH_MS` | `180000` | Client auto-refresh of the feed (3 min) |

### Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/ai/recommendations/for-you?cursor=` | Session | Cursor-paginated hybrid feed |
| `POST /api/ai/recommendations/feedback` | Session | Record `CLICKED` / `DISMISSED` / `WISHLISTED` |
| `GET /api/ai/recommendations` | Session | Content-level recs for the game detail page |
| `GET /api/ai/health` | Public | Provider status (degraded / OK) |

### Frontend

| File | Role |
|---|---|
| `components/discovery/ForYouFeed.tsx` | Feed UI: cards, cursor pagination, dismiss (×), click → detail, explainer line ("Because you…"), `refetchInterval` |
| `app/page.tsx` | Homepage now uses `ForYouFeed` when authenticated |
| `lib/api/hooks.ts` | `useForYouFeed`, `useRecordRecommendationFeedback`, `useSemanticSearch`, `useAiHealth` |

## Ranking Pipeline

1. **Rollout bucket** — stable `hash(userId) % 100 < pct`? If not, legacy feed
   (zero AI cost).
2. **Signals** — weight wishlists 0.35, views 0.25, tag affinity 0.25, studio
   affinity 0.05, recency 0.10 (dedup; optional max-signal cap).
3. **Semantic** — embed up to 8 signal-game titles; cosine vs catalog
   embeddings; exclude already-seen games; MMR diversity on top 50 with
   `lambda=0.7`.
4. **Fallbacks** — no signals → legacy trending; no embeddings → content-based
   (recent + hidden gems + trending); provider down → same content fallback
   (live-verified).
5. **Rendering** — card details in one query; reason + reasonType per item;
   `nextCursor` present while more pages exist.

## Operations

- **Refresh:** `GameEmbeddingRefreshService` — nightly 03:00 UTC, published
  games only, upsert rows, deletes embeddings for games no longer published
  (orphan cleanup).
- **Dashboard:** `GET /api/ai/recommendations` returns embeddings count +
  provider status for debugging.
- **Kill switch:** set `RECOMMENDATIONS_ENABLED=false` → all users get legacy
  feed instantly. Tested in unit spec (`returns legacy result when rollout is
  disabled`).

## Known Limitations

1. Provider's `embed()` hardcodes `text-embedding-ada-002`
   (`openai.provider.ts:306`); `AI_EMBEDDING_MODEL` only affects chat-context
   embeddings. Both are 1536-dim, so the `vector(1536)` column is compatible.
2. ≤8 signal-game titles embedded per request (tiny cost, ~280 tokens;
   see [M23_METRICS.md](M23_METRICS.md)). Plan originally targeted $0/request.
3. Cursor pagination over MMR output may skip/duplicate an item on page
   boundaries (documented, non-blocking).
4. No per-user personalization opt-out in settings yet (governance condition —
   see certification).
