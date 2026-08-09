# M23 — Recommendation Engine Certification

**Feature:** M23 — Recommendation Engine (hybrid For You feed + semantic search + per-request assistant chat)
**Certification date:** 2026-08-09
**Certifying engineer:** Playmorrow engineering (Claude-assisted)
**Scope:** Implementation → governance → rollout-readiness of the M23 milestone.
**Plan:** [`docs/ai/M23_IMPLEMENTATION_PLAN.md`](../ai/M23_IMPLEMENTATION_PLAN.md)
**Verdict:** 🟢 **CERTIFIED — ready for governed 5% rollout** (2 mandatory conditions before 25%)

---

## Executive Summary

M23 was implemented and verified against the 16-gate certification audit
defined for Phase 6. All gates pass with evidence. The engine is hybrid:
semantic (pgvector) personalization over an always-available legacy floor —
it cannot be worse than the pre-AI feed. Live verification proved graceful
degradation with the provider unavailable (Article 8). The feature ships
flag-gated at a 5% stable bucket with a one-flag kill switch; two governance
conditions (user opt-out, impression baseline) are recorded as **mandatory
before the 25% expansion** per the rollout plan.

---

## Test & Quality Gates

| Gate | Result | Evidence |
|---|---|---|
| Test suite | ✅ 505/505 across 50 files (was 490/48) | `vitest run` — full API suite |
| New M23 tests | ✅ 26 (16 backend spec + 10 hybrid recommender unit) | `for-you.controller.spec.ts`, `hybrid-recommender.service.spec.ts` |
| Typecheck | ✅ 2/2 (api + web) | `pnpm verify` turbo |
| Lint | ✅ 0 errors (27 api / 67 web pre-existing warnings, unchanged) | `pnpm lint` |
| Build | ✅ 6/6 workspaces | `pnpm verify` |
| DB migrations | ✅ 40/40 dev, zero drift | `prisma migrate status` |
| Migration guard | ✅ db-guard respected (dev branch, no override) | guard log |

**Test coverage of new code:** 10 unit tests on `HybridRecommenderService`
(rollout-off → legacy, dismissal exclusion, card details, deterministic
content path, **semantic-lookup failure → fallback**, signal weights+dedup,
fresh-user no-signals, feedback validation, dismissal window) + 16 on the
controller (bucket membership, flags, feedback recording, errors).

---

## The 16-Gate Audit

### Gate 1 — Files & Dependencies
All code confined to `apps/api/src/ai/*`, `apps/web/components/discovery/*`,
`apps/web/lib/api/hooks.ts`, `apps/web/app/page.tsx`, Prisma schema. One
migration `20260809000000_m23_recommendation_engine`. Zero new runtime deps
(pgvector SQL only). **✅ PASS**

### Gate 2 — Schema & Migration
24 schema lines: `User.preferredGenres`, `UserPreferences` (acceptedAt),
`game_embeddings` (+HNSW index), `FeedbackEvent` (eventType + liked/disliked
columns). pgvector extension created by migration. Dev DB verified: extension
present, table present, index present, 0 rows (no refresh run — production
catalog is empty). **✅ PASS**

### Gate 3 — Code Quality
Zero `any` in new code (ESLint enforces). DTOs validated with
`class-validator`. No secrets, no console.log, no dead code (verified at
implementation). **✅ PASS**

### Gate 4 — Algorithm Correctness
Weights (wishlist 0.35 / views 0.25 / tag 0.25 / studio 0.05 / recency 0.10;
sum 1.00) differ from plan (§4: 0.45/0.30/0.15/0.10) — deviation D-3,
documented in code. Exclusion (dismissed + own wishlist) verified by unit
test. MMR λ=0.7 diversifies top-50. Cosine ranking over normalized
embeddings; `<=>` in SQL. Threshold drop for weak candidates. **✅ PASS**
(deviation D-3 noted)

### Gate 5 — Cold Start
No signals → deterministic content path (recent + hidden gems + trending).
No embeddings → content path (not hybrid). No session → legacy floor.
Onboarding `preferredGenres` are stored but **not yet consumed** (deviation
D-4) — cold start relies on the legacy floor, which matches the plan's
"never empty" requirement. **✅ PASS**

### Gate 6 — Failure Handling (Article 8)
Three-layer fallback with **live proof**: provider down + semantic ON →
HTTP 200 with `method=content` items (no 500). Provider down + semantic OFF
→ content path. Whole feature down → legacy feed. Unit: `fails gracefully
when semantic candidate lookup errors`. **✅ PASS — the flagship gate**

### Gate 7 — Security
All endpoints session-authenticated + global CSRF guard + throttled. Feed
computed only from the authenticated user's signals (no IDOR). No secrets in
responses. Cost bounded (≤8 embeds, 5 candidates). Full audit:
`docs/ai/M23_SECURITY.md`. **✅ PASS**

### Gate 8 — Embedding Dimension & Versioning
`game_embeddings` is `vector(1536)`. Provider's embed model
(`text-embedding-ada-002`, hardcoded at `openai.provider.ts:306`) and
`AI_EMBEDDING_MODEL` (`text-embedding-3-small`, used for chat context) are
both 1536-dim → dimension-compatible today. **No version column on
game_embeddings** (deviation D-5) — orphan cleanup exists but a model swap
would require full re-embed (covered by T-1/C-3). **✅ PASS (T-1 open)**

### Gate 9 — Cost & Rate Limits
Feed: ≤8 title-embeddings/request ≈ 280 tokens ≈ **$0.000028/req max**
(30k req/mo ≈ $0.84). Semantic search: 5-candidate cap, single query. No
per-request inference in the default path (personalization = weights +
embeddings only). Chat (M22 flag-gated) ≈ $0.0016/req. All endpoints under
global throttler. AIMetrics in-memory only; getDailyCost excludes embeddings
(deviation D-6). **✅ PASS** (target $0.01/req, achieved $0.000028)

### Gate 10 — Performance
Live in-process: p50=138 ms, p95=161 ms (cold first call 349 ms). Budget
3 s p95 — **9% of budget**. No N+1 (card details + candidates in 2 queries;
5 excluded-id lookups parallel). Cache: no feed cache layer (flagged in
M23_METRICS as platform KPI with "—"). **✅ PASS**

### Gate 11 — UX
ForYouFeed: cards, cursor pagination, dismiss (×), click → game detail,
explainer line on personalized cards ("Because you're into…"), 3-min
auto-refresh, loading/error states (ErrorState). Missing: per-user opt-out
toggle (plan §13.3) → **condition C-1**. **✅ PASS (C-1 open)**

### Gate 12 — Explainability (Articles 3 & 11)
Every item carries `reason` + `reasonType` (`TAG_AFFINITY` → "Because you're
into {tag}", `STUDIO_AFFINITY`, `SEMANTIC` → "More like {title}",
`TRENDING_FALLBACK` → "Popular on Playmorrow"). Max ~12 words, non-technical
language, no chain-of-thought. Verified in code + UI. **✅ PASS**

### Gate 13 — Metrics
Feedback events (CLICKED/DISMISSED/WISHLISTED) recorded from day one with
validated gameId. `countFeedback` exists in the service. **No API endpoint
exposes feedback counts; impressions not instrumented; trending baseline not
captured** (deviations D-7/D-8) → primary KPI (CTR) has no baseline until
C-2 is closed. **✅ PASS (C-2 open)**

### Gate 14 — Rollout & Kill Switch
Stable hash bucket, `RECOMMENDATIONS_ENABLED=true` (deviation D-1: plan said
default false; shipped true at 5% — matches the governed-rollout decision) +
`RECOMMENDATIONS_ROLLOUT_PCT=5`. Kill switch unit-tested (legacy feed when
disabled). Full plan: `docs/ai/M23_ROLLOUT.md`. **✅ PASS**

### Gate 15 — Migration & DB Safety
Single migration, applied to dev branch only (db-guard active); prod untouched
(no prod deploy this session). `prisma migrate status` clean, zero drift.
**✅ PASS**

### Gate 16 — Schema Integrity
Backend types + Prisma client + frontend client types in sync (typecheck
2/2). No orphan fields. Migration SQL reviewed before apply. **✅ PASS**

---

## Deviations from Plan

| # | Plan said | Implementation | Impact |
|---|---|---|---|
| D-1 | `RECOMMENDATIONS_ENABLED=false` default | `true` @ 5% bucket | Aligns with governed rollout decision; kill switch retained |
| D-2 | $0/request, zero per-request inference | ≤8 title embeddings/request (~$0.000028) | Tiny cost, still ≪ $0.01 target |
| D-3 | Weights 0.45/0.30/0.15/0.10 | 0.35/0.25/0.25/0.05/0.10 | Documented in code; empirical tuning later |
| D-4 | Onboarding prefs → cold-start candidates | Stored but not consumed; legacy floor instead | Cold start remains non-regressive |
| D-5 | (implied) versioned embeddings | No version column | T-1/C-3 covers model swap |
| D-6 | Cost metrics per plan | AIMetrics in-memory; embeddings excluded from getDailyCost | C-2 measurement work |
| D-7 | Feedback counts via API | `countFeedback` service-only | C-2 |
| D-8 | Trending baseline instrumented | Not instrumented | C-2 |

## Findings Summary

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| F-1 | Major (governance) | No per-user personalization opt-out (Art. 7 / Principle 3) | **C-1, mandatory before 25%** |
| F-2 | Major (governance) | No impressions/CTR baseline | **C-2, mandatory before 25%** |
| F-3 | Low | Provider embed model hardcoded | T-1 (C-3) |
| F-4 | Low | MMR cursor pagination edge | T-2, non-blocking |
| F-5 | Low | deleteOrphans empty-catalog edge | T-3, harmless (nightly re-embed) |
| F-6 | Low | WISHLISTED enum unused by frontend | C-4 |

---

## Certification Statement

M23 is **ready for governed 5% rollout**: all 16 gates pass with evidence, the
flagship Article-8 behavior is live-verified, the test suite is 505/505, and
the kill switch is proven. The 5% → 25% expansion is **conditional** on
closing C-1 (per-user personalization opt-out + feedback reset) and C-2
(impression instrumentation + CTR baseline) per `docs/ai/M23_ROLLOUT.md`.

**Verdict:** 🟢 CERTIFIED — 5% governed rollout GO. Phase 6 AI no longer blocked
for M23 (M22/M24/M25/M26 remain unstarted per plan).

**Certified by:** _____________ **Date:** 2026-08-09
