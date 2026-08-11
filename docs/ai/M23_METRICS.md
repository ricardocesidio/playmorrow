# M23 — KPI Baseline & Metrics

**Feature:** M23 — Recommendation Engine (hybrid)
**Date:** 2026-08-09
**Status:** 🟢 **OBSERVATION FREEZE ACTIVE** — baseline capture running
(2026-08-10 → 2026-08-17). Metric definitions are FROZEN (see
`M23_OBSERVATION_FREEZE.md` §2). Do not alter CTR/impression/dismissal
semantics during the window; do not optimize to move the numbers.
**Observation governance:** `docs/ai/M23_OBSERVATION_FREEZE.md` ·
`docs/ai/M23_METRIC_DEFINITIONS_AUDIT.md` · `docs/ai/M23_DATA_QUALITY_AUDIT.md`

Per the execution framework, every KPI needs a measured baseline *before*
rollout. Impressions are now instrumented end-to-end:

- Frontend: `ForYouFeed` posts `POST /recommendations/impressions` for every
  card it renders (each game once per client session; the API additionally
  dedupes within a 60-minute window).
- Clicks: `POST /recommendations/feedback` (CLICKED) on card open.
- Dismissals: `POST /recommendations/feedback` (DISMISSED) on ✕.
- Metrics: `GET /recommendations/metrics?days=N` (ADMIN) returns clicks,
  dismissals, wishlists, impressions and CTR over the window.

The legacy pre-AI baseline remains **not separately instrumented** (the legacy
trending floor has no impression pipeline); the first 5%-cohort CTR numbers
therefore act as the floor reference for the +25% target.

---

## Pre-Launch Measurement

| KPI | Pre-AI Baseline | Measurement Method | Sample Size | Date Measured |
|-----|-----------------|-------------------|-------------|---------------|
| Feed CTR (→ game detail) | **No prior baseline** — first 5% cohort numbers become the floor | Impressions + CLICKED events (C-2 closed) | — | 2026-08-09 |
| p95 feed latency | 161 ms (in-process, cold 349 ms) | Live spec on dev | 5 req | 2026-08-09 |
| Error rate | 0% (200 always; degrade on provider down) | Live spec | 4 scenarios | 2026-08-09 |
| Cost per request | $0.000028 (semantic embed, worst case) | Estimate from token math | — | 2026-08-09 |

---

## AI Feature KPIs

### Primary KPI

**KPI Name:** For You feed CTR (recommended → game detail).
**Definition:** `clicks / impressions` on For You feed cards (per user cohort).
**Current Baseline:** Baseline capture started with C-2 (2026-08-09); the first
readable window closes after ~7 days of the 5% rollout.
**Target After AI:** +25% vs legacy trending floor (plan §14).
**Data Source:** `RecommendationFeedback` rows — CLICKED / IMPRESSION actions
(plus DISMISSED and WISHLISTED), aggregated by `GET /recommendations/metrics`.
**Measurement Cadence:** Weekly.

### Secondary KPIs

| KPI | Definition | Baseline | Target | Cadence |
|-----|-----------|----------|--------|---------|
| Feed latency p95 | Time-to-cards | 161 ms in-process | <3 s | Continuous |
| Error rate | 5xx / total feed requests | 0% (degrade, never 500) | <2% | Continuous |
| Dismissal rate | DISMISSED / impressions | Baseline capture active | <15% | Weekly |
| Personalized share | Requests using semantic path | — (per-user) | >50% of 5% cohort | Weekly |
| Opt-in rate | Users enabling personalization | 0% (feature new) | 30–60% of bucket | Weekly |
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
- [x] Impression instrumentation live (C-2) — baseline capture in progress

### Target Success
- [ ] CTR +25% vs legacy floor (8-week measurement)
- [ ] Dismissal rate <15%
- [ ] <2% error rate sustained for 4 weeks
- [ ] Opt-in rate within 30–60% of the bucket (consent, not defaults)

## Failure Criteria (deprecation triggers, Article 16)

- [ ] CTR below legacy floor for 8 consecutive weeks
- [ ] Error rate >2% for 4 consecutive weeks
- [ ] Cost per request > $0.01
- [ ] Negative user feedback (reports about feed) > 2% of cohort

## Measurement Plan

| Week | Action | Owner |
|------|--------|-------|
| 1-2 | Capture 5% cohort baseline (CTR, dismissals, opt-in rate) — instrumentation live (C-2) | AI Engineer |
| 1 | Close out C-1/C-2/C-3 verification (M23 Final Hardening certification) | AI Engineer |
| 3-4 | Review metrics; if stable, 5% → 25% | Engineering Lead |
| 5+ | Full review; 25% → 100% after certification | CPO |
| Weekly | KPI review (metrics endpoint + dashboard) | Data Lead |
| Monthly | Cost review | Engineering Lead |

---

**Approved by:** _____________ **Date:** _____________
