# M23 — Baseline vs Recommendation Performance Comparison

**Analysis Date:** 2026-08-10 (pre-baseline)
**Status:** Pre-baseline assessment — actual comparison requires 7-day production data
**Status:** ⬜ PENDING PRODUCTION DATA

---

## 1. Legacy Baseline Status

### Current State
| Baseline Type | Status | Notes |
|---|---|---|
| **Legacy CTR** | ❌ **NOT INSTRUMENTED** | The legacy trending floor (pre-AI) has no impression pipeline. No historical CTR data exists. |
| **Legacy Wishlist Conversion** | ❌ **NOT INSTRUMENTED** | No impression pipeline for legacy recommendations. |
| **Legacy Dismissal Rate** | ❌ **NOT INSTRUMENTED** | Dismissal tracking only exists for M23 feedback. |
| **Legacy Latency** | ✅ MEASURED (dev) | p50 138ms, p95 161ms (in-process, cold 349ms) |
| **Legacy Error Rate** | ✅ MEASURED (dev) | 0% (always 200, degrades on provider down) |

### Key Finding
> **No statistically valid legacy baseline exists for discovery metrics (CTR, wishlist conversion, dismissal rate).**

The M23 5% cohort CTR numbers will become the de facto floor reference. The "+25% vs legacy floor" target in `M23_METRICS.md` must be interpreted as:
> M23 CTR must be ≥ 25% above whatever the 5% cohort CTR measures out to be.

This is a methodological limitation — not a defect. The rollout architecture itself is the experiment.

---

## 2. Comparison Methodology Options

### Option A: 5% Cohort as Self-Baseline (Current Plan)
- **Method:** First 7 days of 5% rollout establishes baseline
- **Gate:** CTR +25% vs this self-baseline for 25% expansion
- **Risk:** No true control group; regression to mean possible
- **Status:** ✅ Current governance plan

### Option B: Legacy Holdout (Not Implemented)
- **Method:** Keep 5% of users on legacy, 5% on M23
- **Gate:** Direct A/B comparison
- **Risk:** Requires rollout architecture changes
- **Status:** ❌ Not implemented

### Option C: Historical Comparison (Not Possible)
- **Method:** Compare M23 CTR vs historical legacy metrics
- **Gap:** No historical impression data exists
- **Status:** ❌ Not possible

---

## 3. M23 Production Capabilities (Verified)

### What M23 Can Measure (Production Ready)
| Metric | Instrumentation | Status |
|---|---|---|
| Impressions | `POST /impressions` + 60-min dedup | ✅ Live |
| Clicks | `POST /feedback` CLICKED | ✅ Live |
| Dismissals | `POST /feedback` DISMISSED | ✅ Live |
| Wishlists | `POST /feedback` WISHLISTED | ✅ API ready (frontend deferred) |
| CTR | `clicks/impressions` | ✅ Live via `/metrics` |
| Dismissal Rate | `dismissals/impressions` | ✅ Live |
| Wishlist Conversion | `wishlists/impressions` | ✅ Live |
| Opt-in Rate | `personalizationEnabled=true` | ✅ Live |
| p95 Latency | API timing | ✅ Live |
| Error Rate | 5xx rate | ✅ Live |
| Fallback Rate | `method != 'hybrid'` | ✅ Live |
| Cost/Request | Token tracking | ✅ Live |

### What M23 Cannot Measure (Gaps)
| Gap | Reason | Impact |
|---|---|---|
| Legacy CTR | No impression pipeline for legacy | Cannot compute true +25% |
| View-through attribution | Wishlist from impression not linked | Attribution incomplete |
| Cross-session attribution | Session-scoped impression dedup | Multi-session journeys not tracked |
| A/B test infrastructure | No controlled experiment framework | Cannot isolate M23 effect |

---

## 4. Comparison Framework for 25% Gate

Since no legacy baseline exists, the 25% gate will use **relative improvement over the 5% cohort baseline**:

### Primary Metric
```
CTR_improvement = (CTR_25%_cohort - CTR_5%_baseline) / CTR_5%_baseline
Target: CTR_improvement ≥ 0.25 (25%)
```

**Risk:** Same cohort, different time — not a controlled experiment.

### Secondary Validation
| Metric | 5% Baseline | 25% Target | Method |
|---|---|---|---|
| CTR | X% | ≥ 1.25 × X% | Relative |
| Dismissal Rate | X% | ≤ 15% | Absolute |
| Opt-in Rate | X% | 30–60% of bucket | Absolute |
| p95 Latency | X ms | < 3s | Absolute |
| Error Rate | X% | < 2% | Absolute |
| Cost/Request | $X | < $0.01 | Absolute |

---

## 5. Recommendation

### For 25% Gate Evaluation (2026-08-17)

**Use the 5% cohort as the baseline** — this is the only viable approach given current instrumentation.

**Caveats to document in gate decision:**
1. No true control group — comparison is temporal, not experimental
2. Cohort composition may differ (early adopters vs general)
3. Seasonal/weekly effects not controlled
4. "Improvement" may reflect novelty or regression to mean

**Mitigation:** If 25% approved, design a future controlled experiment (Option B) for 100% gate.

---

## 5.1 Control-Group Conclusion (Causality Statement)

Per `M23_OBSERVATION_FREEZE.md` §6, the control-group investigation concludes:

- **Option A (recommendation users vs non-recommendation users):** ❌ Not valid.
  Both groups receive the same homepage feed (For You is the primary feed);
  there is no separate recommendation-exposed cohort vs non-exposed cohort.
- **Option B (5% bucket vs control bucket):** ❌ Not implemented. The rollout
  hash assigns users to M23 or legacy, but the legacy control bucket is NOT
  instrumented with impressions/clicks, so no comparable metrics can be
  collected from it.
- **Option C (historical discovery behavior):** ❌ Not possible. No impression
  pipeline existed before M23; no historical CTR/wishlist/dismissal data.
- **Option D (no valid baseline):** ✅ **APPLICABLE.**

> **Conclusion:** There is currently **insufficient evidence to establish causal
> improvement attributable to M23**. No statistically meaningful control group
> exists. The 5% cohort can serve as a *temporal self-baseline* for stability
> tracking, but it cannot prove causality.

This is an acceptable result. It does NOT block the observation — it defines the
honest interpretation of the 25% gate: any decision to promote must be framed as
"measured discovery behavior in the 5% cohort meets thresholds," not "M23 is
causally proven better than the control." A controlled A/B experiment is the
recommended follow-up before the 100% gate.

---

## 5. Pre-Baseline Production Verification (2026-08-10)

| Component | Status | Evidence |
|---|---|---|
| M23 endpoints live | ✅ | All 7 endpoints return expected codes |
| Impression pipeline | ✅ | `POST /impressions` returns `{recorded,deduplicated,invalid}` |
| Click tracking | ✅ | `POST /feedback` CLICKED works |
| Dismissal tracking | ✅ | `POST /feedback` DISMISSED works |
| Reset endpoint | ✅ | `DELETE /feedback` returns deleted count |
| Preferences | ✅ | `GET|PATCH /preferences` work |
| Admin metrics | ✅ | `GET /metrics` returns counts + CTR |
| Kill switch | ✅ | Tested 2026-08-10 |
| Frontend loads | ✅ | Homepage renders without error |

---

## 6. Recommendation

**Proceed with 7-day baseline as planned.** The instrumentation is complete and production-verified. The lack of a legacy baseline is a known limitation documented in `M23_METRICS.md` and `M23_ROLLOUT.md`.

**At 25% gate (2026-08-17):**
- Use 5% cohort CTR as baseline
- Require ≥25% relative improvement for 25% expansion
- Document methodological caveats in gate decision
- If approved, plan controlled experiment for 100% gate