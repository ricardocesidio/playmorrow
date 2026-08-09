# M23 — Rollout Plan (Governed, Progressive)

**Feature:** Recommendation Engine (hybrid) — For You feed
**Date:** 2026-08-09
**Status:** ACTIVE — 5% bucket live (kill-switch ready)

Follows the execution framework rollout policy: 5% → 25% → 100%, gated by
metrics and governance conditions.

---

## Rollout Stages

| Stage | Population | Gate to advance | Owner | Status |
|---|---|---|---|---|
| 1. Pilot | 5% (stable hash bucket) | Metrics baseline captured + C-1/C-2 complete | AI Engineer | **ACTIVE** |
| 2. Expand | 25% | Stage 1 metrics stable (CTR ≥ floor, err <2%, cost OK) | Engineering Lead | Pending |
| 3. General | 100% | Full certification review + constitution re-check | CPO | Pending |

## Bucket Assignment

Stable per-user hash: `hash(userId) % 100 < pct`. A user is either in or out
across sessions; changing `ROLLOUT_PCT` moves the boundary for **future**
requests without reshuffling existing users beyond the boundary math.

## Kill Switch

- **Flag:** `RECOMMENDATIONS_ENABLED=false` → everyone gets the legacy feed
  instantly (verified in `hybrid-recommender.service.spec.ts` —
  `returns legacy result when rollout is disabled`).
- **Instant, zero-deploy.** Env change on the API host only.

## Guardrails While Active

- Cost per request hard-capped (≤8 embeddings; 5-candidate semantic search).
- Provider down → content fallback, never 500 (live-verified).
- Feed never empty → trending floor (live-verified).
- Feedback events recorded from day one (CLICKED / DISMISSED) for CTR/dismissal
  metrics.

## Mandatory Conditions Before 25%

The certification (Gate 11/13 findings) requires the following **before** the
5% → 25% expansion:

| # | Condition | Why (governance) | Status |
|---|---|---|---|
| C-1 | Per-user personalization opt-out in settings + one-click feedback-history reset | Constitution Art. 7 / Principle 3 (user autonomy, <10 s) | ⬜ Open |
| C-2 | Impression instrumentation + CTR/dismissal baseline capture | Execution framework (KPIs need baselines) | ⬜ Open |
| C-3 | Provider `embed()` model configurable (`AI_EMBEDDING_MODEL` honored) + re-embed | Tech debt T-1 (provider-agnostic) | ⬜ Open |
| C-4 | WISHLISTED feedback wiring (frontend) or enum retirement | Schema honesty | ⬜ Open |

If any condition is unmet at the 25% gate, expansion is paused — this is the
default unless an Engineering Lead override is recorded in the certification.

## Rollback Procedure

1. Set `RECOMMENDATIONS_ENABLED=false` (or `RECOMMENDATIONS_ROLLOUT_PCT=0`).
2. Verify legacy feed returns for all users (smoke: `GET /for-you` → 200 with
   `method=legacy` on the card objects).
3. Keep feedback events flowing (they are harmless) and fix root cause.
4. Re-enable at 5%, re-measure, re-gate.

## Communication

- Internal: this doc + sprint report + certification.
- Users: no announcement at 5% (feature is a feed behind an auth wall;
  explainer line "Because you…" is shown on personalized cards).
