# M23 — KPI Baseline & Metrics

**Feature:** M23 — Recommendation Engine (hybrid)
**Date:** 2026-08-09
**Status:** Pre-launch baseline (governed 5% rollout active)

Per the execution framework, every KPI needs a measured baseline *before*
rollout. **Impressions are not yet instrumented** — capturing the baseline is
the first measurement milestone of the rollout (see Measurement Plan).

---

## Pre-Launch Measurement

The pre-AI baseline for the For You feed is the **legacy trending floor**
(the same games the hybrid engine shows to users without signals). Trending
card CTR is not separately instrumented today; the dashboard analytics events
(`AnalyticsEvent`) exist but no CTR funnels are wired for the feed.

| KPI | Pre-AI Baseline | Measurement Method | Sample Size | Date Measured |
|-----|-----------------|-------------------|-------------|---------------|
| Feed CTR (→ game detail) | **Not instrumented** | Requires impression tracking (condition C-2) | — | — |
| p95 feed latency | 161 ms (in-process, cold 349 ms) | Live spec on dev | 5 req | 2026-08-09 |
| Error rate | 0% (200 always; degrade on provider down) | Live spec | 4 scenarios | 2026-08-09 |
| Cost per request | $0.000028 (semantic embed, worst case) | Estimate from token math | — | 2026-08-09 |

---

## AI Feature KPIs

### Primary KPI

**KPI Name:** For You feed CTR (recommended → game detail).
**Definition:** `clicks / impressions` on For You feed cards (per user cohort).
**Current Baseline:** Not instrumented — baseline capture is the first
rollout milestone (target: complete within the first 5% window).
**Target After AI:** +25% vs legacy trending floor (plan §14).
**Data Source:** `AnalyticsEvent` (GAME_PAGE_VIEW) + `FeedbackEvent`
(CLICKED), joined on session/user.
**Measurement Cadence:** Weekly.

### Secondary KPIs

| KPI | Definition | Baseline | Target | Cadence |
|-----|-----------|----------|--------|---------|
| Feed latency p95 | Time-to-cards | 161 ms in-process | <3 s | Continuous |
| Error rate | 5xx / total feed requests | 0% (degrade, never 500) | <2% | Continuous |
| Dismissal rate | DISMISSED / impressions | Not instrumented | <15% | Weekly |
| Personalized share | Requests using semantic path | — (per-user) | >50% of 5% cohort | Weekly |
| Zero-item rate | Feed returns empty | 0% (trending floor) | 0% | Weekly |
| Cost per request | Embeddings + chat for feed | $0.000028 max | <$0.01 | Monthly |

---

## Cost Baseline

| Metric | Value |
|--------|-------|
| Current monthly AI spend (pre-M23) | ~$0 (features gated, no real traffic) |
| Projected additional cost — feed embeddings | ~$0.84/month at 30k personalized requests |
| Projected additional cost — per-request chat (M22) | ~$16/month at 10k chats |
| New total projected | **~$17/month** |
| Budget limit (execution framework) | $500/month |

## Success Criteria

### Minimum Viable Success
- [x] Feed is never empty, never 500 (verified live with provider down)
- [x] Latency p95 < 3 s (verified: 161 ms in-process)
- [x] Cost per request < $0.01 (verified: $0.000028 worst case)
- [ ] 5% cohort CTR baseline captured (first rollout milestone)

### Target Success
- [ ] CTR +25% vs legacy floor (8-week measurement)
- [ ] Dismissal rate <15%
- [ ] <2% error rate sustained for 4 weeks

## Failure Criteria (deprecation triggers, Article 16)

- [ ] CTR below legacy floor for 8 consecutive weeks
- [ ] Error rate >2% for 4 consecutive weeks
- [ ] Cost per request > $0.01
- [ ] Negative user feedback (reports about feed) > 2% of cohort

## Measurement Plan

| Week | Action | Owner |
|------|--------|-------|
| 1-2 | Capture 5% cohort baseline (CTR, dismissals) — requires impressions instrumentation (C-2) | AI Engineer |
| 2 | Implement per-user personalization opt-out + feedback reset (C-1) | AI Engineer |
| 3-4 | Review metrics; if stable, 5% → 25% | Engineering Lead |
| 5+ | Full review; 25% → 100% after certification | CPO |
| Weekly | KPI review | Data Lead |
| Monthly | Cost review | Engineering Lead |

---

**Approved by:** _____________ **Date:** _____________
