# M23 — Rollout Plan (Governed, Progressive)

**Feature:** Recommendation Engine (hybrid) — For You feed
**Date:** 2026-08-10
**Status:** 🟢 **DEPLOYED & ACTIVE — OBSERVATION FREEZE** — 5% bucket live
(kill-switch ready). **M23 OBSERVATION FREEZE ACTIVE (2026-08-10 → 2026-08-17).**
The 25% gate is **LOCKED** — no rollout expansion, no scoring/model/UX changes,
no next AI milestone until the gate is evaluated with production evidence. See
`M23_OBSERVATION_FREEZE.md`.

Follows the execution framework rollout policy: 5% → 25% → 100%, gated by
metrics and governance conditions.

---

## Rollout Stages

| Stage | Population | Gate to advance | Owner | Status |
|---|---|---|---|---|
| 1. Pilot | 5% (stable hash bucket) | Metrics baseline captured + C-1/C-2 complete | AI Engineer | **ACTIVE** (deployed 2026-08-10, **observation freeze**) |
| 2. Expand | 25% | Stage 1 metrics stable (CTR ≥ floor, err <2%, cost OK) + discovery metrics evidence | Engineering Lead | **LOCKED** (gate due 2026-08-17) |
| 3. General | 100% | Full certification review + constitution re-check + controlled A/B | CPO | Pending |

## Bucket Assignment

Stable per-user hash: `hash(userId) % 100 < pct`. A user is either in or out
across sessions; changing `ROLLOUT_PCT` moves the boundary for **future**
requests without reshuffling existing users beyond the boundary math.

## Kill Switch

- **Flag:** `RECOMMENDATIONS_ENABLED=false` → everyone gets the legacy feed
  instantly (verified in `hybrid-recommender.service.spec.ts` —
  `returns legacy result when rollout is disabled`).
- **Instant, zero-deploy.** Env change on the API host only.
- **Tested 2026-08-10:** Verified working — instant legacy fallback, re-enabled successfully.

## Guardrails While Active

- Cost per request hard-capped (≤8 embeddings; 5-candidate semantic search).
- Provider down → content fallback, never 500 (live-verified).
- Feed never empty → trending floor (live-verified).
- Feedback events recorded from day one (CLICKED / DISMISSED / IMPRESSION) for
  CTR/dismissal metrics.
- **Consent-gated personalization:** personalization runs only for users who
  opted in (`PATCH /recommendations/preferences`, default **false**). Opted-out
  users get the deterministic content path and no personal data is read
  (Constitution Art. 5 / Principle 3).

## Mandatory Conditions Before 25% — ALL CLOSED (2026-08-09)

| # | Condition | Why (governance) | Status |
|---|---|---|---|
| C-1 | Per-user personalization opt-out in settings + one-click feedback-history reset | Constitution Art. 7 / Principle 3 (user autonomy, <10 s) | ✅ Done — `/settings/personalization` toggle + `DELETE /recommendations/feedback` |
| C-2 | Impression instrumentation + CTR/dismissal baseline capture | Execution framework (KPIs need baselines) | ✅ Done — `POST /recommendations/impressions` (60-min dedup) + admin `GET /recommendations/metrics` |
| C-3 | Provider `embed()` model configurable (`AI_EMBEDDING_MODEL` honored) + re-embed | Tech debt T-1 (provider-agnostic) | ✅ Done — `EmbeddingService` passes configured model; refresh re-embeds on model/dimension change |
| C-4 | WISHLISTED feedback wiring (frontend) or enum retirement | Schema honesty | ✅ Resolved — API contract retains WISHLISTED (documented; wired by future wishlist-funnel work). Not dead: the endpoint accepts it today |

All four were verified by tests in the M23 Final Hardening certification.

## Production Deployment Status (2026-08-10)

| Component | Status | Details |
|---|---|---|
| API Code | ✅ Deployed | 12 new files in `apps/api/src/ai/recommendations/` |
| Tests | ✅ 525/525 PASS | All gates pass |
| **Production API Deployment** | ✅ **DEPLOYED** | M23 endpoints live, migrations applied |
| **Production Frontend** | ✅ Deployed | `ForYouFeed` on homepage, calls live API |
| **Production 5% Rollout** | ✅ **ACTIVE** | Feature flags correct, code deployed |

## Rollback Procedure

1. Set `RECOMMENDATIONS_ENABLED=false` (or `RECOMMENDATIONS_ROLLOUT_PCT=0`).
2. Verify legacy feed returns for all users (smoke: `GET /for-you` → 200 with
   `method=legacy` on the card objects).
3. Keep feedback events flowing (they are harmless) and fix root cause.
4. Re-enable at 5%, re-measure, re-gate.

Per-user rollback (no operator action needed): the user flips the toggle in
`/settings/personalization` — personalization stops immediately server-side.

## Communication

- Internal: this doc + sprint report + certification.
- Users: no announcement at 5% (feature is a feed behind an auth wall;
  explainer line "Because you…" is shown on personalized cards). Invitation
  banner ("Your feed is not personalized yet") shows to opted-out users in the
  bucket.

---

> **Note:** The governed 5% rollout is now active in production. 7-day baseline window started 2026-08-10. See `docs/releases/M23_PRODUCTION_DEPLOYMENT_CERTIFICATION.md` for the deployment certification.