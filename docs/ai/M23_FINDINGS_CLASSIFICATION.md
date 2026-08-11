# M23 — Existing Findings Classification (FV-1, FV-2, SEC-1)

**Date:** 2026-08-10
**Decision:** No fixes implemented during the observation freeze (per
`M23_OBSERVATION_FREEZE.md` §3 — none of these are P0/P1 emergencies).
**Status:** All three classified. **None block the 25% gate.**

---

## FV-1 — Embedding Provider Timeout

| Aspect | Value |
|---|---|
| **Severity** | Low |
| **Probability** | Low (OpenAI is highly available) |
| **Production impact** | If embed hangs, semantic path delays feed. `withRetry` bounds retries; provider SDK has default timeouts. Worst case: +200ms, then graceful degradation. |
| **Current mitigation** | `getSemanticCandidates` try/catch → `[]` → content path; no 500. Retry wrapper bounds attempts. |
| **Affects 25% gate?** | ❌ No (degradation path is the designed behavior; latency budget 3s has huge headroom) |
| **Remediation before expansion?** | ❌ Not required. Track as **technical debt**; add explicit `AbortSignal` timeout only if production latency anomalies appear. |
| **Classification** | **Technical debt / monitoring only** |

## FV-2 — No Circuit Breaker on Provider Failures

| Aspect | Value |
|---|---|
| **Severity** | Low |
| **Probability** | Low |
| **Production impact** | On a prolonged provider outage, every personalized request attempts (then degrades) rather than short-circuiting. Cost is near-zero (failed embed = minimal tokens); UX already degrades gracefully. |
| **Current mitigation** | Graceful degradation on every request; kill switch available if cost/latency becomes abnormal. |
| **Affects 25% gate?** | ❌ No |
| **Remediation before expansion?** | ❌ Not required at 25% (at 100% scale a circuit breaker is advisable). |
| **Classification** | **Technical debt** (defer to ≥25% expansion) |

## SEC-1 — Cursor JSON Size Unbounded

| Aspect | Value |
|---|---|
| **Severity** | Low |
| **Probability** | Low (requires authenticated-or-anonymous feed call with crafted cursor) |
| **Production impact** | `parseCursor` runs `JSON.parse` on user input; an oversized payload costs parsing time. Bounded in practice: 30 req/min throttle + `@nestjs` body/query size limits; rejection returns `null` (safe). No data exposure, no injection. |
| **Current mitigation** | `parseCursor` validates shape (`score` finite number, `gameId` string) and returns `null` on failure; endpoint throttled at 30/min. |
| **Affects 25% gate?** | ❌ No |
| **Remediation before expansion?** | ❌ Not required. Add a length cap (`cursor.length > 512 → null`) as low-priority hardening. |
| **Classification** | **Non-blocking / technical debt** |

---

## Summary Table

| Finding | Severity | Probability | Blocks 25%? | Classification | Action |
|---|---|---|---|---|---|
| FV-1 Embedding timeout | Low | Low | No | Technical debt / monitoring | Monitor; add AbortSignal if latency anomalies |
| FV-2 Circuit breaker | Low | Low | No | Technical debt | Defer to ≥25% |
| SEC-1 Cursor size | Low | Low | No | Non-blocking / debt | Add 512-char cap later |

**No blocking findings.** All three remain documented and controlled. Per the
freeze policy, none are implemented during the observation window.

---

## Product/Platform Issue (separate from M23)

| Aspect | Value |
|---|---|
| **Issue** | **No product path sets `Game.isPublished=true`** — a game created via the UI can never become visible in discovery (all consumers filter `isPublished: true`). |
| **Classification** | **Product/platform issue** — NOT an M23 defect. Per `M23_CATALOG_READINESS.md` §4. |
| **Blocks 25% gate?** | Yes, indirectly — it is the root cause of the empty catalog → discovery metrics INSUFFICIENT DATA. |
| **Remediation** | Outside M23: a publishing/publish-toggle workflow (DTO + service + frontend + moderation considerations). Do NOT alter the recommendation engine to compensate. |
| **Status** | Documented 2026-08-10. Tracked in `M23_CATALOG_READINESS.md` §4 and `STATUS.md`. **Not fixed during the freeze** (not a P0/P1 emergency; feature work is outside the freeze scope). |
