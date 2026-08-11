# M23 — Observation Freeze

**Status:** 🟢 **ACTIVE** — governed production experiment under observation
**Created:** 2026-08-10
**Owner:** Engineering Lead (freeze custodian: AI Engineer)
**Governance Reference:** `AI_CONSTITUTION.md`, `AI_EXECUTION_FRAMEWORK.md`, `M23_ROLLOUT.md`, `M23_METRICS.md`

---

## 1. Observation Period

| Field | Value |
|---|---|
| **Start** | 2026-08-10 |
| **End** | 2026-08-17 (end of day, UTC) |
| **Rollout** | 5% (stable per-user hash bucket, `ROLLOUT_PCT=5`) |
| **Purpose** | Establish a clean production baseline for discovery metrics **before any rollout expansion**. This is a MEASURE phase — not a BUILD phase. |

## 2. What Is Frozen

The following are **explicitly frozen** for the duration of the observation window.
They MUST NOT be modified, even if metrics look suboptimal:

| # | Component | Current Value | Frozen By |
|---|---|---|---|
| 1 | Hybrid scoring weights | base 0.35 / tag 0.25 / semantic 0.25 / fresh 0.05 / behavioral 0.10 | Freeze |
| 2 | Candidate-generation logic | Legacy 9-scorer pool ∪ pgvector semantic (KNN, top 5, θ=0.15) | Freeze |
| 3 | Semantic-search behavior | `embeddingRepository.search`, 5-candidate cap, fallback chain | Freeze |
| 4 | Embedding model | `text-embedding-3-small` (via `AI_EMBEDDING_MODEL`) | Freeze |
| 5 | Embedding dimensions | 1536 (via `AI_EMBEDDING_DIMENSIONS`) | Freeze |
| 6 | MMR configuration | λ=0.5, candidate set = merged pool | Freeze |
| 7 | Recommendation ranking logic | `applyMMR` + deterministic sort | Freeze |
| 8 | Personalization logic | Consent-gated taste signals; `personalizationEnabled` default false | Freeze |
| 9 | Rollout percentage | 5% (`RECOMMENDATIONS_ROLLOUT_PCT` default) | Freeze |
| 10 | Recommendation UX | ForYouFeed cards, cursor pagination, dismiss ×, explainer line | Freeze |
| 11 | Explanation format | `reason` + `reasonType`, "Because you're into X" / tag / studio / legacy | Freeze |
| 12 | Feedback semantics | CLICKED / DISMISSED / WISHLISTED / IMPRESSION enum | Freeze |
| 13 | CTR definition | `min(1, CLICKED / IMPRESSION)` over trailing window | Freeze |
| 14 | Impression definition | One per (user, game) per 60-min window; published games only | Freeze |
| 15 | Dismissal definition | DISMISSED rows; 30-day exclusion window | Freeze |
| 16 | Wishlist-conversion definition | WISHLISTED rows (frontend not wired during freeze) | Freeze |

> **Rationale:** Changing any of these during the baseline would contaminate the
> experiment — the resulting numbers could not be attributed to the deployed M23 v1.
> Metric definitions are frozen so the 25% gate comparison is apples-to-apples.

## 3. Allowed Changes During Freeze

Changes are permitted **ONLY** if required to address a P0/P1 emergency:

| # | Allowed Change | Justification Class |
|---|---|---|
| 1 | P0 security vulnerability | Exploit / data breach risk |
| 2 | P0 privacy issue | Cross-user data leak, consent violation |
| 3 | P0 data-integrity problem | Corrupted experiment data |
| 4 | P0/P1 availability issue | Production outage, sustained 5xx |
| 5 | Production outage | Service down |
| 6 | Catastrophic cost issue | Provider cost anomaly (e.g. > $10/day) |
| 7 | Incorrect metric instrumentation | Instrumentation proven scientifically invalid (e.g. CTR denominator broken) |

**Any such change MUST be logged in `docs/ai/M23_FREEZE_CHANGE_LOG.md` (see §6)
with:**
1. Explicit documentation of the change.
2. Why it was necessary (evidence, not assertion).
3. The exact affected component (file/config/database table).
4. Whether the baseline was contaminated (YES/NO + reasoning).
5. Whether the observation window must restart (YES/NO + new dates).

**Explicitly NOT allowed** (normal optimization is NOT an emergency):
- Weight tuning because CTR looks low.
- Candidate changes because dismissal rate is high.
- Explanation rewording because engagement is weak.
- Rollout adjustments to improve numbers.
- Removing unpopular recommendations to improve metrics.
- Instrumentation edits that make results look better.

## 4. Do Not Optimize for the Baseline

This is a **hard rule**. During the observation window:

- Do NOT change weights because CTR looks low.
- Do NOT change recommendations because dismissal rate looks high.
- Do NOT modify explanations because engagement is weak.
- Do NOT change rollout behavior to improve numbers.
- Do NOT remove unpopular recommendations simply to improve metrics.
- Do NOT alter instrumentation to produce better-looking results.

**Purpose:** Measure the current implementation honestly. If M23 performs poorly,
that is a legitimate and valuable finding — it tells us what to fix next.

## 5. What Is Being Measured

| Metric | Definition | Source |
|---|---|---|
| CTR | `CLICKED / IMPRESSION` (capped 1) | `GET /api/recommendations/metrics` |
| Wishlist conversion | `WISHLISTED / IMPRESSION` | Same |
| Dismissal rate | `DISMISSED / IMPRESSION` | Same |
| Recommendation diversity | Unique games / total impressions (computed at gate) | Raw feedback rows |
| Opt-in rate | `personalizationEnabled=true` users / 5% bucket | `User` rows + rollout hash |
| p50/p95/p99 latency | Feed endpoint timing | Live curl / APM |
| Error rate | 5xx / total feed requests | Error logs |
| AI cost | OpenAI embedding tokens × price | OpenAI usage dashboard |

See `M23_METRICS.md` and `M23_PRODUCTION_OBSERVATION.md` for full definitions.

## 6. Freeze Change Log

Any approved emergency change is recorded in `docs/ai/M23_FREEZE_CHANGE_LOG.md`.

**Current log:** No entries. Freeze unbroken as of 2026-08-10.

---

## 7. Freeze Violation Reporting

If a freeze violation is suspected (including an unapproved change), document it
immediately in the change log with severity, date, and impact assessment. The
observation window restarts if the violation contaminates the baseline.

---

## 8. Signature / Ownership

| Role | Responsibility |
|---|---|
| AI Engineer | Daily metric collection; freeze custodian; flag suspected violations |
| Engineering Lead | Gate decision authority (5% → 25%); approves emergency changes |
| CPO | Final gate sign-off; next-milestone selection (post-gate) |
