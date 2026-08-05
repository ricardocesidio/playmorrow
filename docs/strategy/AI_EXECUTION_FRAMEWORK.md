# AI Execution Framework

**Status:** Active — mandatory for all Phase 6 milestones
**Last updated:** 2026-08-05
**Authority:** Engineering Lead enforces compliance

---

## Purpose

This document defines the mandatory execution cycle for every AI feature at Playmorrow. From M22 forward, every AI milestone follows this exact lifecycle: **Build → Measure → Learn → Improve → Review → Repeat.**

No AI feature is ever "done." Every feature enters a continuous improvement loop governed by real production data.

---

## The 6-Step Cycle

```
┌──────────────────────────────────────────────────────┐
│                    Build → Measure                    │
│                      ↑        ↓                       │
│                   Repeat     Learn                    │
│                      ↑        ↓                       │
│                   Review ← Improve                    │
└──────────────────────────────────────────────────────┘
```

---

## Step 1 — Build

**Implement ONE AI capability.** No multi-feature sprints. One feature, one goal, one KPI.

Before writing code, complete the [AI Decision Framework](./AI_DECISION_FRAMEWORK.md) checklist. Every feature must pass all 24 gates.

Define before implementation:

| Requirement | Mandatory |
|-------------|-----------|
| Primary KPI with baseline and target | ✅ |
| Secondary KPI | ✅ |
| Constitution articles satisfied | ✅ |
| Product goal(s) served | ✅ |
| Non-AI fallback path | ✅ |
| Kill switch (feature flag) | ✅ |
| Cost estimate per 1,000 requests | ✅ |
| Provider compatibility verified for ≥2 providers | ✅ |

**Build phase exit criteria:**
- [ ] Feature deployed behind feature flag
- [ ] All tests pass (unit + integration)
- [ ] Kill switch tested (on → off → fallback works)
- [ ] Cost tracking wired
- [ ] KPI dashboard configured
- [ ] Code review references constitution articles

---

## Step 2 — Measure

**Enable the feature for a limited cohort** (internal team → 5% users → 25% → 100%).

Track the defined KPIs daily for the first week, then weekly thereafter.

Every AI feature must track at minimum:

### Discovery Features
| KPI | Data Source | Cadence |
|-----|-----------|---------|
| Search success rate | Search service logs | Daily |
| Recommendation CTR | Frontend analytics | Daily |
| Wishlist conversion | API + DB | Weekly |
| Zero-result search rate | Search service | Daily |
| Time to discovery | Session analytics | Weekly |

### Studio Features
| KPI | Data Source | Cadence |
|-----|-----------|---------|
| Feature adoption rate | Analytics | Weekly |
| Time saved estimate | User surveys | Monthly |
| AI suggestion acceptance rate | Feature logs | Weekly |
| Studio satisfaction | NPS survey | Monthly |

### Moderation Features
| KPI | Data Source | Cadence |
|-----|-----------|---------|
| False positive rate | Moderation review queue | Daily |
| Spam detection rate | Reports DB | Weekly |
| Moderation TTR | Queue analytics | Daily |
| User reports per day | Reports DB | Weekly |

### Platform Features
| KPI | Data Source | Cadence |
|-----|-----------|---------|
| P95 latency | AIMetricsService | Real-time |
| Cost per request | AIMetricsService | Daily |
| Error rate | AIMetricsService | Real-time |
| Daily active users | Analytics | Daily |

**Measure phase exit criteria (after 2 weeks):**
- [ ] ≥1000 data points collected
- [ ] Statistical significance confirmed (p<0.05)
- [ ] KPI baseline confirmed against pre-launch measurement
- [ ] Cost within budget (±20% of estimate)

---

## Step 3 — Learn

**Analyze the data. Do not optimize based on opinions.**

Collect evidence from:

| Source | Frequency | Owner |
|--------|-----------|-------|
| Analytics dashboard | Daily | Data Lead |
| A/B test results | Weekly | AI Engineer |
| User feedback (in-app) | Weekly | Product Manager |
| Studio interviews (qualitative) | Bi-weekly | Product Manager |
| Support tickets (AI-related) | Weekly | Support Lead |
| Cost analysis | Weekly | Engineering Lead |
| Hallucination audit | Weekly | AI Engineer |

**Every insight must become one of:**

1. **Bug fix** — AI is wrong, fix the model/prompt/retrieval
2. **Feature improvement** — AI is right but could be better
3. **UX change** — AI works but interface is confusing
4. **Product decision** — AI reveals a product gap (not an AI problem)
5. **Nothing** — Data doesn't show a clear signal; continue measuring

**Learn phase exit criteria:**
- [ ] ≥3 data-informed insights documented
- [ ] At least one actionable improvement identified
- [ ] No showstopper bugs (hallucination rate acceptable, error rate <2%)

---

## Step 4 — Improve

**Based on collected evidence, improve exactly one thing.**

The improvement must be measurable — you must be able to re-measure the same KPI and confirm improvement.

| Finding | Improvement | Re-measure |
|---------|------------|------------|
| Hallucination rate 12% in game facts | Strengthen RAG retrieval, add source citation | Hallucination audit after 1 week |
| Recommendation CTR 8% (target 15%) | A/B test: content-based vs collaborative weighting | CTR after 2 weeks |
| False positive rate 8% in moderation | Raise confidence threshold to 0.9, increase human review | FPR after 1 week |
| P95 latency 4.2s (target <3s) | Add embedding cache, switch to gpt-4o-mini | Latency after deployment |

**Improve phase exit criteria:**
- [ ] Improvement deployed to same cohort
- [ ] KPI re-measured after ≥1 week
- [ ] Improvement confirmed OR root cause not in AI (document why)

---

## Step 5 — Review

**At the end of every sprint, create a Sprint AI Report** using the [template](../templates/AI_SPRINT_REPORT_TEMPLATE.md).

The report must include:

| Section | Required |
|---------|----------|
| Feature name and milestone | ✅ |
| Primary KPI — before vs after | ✅ |
| Secondary KPIs | ✅ |
| Cost analysis (total + per-request) | ✅ |
| User feedback summary | ✅ |
| Bugs found and fixed | ✅ |
| Technical debt created | ✅ |
| Constitution compliance check | ✅ |
| Next iteration plan (what to improve next) | ✅ |
| Kill switch status (operational?) | ✅ |

**Review phase exit criteria:**
- [ ] Sprint AI Report filed in `docs/ai/sprints/`
- [ ] Report reviewed by Engineering Lead
- [ ] Decision: Continue / Redesign / Deprecate

---

## Step 6 — Repeat

**Begin the next cycle.** The same feature enters Build → Measure → Learn → Improve → Review again, with a new improvement target.

Or: **Begin a new AI milestone** (M22 → M23 → M24 → M25 → M26), each following this same cycle.

---

## Success Criteria

An AI feature is considered **successful** only if it achieves ≥1 of:

- ✅ Saves users measurable time
- ✅ Improves game discovery (measurable)
- ✅ Increases studio productivity (measurable)
- ✅ Increases marketplace revenue (measurable)
- ✅ Improves community health (measurable)
- ✅ Reduces moderation effort (measurable)
- ✅ Reduces support workload (measurable)
- ✅ Improves platform trust (measurable)

If it achieves **none**, the feature must be redesigned or removed.

---

## Failure Policy

Per Constitution Article 16:

| Week | Action |
|------|--------|
| 1-4 | Normal measurement |
| 5-8 | If KPI under target for 4 consecutive weeks → automated alert |
| 8 | One improvement cycle attempted |
| 10 | Re-evaluate. If still under target → ADR for deprecation |

**Playmorrow does not accumulate AI feature debt.**

---

## Cost Governance

Per sprint, track:

| Metric | Limit | Owner |
|--------|-------|-------|
| Total AI spend | <$500/month | Engineering Lead |
| Cost per chat request | <$0.01 | AI Engineer |
| Cost per embedding | <$0.0001 | AI Engineer |
| Cache hit rate | >60% | AI Engineer |
| Unexplained cost spike >20% | Escalate to CTO | Engineering Lead |

If costs exceed budget for 2 consecutive months, reduce to gpt-4o-mini for all features until costs stabilize.

---

## Governance Check (Before Every Sprint)

- [ ] AI Constitution — all relevant articles referenced
- [ ] North Star — "does this help users find games they didn't know they wanted?"
- [ ] Privacy — no PII in AI context
- [ ] Security — no API key exposure
- [ ] Accessibility — AI UI passes WCAG 2.2 AA
- [ ] Provider independence — works with ≥2 providers
- [ ] Explainability — every output has a "why"
- [ ] Cost — within monthly budget
- [ ] Kill switch — operational and tested

---

## Relationship to Other Documents

| Document | Role |
|----------|------|
| [AI_NORTH_STAR.md](./AI_NORTH_STAR.md) | *Why* we do this |
| [AI_CONSTITUTION.md](./AI_CONSTITUTION.md) | *What* we must comply with |
| [AI_GOVERNANCE.md](./AI_GOVERNANCE.md) | *Who* decides what |
| [AI_PRODUCT_PRINCIPLES.md](./AI_PRODUCT_PRINCIPLES.md) | *Which* goals we serve |
| [AI_DECISION_FRAMEWORK.md](./AI_DECISION_FRAMEWORK.md) | *Whether* to build it |
| **This document** | ***How*** we execute it |

---

**This framework is mandatory for every remaining Phase 6 milestone. No exceptions.**
