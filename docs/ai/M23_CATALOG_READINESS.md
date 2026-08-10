# M23 — Catalog Readiness & Passive Observation

**Date:** 2026-08-10 (day 1 of observation window)
**Mode:** PASSIVE OBSERVATION + CATALOG READINESS MONITORING — no code changes, no data fabrication.
**Freeze:** ACTIVE (`M23_OBSERVATION_FREEZE.md`) — M23 algorithm, metrics, rollout all frozen.
**25% gate:** LOCKED (decision 2026-08-17).
**Publishing path:** AVAILABLE since 2026-08-10 (`POST /api/games/:slug/publish` — see `docs/releases/M23_CATALOG_READINESS_CERTIFICATION.md`).

---

## 1. Current State (Production, verified 2026-08-10)

| Item | Value | Evidence |
|---|---|---|
| Total published games | **0** | `GET /api/games` → `{"total":0}` |
| Eligible games (recommendation) | **0** | Feed filters `isPublished: true` |
| Games with embeddings | **0** | Refresh filters `isPublished: true`; 0 eligible → 0 embedded |
| Games missing embeddings | 0 (none exist) | — |
| Games missing required tags | N/A | No games |
| Games missing descriptions | N/A | No games |
| Games missing genre/category metadata | N/A | No games |
| Games excluded from recommendations | N/A | — |
| Studios | **0** | `GET /api/studios` → `{"total":0}` |
| Users | 1 (seed) | Session 25/29 verified prod users=1 |
| Impressions / clicks / wishlists / dismissals | **NO DATA** | No games → no events possible |
| Opt-in | **NO DATA** | No users with feedback |

**Root cause (classified — see §4):** Production has no published games because
**no product path sets `Game.isPublished=true`** — a product/platform issue,
separate from M23. **RESOLVED 2026-08-10** — Game Publishing Path shipped
(`POST /api/games/:slug/publish` + public catalog/search `isPublished` filters).
See `docs/releases/M23_CATALOG_READINESS_CERTIFICATION.md`.

## 2. "Measurable Catalog" Definition

> **UNDETERMINED — insufficient production evidence**

**Catalog Ready** = at least one real studio has published at least one real game
through the product (evidence: `GET /api/games` returns non-zero `total` and the
game's studio can re-fetch it as published).

**Measurable Catalog** = requires real production traffic/history; thresholds are
**not invented** (per Session 30 governance). Derived from the recommendation
algorithm (hybrid-recommender.service.ts):

| Parameter | Value | Source |
|---|---|---|
| Legacy candidate pool limit | 100 | `LEGACY_CANDIDATE_LIMIT = 100` |
| Semantic candidate limit | 40 | `SEMANTIC_CANDIDATE_LIMIT = 40` |
| Semantic search top-K | 5 | `embeddingRepository.search(..., 5, 0.15)` |
| MMR re-rank | λ=0.7 | `applyMMR` |
| Tag/genre signal requirement | ≥1 tag-match needed for tag-affinity reasons | `explain()` |

**Reasoning:** A meaningful evaluation needs enough candidates that MMR diversity
and semantic ranking actually change the feed (not a degenerate 1–5 game feed).
Realistically this requires **tens to low-hundreds of published games** across
**multiple distinct genres/tags** (otherwise tag-affinity and semantic signals
are indistinguishable from random), plus **enough user exposure** for a
statistically readable impression/clicks sample.

**However:** the minimum statistical threshold **cannot be responsibly
determined from the current system** — there is no production traffic, no
historical baseline, and no valid control. Per the sprint policy, an arbitrary
threshold is not invented. **`UNDETERMINED — insufficient production evidence`**
is the honest classification.

**Practical note:** the same under-`100`-candidate ceiling applies to the legacy
engine, so a catalog well under ~100 published games would also degrade the
legacy experience — this is a platform-scale question, not just an M23 one.

## 3. Readiness Status

| Check | Value | Status |
|---|---|---|
| Control group | None | 🔴 NO VALID CONTROL GROUP |
| Sample size | 0 discovery events | 🔴 INSUFFICIENT |
| Metric reliability | Instrumentation correct but no data to measure | 🟡 CORRECT BUT EMPTY |
| Production data pipeline | Publishing path available (`POST /api/games/:slug/publish`); no games published yet | 🟢 PUBLISHING PATH AVAILABLE |

**Readiness: 🟢 PUBLISHING PATH AVAILABLE — catalog production is now possible
via the product; measurable-catalog definition still pending production traffic.**

> This is **not** a readiness verdict on M23 (M23 is code-complete and
> instrumented correctly). It is a **catalog/publishing pipeline** verdict: the
> platform can now produce published games through the product. Whether real
> studios actually publish (and the catalog becomes measurable) is a production
> observation question, not a code gap.

## 4. Root-Cause Classification (read-only investigation, 2026-08-10)

| Factor | Finding | Classification |
|---|---|---|
| P0 incident (Session 25) | `migrate reset` on shared DB wiped dataset; only seed user remained | Historical cause of empty DB |
| **No publish workflow** | **No DTO/controller/service/frontend path writes `Game.isPublished=true`.** `create` uses DB default `false`; `update` only stamped `publishedBy`/`publishedAt` on RELEASED (games.service.ts:289–292, **removed**); DTOs have no `isPublished` field; no publish endpoint; no frontend toggle (dashboard shows Status select only). Help doc even says "game will be saved as unpublished." | 🔴 **PRODUCT/PLATFORM ISSUE (primary)** — **RESOLVED 2026-08-10** via `POST /api/games/:slug/publish` |
| Seed script prod-blocked | `seed-model-games.ts` is the ONLY code setting `isPublished:true`; gated by `db-guard.mjs` (blocked in prod) and never run there | Correct safety behavior — not a bug |
| Eligibility filters | All consumers (recommendations, embeddings, feedback, collections) filter `where: { isPublished: true }` | Correct design — reveals the gap |
| Moderation/publication state | No moderation/approval field exists on Game; `RELEASED` status ≠ `isPublished` | Contributing ambiguity |

**Conclusion:** The empty catalog is **not** simply "early-stage with no users."
Even if a studio created games today through the UI, they would **never become
visible** in discovery because `isPublished` can't be set via the product. This
is a genuine product/platform defect that must be fixed **outside M23** (a
publishing/publish-toggle workflow) — **not** by altering the recommendation
engine.

> **Per sprint §13/§14:** M23 is NOT being modified to compensate. No synthetic
> data, no test games, no fabricated events. This finding is documented for the
> gate review and tracked as a product/platform issue.

## 5. Data Quality

| Dimension | Assessment |
|---|---|
| Control group | **NO VALID CONTROL GROUP** (`M23_BASELINE_COMPARISON.md` §5.1 — Options A/B/C not viable → D) |
| Sample size | **0** (no discovery events; no published games) |
| Metric reliability | **Cannot establish** — instrumentation is correct (verified in `M23_METRIC_DEFINITIONS_AUDIT.md`) but there is no data to measure |
| Causal impact | **Cannot be established** — insufficient evidence attributable to M23 |

## 6. Monitoring Plan (2026-08-10 → 2026-08-17)

| Cadence | Check | How |
|---|---|---|
| Daily | Published games count | `GET /api/games` |
| Daily | Studios count | `GET /api/studios` |
| Daily | Feed method | `GET /recommendations/for-you` (anonymous → legacy) |
| Daily | Latency p50/p95 | 10-request curl sample |
| Daily | Error rate | feed 5xx |
| Daily | Auth gates | 401 on /metrics, /preferences, /impressions |
| Weekly | OpenAI usage/cost | usage dashboard |
| Daily | Freeze change log | verify empty |
| On any catalog growth | Embodings count, impression/click events | metrics endpoint (admin) |

**Recording:** use `M23_DAILY_VALIDATION.md` template. Findings appended below
as the window progresses.

---

## 7. Catalog Readiness Dashboard (updated daily)

| Date | Published games | Studios | Impressions | Clicks | CTR | Dismissals | Readiness |
|---|---|---|---|---|---|---|---|
| 2026-08-10 | 0 | 0 | NO DATA | NO DATA | — | NO DATA | 🟢 PUBLISHING PATH AVAILABLE |
| … | | | | | | | |

**Format rule:** missing values are recorded as **NO DATA** or **INSUFFICIENT
DATA** — never as 0 (a zero is a measured quantity; an absent one is not).
