# M23 — 25% Rollout Gate Report

**Evaluation Date:** 2026-08-17 (end of 7-day baseline window)
**Rollout Under Evaluation:** 5% → 25%
**Decision Authority:** Engineering Lead + CPO
**Governance Reference:** `M23_ROLLOUT.md`, `M23_METRICS.md`, `AI_DECISION_FRAMEWORK.md`, `AI_SUCCESS_METRICS.md`, `AI_CONSTITUTION.md`, `M23_OBSERVATION_FREEZE.md`

---

## Gate Status: ⬜ NOT YET EVALUATED

**Evaluation Date:** 2026-08-17  
**Evaluator:** _____________  
**Decision:** □ PROMOTE → 25%  □ EXTEND 5% OBSERVATION  □ ROLLBACK / PAUSE

---

## Summary Metric Table

> **Policy:** No value is estimated or invented. A metric without a valid
> measurement is reported as **INSUFFICIENT DATA**.

| Metric | M23 | Baseline / Control | Target | Result |
|---|----:|---:|---:|---|
| CTR | TBD | TBD (no legacy pipeline) | ≥ legacy floor; if none: > 0.5% | TBD |
| Wishlist conversion | TBD | TBD | > 0% | TBD |
| Dismissal rate | TBD | TBD | < 15% | TBD |
| Recommendation diversity | TBD | — | ≥ 30% unique games of impressions | TBD |
| Opt-in rate | TBD | — | 30–60% of 5% bucket | TBD |
| p50 latency | 41 ms | — | < 3 s | PASS |
| p95 latency | 42 ms | — | < 3 s | PASS |
| Error rate | 0% | — | < 2% | PASS |
| AI cost | ~$0.15/mo | $500 ceiling | ≤ ceiling | PASS |

> **Note on latency/error/cost rows:** Measured 2026-08-10 with an empty
> production catalog (pipeline overhead only). These are observed values, not
> targets, and will be re-measured against a populated catalog at the gate.

---

## Mandatory Gate Criteria (All Must PASS)

---

## Mandatory Gate Criteria (All Must PASS)

### 1. Observation Window Complete
| Criterion | Threshold | Actual | Evidence | PASS/FAIL |
|---|---|---|---|---|
| 7-day baseline window complete | 7 full days (2026-08-10 → 2026-08-17) | | | ⬜ |
| No instrumentation gaps >4 hours | 0 gaps >4hr | | | ⬜ |
| No forced rollout changes during window | 0 changes | | | ⬜ |

### 2. Sufficient Valid Traffic
| Criterion | Threshold | Actual | Evidence | PASS/FAIL |
|---|---|---|---|---|
| Total impressions in 5% cohort | ≥ 1,000 | | `GET /metrics?days=7` | ⬜ |
| Unique users served recommendations | ≥ 100 | | | ⬜ |
| Valid (non-bot) traffic confirmed | >95% human | | | ⬜ |

### 3. Primary KPI — CTR
| Criterion | Threshold | Actual | Evidence | PASS/FAIL |
|---|---|---|---|---|
| 5% cohort CTR measured | CTR captured | | `GET /metrics?days=7` | ⬜ |
| CTR ≥ legacy floor (non-AI baseline) | CTR_M23 ≥ CTR_legacy | | | ⬜ |
| **Or if no legacy baseline:** CTR > 0.5% | CTR > 0.005 | | | ⬜ |

### 4. Secondary KPIs — All Must Meet Thresholds
| Criterion | Threshold | Actual | Evidence | PASS/FAIL |
|---|---|---|---|---|
| Dismissal rate | < 15% | | `dismissals/impressions` | ⬜ |
| Error rate (5xx) | < 2% sustained | | 7-day rolling | ⬜ |
| p95 feed latency | < 3 s | | `GET /for-you` timing | ⬜ |
| Zero-item feed rate | 0% | | `items.length === 0` rate | ⬜ |
| Personalized share (in 5% bucket) | > 50% | | `method != 'legacy'` | ⬜ |
| Opt-in rate (of 5% bucket) | 30–60% | | `personalizationEnabled=true` | ⬜ |

### 5. Cost Governance
| Criterion | Threshold | Actual | Evidence | PASS/FAIL |
|---|---|---|---|---|
| Cost per recommendation request | < $0.01 | | Token usage × pricing | ⬜ |
| Projected 25% monthly cost | < $500/month | | Extrapolation | ⬜ |
| Projected 100% monthly cost | < $500/month | | Extrapolation | ⬜ |

### 6. Reliability & Graceful Degradation
| Criterion | Threshold | Actual | Evidence | PASS/FAIL |
|---|---|---|---|---|
| No 500 errors on /for-you | 0 | | Error logs | ⬜ |
| Degraded rate (fallback to legacy) | < 2% | | `method != 'hybrid'` | ⬜ |
| Kill switch tested & working | Verified 2026-08-10 | ✅ Done | Session 29 evidence | ✅ |
| Kill switch propagation time | < 30 seconds | | | ⬜ |
| No empty feed states | 0% | | `items.length === 0` | ⬜ |

### 7. Privacy & Consent Compliance
| Criterion | Threshold | Actual | Evidence | PASS/FAIL |
|---|---|---|---|---|
| Opt-in default false | `personalizationEnabled=false` default | ✅ Schema | Schema verified | ✅ |
| Server-side enforcement | `signals=null` when opted out | ✅ Code | Code review | ✅ |
| Opt-out respected | No signals gathered | | Unit tests | ⬜ |
| Reset endpoint works | `DELETE /feedback` clears history | | E2E test | ⬜ |
| Admin metrics no PII | No user identifiers | | Code review | ⬜ |
| Anonymous handling | `personalizationEnabled=null` | | Code review | ✅ |

### 8. Security
| Criterion | Threshold | Actual | Evidence | PASS/FAIL |
|---|---|---|---|---|
| CSRF protection on all mutations | Global guard | ✅ Session 10 | Config review | ✅ |
| Rate limiting active | Per-endpoint limits | ✅ Config | Config review | ✅ |
| IDOR protection | User-scoped queries | ✅ Code | Code review | ✅ |
| Admin metrics auth | RolesGuard + ADMIN | ✅ Code | Code review | ✅ |
| No secret leakage | Zero in logs/responses | | Log audit | ⬜ |

### 9. AI Governance
| Criterion | Threshold | Actual | Evidence | PASS/FAIL |
|---|---|---|---|---|
| AI Constitution Article 8 | Fail gracefully verified | ✅ Tests | Test suite | ✅ |
| Article 5 (consent) | Opt-in default false | ✅ Schema | Schema | ✅ |
| Article 3 (explainability) | Every card has reason | ✅ Code | Code review | ✅ |
| No fabricated explanations | "Recommended for you" fallback | ✅ Code | Unit test | ✅ |
| Provider agnostic | `AI_PROVIDER` swap works | ✅ Architecture | Config | ✅ |
| Cost ceiling | < $500/month | | Projection | ⬜ |

---

## Conditional Criteria (May Trigger CONDITIONAL)

| Criterion | Trigger | Resolution |
|---|---|---|
| Traffic < 1,000 impressions | INSUFFICIENT DATA | Extend observation |
| CTR 0.5%–1.0% (unclear vs legacy) | CONDITIONAL | Extend to 14 days |
| Dismissal rate 15–20% | CONDITIONAL | Investigate quality |
| Opt-in rate < 20% | CONDITIONAL | UX review needed |
| Cost projection > $300/mo at 25% | CONDITIONAL | Cost optimization |

---

## Automatic FAIL Criteria (Immediate Rollback/Kill Switch)

| Criterion | Trigger | Action |
|---|---|---|
| CTR below legacy floor for 3+ consecutive days | FAIL | Kill switch → 0% |
| Error rate > 5% for 2+ consecutive days | FAIL | Kill switch → 0% |
| Cost per request > $0.05 | FAIL | Kill switch → 0% |
| Privacy violation (cross-user data leak) | FAIL | Kill switch → 0% |
| Negative user feedback > 5% of cohort | FAIL | Reduce to 0% |

---

## Evidence Collection Commands

```bash
# 7-day metrics
curl -H "Cookie: session=..." "https://playmorrow-api-aged-mountain-9542.fly.dev/api/recommendations/metrics?days=7"

# Daily latency check
for i in {1..10}; do time curl -s "https://playmorrow-api-aged-mountain-9542.fly.dev/api/recommendations/for-you?limit=12" > /dev/null; done

# Error rate check
curl -H "Cookie: session=..." "https://playmorrow-api-aged-mountain-9542.fly.dev/api/recommendations/metrics?days=1"

# Cost estimation
# OpenAI dashboard → embeddings usage × $0.0001/1k tokens (text-embedding-3-small)
```

---

## Decision Matrix

| Evidence | Decision |
|---|---|
| All mandatory PASS, sufficient valid traffic, no blocking finding | 🟢 **PROMOTE → 25%** |
| System healthy but metrics inconclusive / sample insufficient / control inadequate | 🟡 **EXTEND 5% OBSERVATION** |
| Security/privacy risk, reliability degradation, abnormal cost, UX harm, data quality unreliable, governance violation | 🔴 **ROLLBACK / PAUSE** |
| Insufficient traffic/data | 🟡 **EXTEND 5% OBSERVATION** (re-evaluate in 7–14 days) |

> **Rule:** Do NOT promote merely because engineering metrics are good. Promotion
> requires objective product-metric evidence (discovery value), not just
> stability/cost/latency. See `M23_OBSERVATION_FREEZE.md` §12 and
> `M23_NORTH_STAR_EVIDENCE.md`.

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| AI Engineer | | | |
| Engineering Lead | | | |
| CPO | | | |

---

## Post-Decision Actions

| Decision | Next Steps |
|---|---|
| 🟢 **PROMOTE → 25%** | 1. Document gate evidence 2. Set `RECOMMENDATIONS_ROLLOUT_PCT=25` 3. Update freeze for new window 4. Monitor 7 days 5. Evaluate 100% gate |
| 🟡 **EXTEND 5%** | 1. Document specific gap (traffic / sample / control / inconclusive) 2. Keep freeze active 7–14 more days 3. Re-evaluate |
| 🔴 **ROLLBACK / PAUSE** | 1. Set `RECOMMENDATIONS_ENABLED=false` (kill switch) 2. Root cause analysis 3. Fix or deprecate per constitution |

## Historical Record

| Date | Rollout | Decision | Notes |
|---|---|---|---|
| 2026-08-10 | 0% → 5% | DEPLOYED | Baseline window started; observation freeze ACTIVE |
| 2026-08-17 | 5% → ? | PENDING | 7-day baseline complete; gate evaluation due |

---

**Document Version:** 1.0  
**Created:** 2026-08-10  
**Last Updated:** 2026-08-10  
**Owner:** AI Engineer (M23)  
**Governance Owner:** Engineering Lead