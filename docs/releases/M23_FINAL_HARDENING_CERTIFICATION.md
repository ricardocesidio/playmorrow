# M23 Final Hardening — Certification

**Milestone:** M23 — Hybrid Recommendation Engine
**Sprint:** Final hardening (pre-25% gate)
**Date:** 2026-08-09
**Scope:** Findings F-1…F-6 closure, conditions C-1…C-4 closure, failure-mode
audit, explainability audit, security re-audit, docs expansion.
**Verdict:** 🟢 **READY FOR 25% GATE** — 5% rollout remains governed; advance
is conditional on the Stage-1 metrics window (≈7 days) per `M23_ROLLOUT.md`.

---

## 1. Reconciliation with the previous certification

The original `M23_CERTIFICATION.md` claimed schema additions
(`User.preferredGenres`, `UserPreferences`, `FeedbackEvent` changes) that do
not exist in `schema.prisma` or in the applied migration history. This
certification records the **actual** schema:

| Claimed | Actual |
|---|---|
| `User.preferredGenres` (Json) | ❌ never added — onboarding prefs not consumed (D-4) |
| `UserPreferences` model | ❌ never added — consent flag lives on `User` instead |
| `FeedbackEvent` eventType + liked/disliked | ❌ never added — `recommendation_feedback` (enum actions) is the feedback store |
| `game_embeddings` vector(1536) + HNSW | ✅ exists (raw-SQL migration) |

The prior certification's deviation/finding list is re-audited in §3 below.

## 2. What was built this sprint

### 2.1 Consent-gated personalization (C-1 / F-1 — **CLOSED**)

- Schema: `User.personalizationEnabled Boolean @default(false)` +
  `User.personalizationEnabledAt DateTime?` (migration
  `20260809010000_m23_hardening`, additive only).
- Default **false** — consent-gated per Constitution Art. 5 / Principle 3.
- Enforcement server-side per request in `HybridRecommenderService.getForYou`:
  opted-out users get `signals = null` — **no personal data is read at all**.
- Endpoints: `GET|PATCH /recommendations/preferences` (session-scoped).
- UI: `/settings/personalization` (toggle + one-click reset, double-click
  confirm), link in settings nav, invitation banner on the feed for
  opted-out users in the bucket.
- Response field `personalizationEnabled` (null for anonymous / out-of-bucket)
  powers the banner without extra requests.

### 2.2 Impression instrumentation + CTR baseline (C-2 / F-2 — **CLOSED**)

- `RecommendationFeedbackAction += IMPRESSION` (enum extension, additive).
- `POST /recommendations/impressions` — validates published games, caps at 50
  ids, dedupes within a 60-minute window per (user, game); response reports
  recorded / deduplicated / invalid counts.
- Frontend `ForYouFeed` captures impressions once per card per client session.
- `GET /recommendations/metrics` (ADMIN) — clicks, dismissals, wishlists,
  impressions, CTR (capped at 1) over a 1–90 day window.
- Baseline methodology documented in `M23_METRICS.md` (updated).

### 2.3 Config-driven embedding model (C-3 / F-3 / T-1 — **CLOSED**)

- `EmbeddingService` now passes the configured `AI_EMBEDDING_MODEL` to the
  provider (`openai.provider.ts` fallback remains but is no longer the live
  path).
- New `AIConfig.embeddingDimensions` (`AI_EMBEDDING_DIMENSIONS`, default 1536)
  — single source of truth for vector size.
- Refresh re-embeds on model change, dimension change, version bump, or
  content update; run-start abort + per-vector skip on dimension mismatch.

### 2.4 Data-integrity guards (F-5 / T-3 — **CLOSED**)

- Run-start dimension abort in `GameEmbeddingRefreshService.refresh()` —
  stored dims ≠ configured → abort, never write stale vectors.
- Empty-catalog guard: `deleteOrphans` runs only when ≥1 published game
  exists (the old `NOT IN ()` predicate would have wiped every embedding).
- `findAll()` now returns `model` + `dimensions` for re-embed decisions.

### 2.5 Deterministic ordering (F-4 / T-2 — **CLOSED**)

- `fetchCandidateDetails` orders by `id asc`; cursor pagination is
  positional (`indexOf(cursor.gameId) + 1`) with `(score, id)` tie-breaks —
  no reliance on DB row order.

### 2.6 Explainability audit (Article 3 / Principle 2 — **CLOSED**)

- Removed the fabricated "Popular on Playmorrow" fallback → "Recommended for
  you" (always factually true; the game IS in the feed).
- Verified every other reason type traces to a real signal/source
  (`closestSignalGame`, matched tags, followed studios, legacy reasons).
- Unit test asserts no item claims popularity without a source.

### 2.7 Feedback reset + WISHLISTED disposition (C-4 / F-6 — **RESOLVED**)

- `DELETE /recommendations/feedback` — session-scoped delete of the user's
  recommendation history (Constitution Art. 5 "view/delete AI history").
- WISHLISTED: retained as API contract (valid enum, accepted by the endpoint,
  counted in metrics); frontend wiring deferred to the wishlist-funnel work.
  Documented in `M23_ROLLOUT.md` C-4 row.

## 3. Finding & deviation audit (from `M23_CERTIFICATION.md`)

| # | Finding | Classification | Resolution | Status |
|---|---|---|---|---|
| F-1 | No per-user opt-out | = C-1 | Consent toggle + server-side gate | ✅ Closed |
| F-2 | No impressions / CTR baseline | = C-2 | Impressions endpoint + metrics + baseline plan | ✅ Closed |
| F-3 | Provider embed model hardcoded | T-1 | `EmbeddingService` passes configured model | ✅ Closed |
| F-4 | MMR cursor pagination edge | T-2 | Deterministic order + positional cursor | ✅ Closed |
| F-5 | `deleteOrphans` empty-catalog wipe | T-3 | Published-count guard + dimension abort | ✅ Closed |
| F-6 | WISHLISTED unused | C-4 | Retained as documented API contract | ✅ Resolved |
| D-1 | `RECOMMENDATIONS_ENABLED` defaults true | Deviation | Accepted (kill-switch `false` verified); default true is the only way the 5% bucket is reachable without extra plumbing — documented | ✅ Accepted |
| D-2 | Per-request embed cost ≠ $0 | Deviation | Accepted (≤8 embeds, $0.000028 worst case) | ✅ Accepted |
| D-3 | Weights 0.35/0.25/0.25/0.05/0.10 | Deviation | Accepted (plan was not data-backed; weights are measured post-baseline) | ✅ Accepted |
| D-4 | Onboarding prefs never stored | Deviation | Accepted — consent model supersedes it; pref collection deferred | ✅ Accepted |
| D-5 | No embedding version strategy | Deviation | Partially closed — `version` column + model/dimension change re-embeds; full versioned-embedding rotation remains a future ADR | 🟡 Tracked |
| D-6 | AIMetrics in-memory, no counts endpoint | Deviation | Metrics endpoint built on `recommendation_feedback` (authoritative store); AIMetrics in-memory counters remain for runtime latency | ✅ Accepted |
| D-7 | Feedback counts not exposed | = D-6 | `GET /recommendations/metrics` | ✅ Closed |
| D-8 | No trending baseline | Deviation | Baseline methodology documented; legacy floor is the reference | ✅ Accepted |

## 4. Failure-mode verification (Article 8)

| Scenario | Behavior | Verified by |
|---|---|---|
| Provider down + semantic on | 200, `method=content/trending`, items served | Unit + prior live spec |
| pgvector error | Degraded, logged, 200 | Unit (`fails gracefully when semantic candidate lookup errors`) |
| Opted-out user | No signals gathered, deterministic content | Unit (new) |
| Anonymous user | Feed + `personalizationEnabled: null` | Unit + e2e (new) |
| Dimension mismatch (runtime) | Vectors skipped, feed served | Unit (new) |
| Stored dims ≠ config (cron) | Run abort, no writes, no deletes | Unit (new) |
| Empty published catalog | No orphan deletion | Unit (new) |
| Kill switch `RECOMMENDATIONS_ENABLED=false` | Legacy feed, instant | Unit (existing) |
| Rollout `ROLLOUT_PCT=0` | Legacy feed | Unit (existing) |
| Unknown game in feedback/impressions | Ignored / counted invalid | Unit + e2e (new) |

## 5. Security re-audit

Full re-audit in `M23_SECURITY.md` (updated). New endpoints audited:
session-scoped reset (IDOR test), consent enforcement, rate limits
(metrics 20/min, reset 10/min, impressions 60/min), CSRF global guard
coverage, input caps (`@ArrayMaxSize(50)`), admin-only metrics
(`RolesGuard` + `@Roles('ADMIN')`, e2e 403 for MEMBER). No vulnerabilities.

## 6. Evidence — quality gates (2026-08-09)

| Gate | Result |
|---|---|
| API test suite | **525/525 passed** (51 files) — +20 vs 505 baseline |
| New tests | Hybrid: consent gate, anonymity, hybrid path, dim degradation, explanation truthfulness (5); Refresh: abort, empty-catalog, model-change re-embed, per-vector skip, unpublish delete (7); Feedback: dedup, reset, CTR (3); E2E: prefs opt-in default, anonymous 401s, impression dedup, session-scoped reset, admin metrics (5) |
| Typecheck | ✅ API + Web (0 errors) |
| Lint | ✅ 0 errors (pre-existing warnings only: 27 api / 67 web — unchanged) |
| `pnpm verify` (build all) | ✅ 6/6 tasks |
| Migration | `20260809010000_m23_hardening` applied to dev DB; additive only; zero drift |
| Schema | 40/40 migrations, `personalizationEnabled` + `IMPRESSION` live |

## 7. Configuration

| Env | Default | Meaning |
|---|---|---|
| `RECOMMENDATIONS_ENABLED` | `true` | Kill switch |
| `ROLLOUT_PCT` | `5` | Percent of users in the M23 bucket |
| `PERSONALIZE` | `true` | Master personalization toggle |
| `SEMANTIC` | `true` | Semantic path toggle |
| `AI_EMBEDDING_MODEL` | `text-embedding-ada-002` | Provider embedding model (1536-dim) |
| `AI_EMBEDDING_DIMENSIONS` | `1536` | Vector size — change requires column migration + re-embed |
| `CACHE_REFRESH` / `FEED_REFRESH_MS` | `true` / `180000` | Feed refresh cadence |

## 8. Open items (tracked, non-blocking)

1. D-5: full versioned-embedding rotation strategy → future ADR.
2. WISHLISTED frontend wiring → wishlist-funnel milestone.
3. `preferredGenres` onboarding collection → superseded by consent model;
   revisit for cold-start signals at 25% if opt-in data is sparse.
4. First readable CTR window closes ~2026-08-16 (7 days of 5% rollout) —
   the actual 25% gate decision.

## 9. Certification statement

All pre-25% conditions (C-1…C-4) and findings (F-1…F-6) are closed or
explicitly accepted with documented rationale. The engine is consent-gated,
fail-graceful, explainable, and measurably instrumented. **Verdict:
🟢 READY FOR 25% GATE** — advance is governed by the Stage-1 metrics window,
not automatic.

**Signed:** AI Engineer (M23) — 2026-08-09
**Review:** Engineering Lead — pending Stage-1 metrics review
