# M23 Production Observation Report

**Observation Period:** 2026-08-10 → 2026-08-17 (7 days)
**Rollout:** 5% (stable hash bucket)
**Environment:** Production (Fly.io + Vercel)
**Algorithm Version:** M23 Hybrid v1 (weights: base 0.35, tag 0.25, semantic 0.25, fresh 0.05, behavioral 0.10)
**Embedding Model:** `text-embedding-3-small` (configured via `AI_EMBEDDING_MODEL`)
**Embedding Dimensions:** 1536 (configured via `AI_EMBEDDING_DIMENSIONS`)
**Vector Store:** pgvector (Neon PostgreSQL) with HNSW index
**Provider:** OpenAI (configured via `AI_PROVIDER=openai`)

---

## 1. Telemetry Pipeline Trace

### Complete Data Flow

```
User (authenticated, in 5% bucket)
  ↓
ForYouFeed component mounts
  ↓
GET /api/recommendations/for-you?limit=12
  ↓
OptionalSessionGuard → attaches user if session exists
  ↓
HybridRecommenderService.getForYou(userId, limit, cursor)
  ↓
  ├─ Rollout check: hash(userId) % 100 < 5
  ├─ Consent check: user.personalizationEnabled === true
  ├─ TasteSignalService.gather(userId) → signals
  ├─ Legacy recommendations (9-scorer pool)
  ├─ Semantic candidates (pgvector KNN, top 5, threshold 0.15)
  ├─ Exclusions (wishlist, follows, licenses, dismissals, views)
  ├─ Hybrid scoring (weighted + MMR λ=0.5)
  ├─ Explanations (semantic → tag → studio → legacy → "Recommended for you")
  └─ Pagination (positional cursor)
  ↓
ForYouResult { items[], nextCursor, hasMore, method, personalizationEnabled }
  ↓
Frontend renders cards
  ↓
useEffect impression capture (once per card per session)
  ↓
POST /api/recommendations/impressions { gameIds }
  ↓
Deduplication: 60-min window, max 50/request, published games only
  ↓
User clicks card → onOpen → POST /recommendations/feedback { gameId, action: "CLICKED" }
  ↓
User dismisses card → onDismiss → POST /recommendations/feedback { gameId, action: "DISMISSED" }
  ↓
User wishlists → (future) POST /recommendations/feedback { gameId, action: "WISHLISTED" }
  ↓
All events → recommendation_feedback table (userId, gameId, action, createdAt)
  ↓
Admin metrics: GET /api/recommendations/metrics?days=N
  ↓
Returns: clicks, dismissals, wishlists, impressions, CTR (capped at 1)
```

---

## 2. Instrumentation Verification

### Impressions

| Aspect | Implementation | Status |
|---|---|---|
| **Trigger** | `useEffect` in `ForYouFeed` on `items` change | ✅ Implemented |
| **Deduplication (client)** | `useRef<Set<string>>` per session | ✅ Implemented |
| **Deduplication (server)** | 60-min window, distinct on (userId, gameId) | ✅ Implemented |
| **Validation** | Published games only, max 50/request | ✅ Implemented |
| **Response** | `{ recorded, deduplicated, invalid }` | ✅ Implemented |
| **Anonymous users** | Not captured (requires auth) | ✅ By design |

**Gap:** Impressions only fire for authenticated users in the bucket. Anonymous users and opted-out users generate no impression events. This is by design but means CTR baseline only covers consenting, in-bucket users.

### Clicks

| Aspect | Implementation | Status |
|---|---|---|
| **Trigger** | `onClick` on card Link → `feedback.mutate({ gameId, action: 'CLICKED' })` | ✅ Implemented |
| **Validation** | Published game check, requires auth | ✅ Implemented |
| **Deduplication** | None (re-clicks allowed as signal) | ✅ By design |

### Dismissals

| Aspect | Implementation | Status |
|---|---|---|
| **Trigger** | ✕ button → `feedback.mutate({ gameId, action: 'DISMISSED' })` + local `dismissed` Set | ✅ Implemented |
| **Exclusion** | `getExcludedGameIds` includes dismissals (30-day window) | ✅ Implemented |
| **Scope** | Per-user, session-scoped | ✅ Implemented |

### Wishlist

| Aspect | Implementation | Status |
|---|---|---|
| **Endpoint** | Accepts `WISHLISTED` action | ✅ Implemented |
| **Frontend wiring** | Not yet connected | ⚠️ Deferred |
| **Counting** | Included in metrics | ✅ Implemented |

### Consent & Personalization

| Aspect | Implementation | Status |
|---|---|---|
| **Default** | `personalizationEnabled = false` | ✅ Schema default |
| **Storage** | `User.personalizationEnabled` + `personalizationEnabledAt` | ✅ Implemented |
| **Enforcement** | Server-side: `signals = null` if opted out | ✅ Implemented |
| **Endpoints** | `GET|PATCH /recommendations/preferences` | ✅ Implemented |
| **UI** | `/settings/personalization` toggle + reset button | ✅ Implemented |
| **Banner** | Shows to opted-out users in bucket | ✅ Implemented |
| **Reset** | `DELETE /recommendations/feedback` clears user history | ✅ Implemented |

### Anonymous Users

| Aspect | Implementation | Status |
|---|---|---|
| **Feed** | Served via `OptionalSessionGuard` | ✅ Implemented |
| **Method** | `legacy` (no personalization) | ✅ Implemented |
| **personalizationEnabled** | `null` in response | ✅ Implemented |
| **Impressions** | Not captured | ✅ By design |
| **Clicks/Dismissals** | Not captured | ✅ By design |

---

## 3. Data Quality Checks

| Check | Implementation | Status |
|---|---|---|
| **Impression dedup (client)** | `useRef<Set>` per session | ✅ |
| **Impression dedup (server)** | 60-min window, distinct on (userId, gameId) | ✅ |
| **Max impressions/request** | 50 (validated via `@ArrayMaxSize(50)`) | ✅ |
| **Published game validation** | Both impressions & feedback | ✅ |
| **Feedback game validation** | `findFirst` on published games | ✅ |
| **Deduplication formula** | `deduplicated = raw.length - recorded - invalid` | ✅ |
| **CTR calculation** | `min(1, clicks / impressions)` | ✅ |
| **Deduplication window** | 60 minutes | ✅ |
| **Dismissal window** | 30 days | ✅ |

---

## 4. Gaps & Limitations

| Gap | Impact | Mitigation |
|---|---|---|
| **Wishlist frontend not wired** | WISHLISTED events not generated | Deferred to wishlist-funnel milestone |
| **Anonymous impressions not tracked** | No CTR baseline for anonymous users | By design (privacy) |
| **Opted-out users: no impressions** | No CTR for opted-out cohort | By design (privacy) |
| **No view-through attribution** | Wishlist from impression not linked | Future work |
| **No A/B test infrastructure** | Cannot compare M23 vs legacy directly | Rollout is the experiment |
| **No legacy CTR baseline** | No pre-M23 impression pipeline | Documented as "no prior baseline" |

---

## 5. API Endpoint Summary

| Endpoint | Auth | Rate Limit | Purpose |
|---|---|---|---|
| `GET /recommendations/for-you` | Optional | 30/min | Feed |
| `POST /recommendations/feedback` | Session | 60/min | CLICKED/DISMISSED/WISHLISTED |
| `POST /recommendations/impressions` | Session | 60/min | CTR denominator |
| `DELETE /recommendations/feedback` | Session | 10/min | Reset history |
| `GET /recommendations/preferences` | Session | Global | Read consent |
| `PATCH /recommendations/preferences` | Session | 20/min | Write consent |
| `GET /recommendations/metrics` | Admin | Global | CTR/volume |
| `POST /recommendations/refresh-embeddings` | Admin | 1/min | Trigger refresh |

---

## 5. Database Schema

```prisma
model RecommendationFeedback {
  id        String                       @id @default(cuid())
  userId    String
  gameId    String
  action    RecommendationFeedbackAction // CLICKED | DISMISSED | WISHLISTED | IMPRESSION
  createdAt DateTime                     @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  game Game @relation(fields: [gameId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([gameId])
  @@index([action])
  @@map("recommendation_feedback")
}

model User {
  // ... existing fields ...
  personalizationEnabled       Boolean     @default(false)
  personalizationEnabledAt     DateTime?
}

enum RecommendationFeedbackAction {
  CLICKED
  DISMISSED
  WISHLISTED
  IMPRESSION
}
```

---

## 6. Observability Gaps to Monitor

| Area | Risk | Monitoring |
|---|---|---|
| **Impression drop** | Frontend bug stops impressions | Alert on impressions=0 for >1hr |
| **CTR spike** | Bot traffic or bug | Alert on CTR >50% for >30min |
| **CTR drop** | Recommendation quality issue | Alert on CTR <0.5% for >1hr |
| **Latency spike** | Provider/db degradation | Alert on p95 >3s for >5min |
| **Error rate spike** | 5xx >2% | Alert on error rate >2% for >5min |
| **Fallback rate** | Semantic path failing | Alert on method=legacy >90% |
| **Cost spike** | Embedding usage anomaly | Alert on daily cost >$10 |

---

## 7. Next Steps

1. **Phase 3:** Define baseline KPIs with explicit thresholds for 25% gate
2. **Phase 4:** Implement daily validation checklist
3. **Phase 5:** Establish legacy baseline (if possible) or document absence
4. Begin daily observation starting 2026-08-11

---

## 8. Baseline Phase Validation Summary (2026-08-10)

Pre-baseline validation of the remaining governance areas, completed 2026-08-10
(day 1). Each area has a dedicated report:

| Area | Report | Verdict |
|---|---|---|
| Failure & kill-switch (Art. 8) | `M23_FAILURE_VALIDATION.md` | ✅ Verified — kill switch tested in prod, degradation paths covered by unit tests |
| Cost governance | `M23_COST_GOVERNANCE.md` | ✅ ~$0.15/mo at 5% (0.03% of $500 ceiling) — not gating |
| Performance | `M23_PERFORMANCE_REVIEW.md` | ✅ p95 42 ms vs 3 s budget (98.6% headroom), 0% errors |
| Security & privacy | `M23_SECURITY_REVIEW.md` | ✅ All endpoints authN + throttled, admin role-gated, consent default-off |
| North Star evidence | `M23_NORTH_STAR_EVIDENCE.md` | ✅ Explainable recommendations surface taste signals ("Because you…") |
| Baseline vs legacy | `M23_BASELINE_COMPARISON.md` | ✅ Methodology defined; 7-day capture window |

**Key production measurements (2026-08-10):**

| Metric | Measured | Notes |
|---|---|---|
| Feed p50 | 41.0 ms | Empty prod catalog (pipeline overhead only) |
| Feed p95 | 41.7 ms | Same |
| Health p50 | 38.2 ms | Control |
| Error rate | 0% | — |
| Kill-switch propagation | < 60 s | Env change, zero-deploy |

**Decision:** ✅ All governance areas verified before the 7-day baseline window
(2026-08-10 → 2026-08-17). 25% gate decision scheduled for after window close.