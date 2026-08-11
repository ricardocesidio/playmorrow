# AI Recommendation Architecture

**Milestone:** M23 — Hybrid Recommendation Engine ("For You")
**Status:** LIVE (5% governed rollout) — hardened 2026-08-09
**Governing docs:** `AI_NORTH_STAR.md`, `AI_CONSTITUTION.md` (Art. 3, 5, 7, 8,
10, 12, 15, 16), `AI_GUIDING_PRINCIPLES.md` (Principles 2–3, 5, 8–10),
`PHASE6_ROADMAP.md`.

---

## 1. Purpose

A hybrid recommender that is **never worse than the legacy engine** and
**never violates consent**. Personalization runs only for users who opted in;
every recommendation carries a truthful explanation; every failure degrades
to the deterministic content path.

## 2. Data Flow

```
 User request (GET /recommendations/for-you)
   │
   ├─ Rollout gate (stable hash(userId) % 100 < ROLLOUT_PCT) ──┐
   │                                                           │
   │  OUT of bucket → legacy ranking (pre-AI floor)            │
   │                                                           │
   ├─ Consent gate (in bucket + personalizationEnabled === true) ──┐
   │  NO → deterministic content path (no personal data read)      │
   │                                                               │
   ├─ TasteSignalService.gather(userId)                             │
   │    wishlist (0.35) + game-page views (0.25) + tag affinity     │
   │    (0.25) + followed studios (0.10) + purchases (0.05)         │
   │                                                               │
   ├─ Semantic path: embed ≤8 signal-game titles → taste vector →  │
   │    KNN over game_embeddings (5 candidates, threshold 0.15)     │
   │    with dimension guard vs AI_EMBEDDING_DIMENSIONS             │
   │                                                               │
   ├─ Candidate pool = legacy pool ∪ semantic hits, minus           │
   │    exclusions (wishlist/follows/licenses/dismissals/views)     │
   │                                                               │
   ├─ Hybrid score = 0.35·base + 0.25·tag + 0.25·semantic +         │
   │    0.05·freshness + 0.10·behavioral → MMR re-rank (λ=0.5)      │
   │                                                               │
   ├─ Explanation per item (semantic → tag → studio → legacy →      │
   │    "Recommended for you" — never fabricated)                   │
   │                                                               │
   └─ Response: items + cursor + method + personalizationEnabled
```

## 3. Endpoint Surface

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /recommendations/for-you` | optional session | Feed (cursor-paginated, `limit` ≤ 50) |
| `POST /recommendations/feedback` | session | CLICKED / DISMISSED / WISHLISTED |
| `POST /recommendations/impressions` | session | CTR denominator (60-min dedup, ≤50 ids) |
| `DELETE /recommendations/feedback` | session | Per-user AI-history reset (Constitution Art. 5) |
| `GET /recommendations/preferences` | session | Consent read |
| `PATCH /recommendations/preferences` | session | Consent write (stamps `personalizationEnabledAt`) |
| `GET /recommendations/metrics` | ADMIN | Clicks/dismissals/wishlists/impressions/CTR over window |
| `POST /recommendations/refresh-embeddings` | ADMIN | On-demand nightly-job trigger |

## 4. Consent & Privacy (Constitution Art. 5 / Principle 3)

- `User.personalizationEnabled` defaults **false**. Consent-gated, never
  default-on.
- Enforcement is **server-side per request** — client state is irrelevant.
- Opted-out users: `signals = null`; the engine reads **nothing personal**
  (unit test: `does not gather taste signals for opted-out users`).
- Opting out mid-session takes effect on the next request (no cache of
  signals beyond the request).
- `DELETE /recommendations/feedback` clears the user's recommendation history
  (clicks, dismissals, impressions, wishlists) — dismissed games become
  candidates again.
- Consent audit trail: `personalizationEnabledAt` timestamp.

## 5. Embedding Pipeline

| Component | Detail |
|---|---|
| Table | `game_embeddings` (`vector(1536)` + HNSW index, `model`, `dimensions`, `version`) |
| Writer | Nightly cron 03:00 UTC (`GameEmbeddingRefreshService`) — single writer |
| Event refresh | `game_published` → immediate embed of the new game |
| Re-embed triggers | Missing row, `model` change, `dimensions` change, `version` bump, or game content updated |
| Dimension safety | Run-start abort if stored dims ≠ `AI_EMBEDDING_DIMENSIONS`; per-vector skip on mismatch; never writes a mismatched vector |
| Empty-catalog guard | `deleteOrphans` only runs when ≥1 published game exists (prevents a `NOT IN ()` wipe) |
| Content | `title + tagline + description` (1200-char description cap, 4000-char total) |
| Config | `AI_EMBEDDING_MODEL` (provider model, default `text-embedding-ada-002`) and `AI_EMBEDDING_DIMENSIONS` (default 1536) — changing dimensions requires a column migration + full re-embed |

## 6. Ranking

- Weights: base 0.35 / tag affinity 0.25 / semantic 0.25 / freshness 0.05 /
  behavioral 0.10 (deviation D-3, approved in M23 certification).
- MMR diversity re-rank λ = 0.5 with deterministic tie-breaks
  (`score desc, id asc`), cursor pagination by `(score, gameId)`.
- Legacy floor: candidates always include the legacy 9-scorer pool, so the
  hybrid can never return fewer/worse options than pre-AI (Article 8).

## 7. Explainability (Article 3 / Principle 2)

Every item carries `reason` + `reasonType` (+ `sourceGameId` when applicable):

| reasonType | Text | Source of truth |
|---|---|---|
| semantic | "Because you're into {signal game}" | nearest signal game, real |
| tag-affinity | "Because you like {tag}" | matched tag, real |
| studio-follow | "From {studio}, a studio you follow" | real follow |
| trending / hidden-gem / fresh | legacy labels | legacy scorer reasons |
| popular (fallback) | "Recommended for you" | always factually true — **never** claims popularity/affinity that cannot be backed up |

## 8. Failure Modes (Article 8)

| Failure | Behavior |
|---|---|
| Provider down / no key | Semantic path skipped → content/trending path, HTTP 200 |
| pgvector down | Same — logged, degraded |
| Dimension mismatch (runtime) | Vectors skipped; feed still serves |
| Empty candidate pool | Trending floor from legacy pool |
| Kill switch | `RECOMMENDATIONS_ENABLED=false` → pure legacy instantly |
| Rollout | `ROLLOUT_PCT` env; stable hash bucket per user |

## 9. Metrics

- `RecommendationFeedback` rows (CLICKED / DISMISSED / WISHLISTED /
  IMPRESSION), deduplicated per (user, game) per 60 min.
- `GET /recommendations/metrics` (ADMIN) → CTR = clicks/impressions (capped
  at 1), volumes over 1–90 days.
- KPI doc: `M23_METRICS.md`. Targets: CTR +25% vs floor, dismissal <15%,
  opt-in 30–60%, error <2%, p95 <3 s.

## 10. Rollout & Rollback

See `M23_ROLLOUT.md`. Stages: 5% (active) → 25% → 100%, gated by
certification + metrics. Rollback is an env flag flip (zero-deploy).

## 11. Testing

- Unit: consent gate (no signal gathering when opted out), anonymous `null`
  consent, hybrid path for consenting users, dimension-mismatch degradation,
  truthful explanations, impression dedup, reset scoping, refresh guards
  (abort, empty-catalog, model/dimension change, per-vector skip).
- E2E: feed shape, cursor pagination, invalid action 400, impression dedup +
  invalid counting, session-scoped reset, admin-only metrics, anonymous 401s.
- Gates: 525/525 API tests, `pnpm verify` green (2026-08-09).
