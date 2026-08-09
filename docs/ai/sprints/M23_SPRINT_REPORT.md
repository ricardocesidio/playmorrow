# M23 Sprint Report — Recommendation Engine (Hybrid)

**Sprint:** M23 — Recommendation Engine (hybrid For You feed + semantic search + per-request assistant chat)
**Dates:** 2026-08-08 to 2026-08-09
**AI Engineer:** Playmorrow engineering (assisted by Claude)
**Reviewer:** Engineering Lead

---

## Feature Summary

Built the hybrid recommendation engine: a semantic layer (pgvector game
embeddings, taste signals, MMR diversity) layered on top of the legacy
scoring system as an always-available floor. Also shipped SemanticSearchService
(used by the search page + game detail), the per-request assistant chat with
preference storage, model/feature caching, and the admin content debug
endpoint. Rollout is governed: 5% stable bucket, one-flag kill switch,
feedback events recorded from day one.

## KPIs

### Primary KPI

| Metric | Baseline | Target | Actual | Delta |
|--------|----------|--------|--------|-------|
| Feed CTR (→ game detail) | Not instrumented (condition C-2) | +25% vs legacy floor | — (measurement window opens at rollout) | — |

### Secondary KPIs

| Metric | Baseline | Actual | Delta |
|--------|----------|--------|-------|
| p95 feed latency | — | 161 ms (in-process; cold 349 ms) | ✅ well under 3 s |
| Error rate | — | 0% (degrade on provider down, never 500) | ✅ |
| Zero-item rate | — | 0% (trending floor) | ✅ |
| Cost per request | — | ≤ $0.000028 (embed worst case) | ✅ |
| Feedback recording | — | CLICKED / DISMISSED / WISHLISTED live | ✅ |

### Platform KPIs

| Metric | Actual | Limit | Status |
|--------|--------|-------|--------|
| P95 latency | 161 ms (in-process) | <3 s | ✅ |
| Cost per request | $0.000028 (max) | <$0.01 | ✅ |
| Error rate | 0% | <2% | ✅ |
| Cache hit rate | N/A (no cache layer on feed) | >60% | — |
| Daily active users | Dev environment (no prod traffic) | — | — |

---

## Cost Analysis

| Item | Cost |
|------|------|
| LLM API calls (chat, dev) | $0.00 (dev — no real traffic; keys disabled) |
| Embedding generation | ~$0.84/month projected at 30k personalized requests |
| Moderation checks | $0.00 (feed does no moderation; assistant reuses existing) |
| **Total sprint cost** | **$0.00 (dev)** |
| Monthly projected cost | **~$17/month** (feed + 10k chats) |
| Budget remaining | ~$483/month (of $500) |

---

## Constitution Compliance

| Article | Compliant? | Evidence |
|---------|-----------|----------|
| 1 — Value Over Novelty | ✅ | Hybrid = cannot be worse than legacy; fallback chain keeps value |
| 2 — Never Manipulate | ✅ | No dark patterns; feedback is explicit user action; ranking is explainable |
| 3 — Always Explain | ✅ | Explainer line per card ("Because you're into…"); `reasonType` on every item |
| 5 — Respect Autonomy | ⚠️ | Per-user opt-out missing (condition C-1) — open before 25% |
| 6 — Provider-Agnostic | ✅ | Provider factory; semantic layer is provider-swappable; C-3 open |
| 8 — Fail Gracefully | ✅ | **Live-verified:** provider down → content fallback, 200, items present |
| 11 — Minimize Hallucinations | ✅ | Feed is ranking over real catalog rows — no generative text |
| 15 — Kill-Switchable | ✅ | `RECOMMENDATIONS_ENABLED=false` unit-tested |
| 18 — Respect Studio Ownership | ✅ | Embeddings are of published games only; no player data in them |

---

## User Feedback

### Positive
- N/A (5% dev rollout, no production users yet)

### Negative
- N/A

### Feature Requests
- Personalization opt-out in settings (planned, C-1)

---

## Bugs Found & Fixed

| # | Severity | Description | Fixed? |
|---|----------|-------------|--------|
| 1 | High | Test DB host `ep-aged-darkness` regex in vitest.setup stale (rejected dev branch) | ✅ Session 25 P0.1 |
| 2 | Low | `prisma.tag.create` requires `slug` (temp live spec) | ✅ (temp spec, not shipped) |
| 3 | Info | `any` in new Phase-6 code — zero `any` enforced | ✅ by design |

---

## Technical Debt Created

| # | Item | Impact | Estimated Fix Time |
|---|------|--------|--------------------|
| T-1 | `openai.provider.ts:306` hardcodes `text-embedding-ada-002`; `AI_EMBEDDING_MODEL` ignored by provider | Model swap requires code change + re-embed | 1-2 h |
| T-2 | MMR cursor pagination may skip/dup on page boundary | Minor UX edge, non-blocking | 2-4 h |
| T-3 | `deleteOrphans` wipes all embeddings when 0 published games (prod currently empty) | Harmless (re-embedded nightly); flagged | 1 h |
| T-4 | WISHLISTED enum unused by frontend | Schema honesty (C-4) | 1-2 h |

---

## Lessons Learned

1. The 5-step deployment ladder (audit → gates → docs → certification → commit) catches issues before they ship; the live provider-down test would have missed a 500 in the semantic path.
2. Live verification with real DB + real provider config (but keys disabled) is the only way to prove Article 8; unit mocks alone can't.
3. Plan deviations (cost, weights, defaults) are inevitable — documenting them as deviations instead of silently drifting keeps the certification honest.

---

## Next Iteration Plan

**What to improve next:** Capture the 5% cohort CTR/dismissal baseline (C-2) and ship the per-user opt-out + feedback reset (C-1).
**Expected KPI impact:** Enables primary-KPI measurement; unlocks 25% gate.
**Target date:** End of first 5% measurement window (2 weeks).

---

## Kill Switch Status

- Feature flag: `RECOMMENDATIONS_ENABLED` (+ `RECOMMENDATIONS_ROLLOUT_PCT`)
- Currently: **ON** at 5% bucket
- Kill switch tested: 2026-08-09 (unit spec — legacy feed returned when disabled)
- Fallback behavior: full legacy feed (trending + hidden gems + recent) — identical to pre-M23 behavior

---

## Decision

- [x] **Continue** — normal next iteration
- [ ] Redesign — KPI gap requires rethinking
- [ ] Deprecate — feature not delivering value (ADR required)

---

**Reviewer signature:** _____________ **Date:** _____________
