# M23 — Metric Definitions Audit

**Audit Date:** 2026-08-10 (day 1 of observation window)
**Auditor:** AI Engineer
**Scope:** Every metric feeding the 25% gate — implementation, storage, calculation, population, invalidation, dedup, independent verifiability.
**Status:** ✅ Definitions verified against source code. No changes made (freeze).

---

## 1. Metric-by-Metric Audit

### 1.1 Impressions

| Aspect | Answer | Evidence |
|---|---|---|
| What event generates it? | `ForYouFeed` mounts → `POST /recommendations/impressions { gameIds }` (once per card per session via `useRef<Set>`) | `ForYouFeed.tsx` + `recommendation-feedback.service.ts:51` |
| Where is it stored? | `recommendation_feedback` rows, `action='IMPRESSION'` | Prisma model |
| How is it calculated? | Each valid (user, published game) row = 1 impression; server dedup 60-min window per (user, game) | service:62–75 |
| What population? | **Authenticated users in the 5% bucket** only (anonymous + opted-out not captured by design) | observation report §2 |
| What can invalidate it? | Frontend not firing on mount; game unpublished mid-window; bot traffic | — |
| Is it deduplicated? | ✅ Yes — client `useRef<Set>` + server 60-min window + `distinct: ['gameId']` | service:63–68 |
| Independently verifiable? | ✅ Raw rows queryable; `/metrics` returns count | — |

### 1.2 Clicks

| Aspect | Answer | Evidence |
|---|---|---|
| What event generates it? | Card click → `POST /recommendations/feedback { gameId, action:'CLICKED' }` | `ForYouFeed.tsx` + service:33 |
| Where is it stored? | `recommendation_feedback`, `action='CLICKED'` | Prisma model |
| How is it calculated? | Row count over window; **re-clicks allowed** (legitimate signal) | service:114–128 |
| What population? | Authenticated, in-bucket users | — |
| What can invalidate it? | Click without prior impression (click on cached page); double-fire | — |
| Is it deduplicated? | ❌ No (by design) | service comment |
| Independently verifiable? | ✅ Raw rows | — |

### 1.3 CTR

| Aspect | Answer | Evidence |
|---|---|---|
| How is it calculated? | `CTR = min(1, CLICKED / IMPRESSION)` over trailing window | service:127 |
| Population | In-bucket authenticated users | — |
| Invalidation | Impression denominator = 0 → CTR returns 0 (not NaN) | service:127 |
| Dedup | Denominator deduped at write; numerator not | — |
| Verifiable | ✅ recompute from raw rows | — |

### 1.4 Dismissals

| Aspect | Answer | Evidence |
|---|---|---|
| Event | ✕ button → `POST /feedback { action:'DISMISSED' }` | ForYouFeed |
| Storage | `recommendation_feedback`, `action='DISMISSED'` | Prisma |
| Calculation | Row count over window; rate = DISMISSED / IMPRESSION | metrics service |
| Exclusion | DISMISSED rows feed 30-day exclusion set in `getExcludedGameIds` | hybrid-recommender.service.ts:234 |
| Dedup | Multiple dismissals of same game allowed; exclusion set dedupes | — |

### 1.5 Wishlists

| Aspect | Answer | Evidence |
|---|---|---|
| Event | `WISHLISTED` action accepted by API | controller:46–52 |
| Frontend wiring | **NOT wired during freeze** — no WISHLISTED rows expected | observation §4 |
| Calculation | Row count | metrics |
| Verdict | Report as **INSUFFICIENT DATA** at gate (by design, not failure) | — |

### 1.6 Recommendation Exposure / Method

| Aspect | Answer | Evidence |
|---|---|---|
| How exposed? | `method` field on every feed response: `hybrid`/`content`/`trending`/`legacy` | hybrid-recommender |
| Population | All feed consumers (incl. anonymous → legacy) | — |
| Verifiable | ✅ response field; dev live-verified | — |

### 1.7 Opt-in Rate

| Aspect | Answer | Evidence |
|---|---|---|
| Definition | `personalizationEnabled=true` users ÷ users in 5% bucket | — |
| Storage | `User.personalizationEnabled` + `personalizationEnabledAt` | Prisma schema |
| Population | Signed-in users; computed at gate from User rows + rollout hash | — |
| Caveat | Requires DB query at gate; not exposed via `/metrics` (no PII leak by design) | — |

### 1.8 Latency (p50/p95/p99)

| Aspect | Answer | Evidence |
|---|---|---|
| Event | Feed request → response | — |
| Measurement | Client-side timing / curl `time_total`; 10-request samples | performance review |
| Caveat | Measured with **empty catalog** (41/42 ms). Populated catalog re-measured at gate | — |

### 1.9 Error Rate / Provider / Embedding Failures

| Aspect | Answer | Evidence |
|---|---|---|
| 5xx rate | From error logs; 0% observed | — |
| Provider failure | `getSemanticCandidates` try/catch → `[]`, `method=content` (no 500) | hybrid-recommender.service.ts:214–237 |
| Embedding failure | Same path; dimension-mismatch guard → `[]` | service:227–230 |
| Degraded rate | `method != 'hybrid'` | daily validation |

### 1.10 AI Token / Cost

| Aspect | Answer | Evidence |
|---|---|---|
| Measurement | OpenAI usage dashboard (embedding tokens) | — |
| Projection | ~$0.15/mo at 5% | cost governance |
| Ceiling | $500/mo | execution framework |

---

## 2. Audit Verdict

All metrics are **implemented, stored, and calculated as documented** in the
code. No metric semantics were changed — they are frozen for the window
(`M23_OBSERVATION_FREEZE.md` §2). Two metrics (wishlist conversion, opt-in rate)
require data that will be **INSUFFICIENT** at the gate by design or because they
need a DB aggregation — this is reported, not estimated.
