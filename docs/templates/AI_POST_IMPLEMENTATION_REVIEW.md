# AI Post-Implementation Review Template

**Feature:** [MXX — Feature Name]
**Post-Implementation Review Date:** YYYY-MM-DD
**Sprint Dates:** YYYY-MM-DD to YYYY-MM-DD

---

## Executive Summary

[2-3 sentences. Did the feature achieve its goals? Should it continue?]

---

## KPI Achievement

| KPI | Baseline | Target | Actual | Achieved? |
|-----|----------|--------|--------|-----------|
| Primary: | | | | ✅/❌ |
| Secondary: | | | | ✅/❌ |
| Secondary: | | | | ✅/❌ |

### Trend Analysis

[Week-over-week trend for primary KPI. Was it improving, flat, or declining?]

---

## Cost Analysis

| Metric | Estimate | Actual | Variance |
|--------|----------|--------|----------|
| Total sprint cost | $[X] | $[X] | [+/-%] |
| Cost per request | $[X] | $[X] | [+/-%] |
| Monthly projection | $[X] | $[X] | [+/-%] |

---

## User Feedback Summary

### Quantitative
- Satisfaction score: [X]/100
- Adoption rate: [X]% of eligible users
- Return rate: [X]% use feature again within 30 days

### Qualitative
- Top 3 positive themes:
  1. 
  2. 
  3. 
- Top 3 complaints:
  1. 
  2. 
  3. 

---

## Engineering Review

### What went well
1. 
2. 
3. 

### What went poorly
1. 
2. 
3. 

### Technical debt
| # | Item | Severity | Planned Fix Date |
|---|------|----------|-----------------|
| | | | |

---

## Decision Framework Compliance

| Gate | Passed? | Notes |
|------|---------|-------|
| 24-gate checklist | ✅/❌ | |
| Constitution articles | ✅/❌ | |
| Provider-agnostic verified | ✅/❌ | |
| Kill switch tested | ✅/❌ | |
| Non-AI fallback tested | ✅/❌ | |
| WCAG 2.2 AA | ✅/❌ | |

---

## Lessons Learned

### Technical
1. 
2. 

### Product
1. 
2. 

### Process
1. 
2. 

---

## Decision

[ ] **Continue** — feature delivers value, proceed to next improvement cycle
[ ] **Extend measurement** — need more data, maintain current cohort
[ ] **Redesign** — KPI gap requires architectural or UX changes
[ ] **Deprecate** — feature not delivering value, ADR required

If deprecation:
- [ ] ADR filed: `docs/adr/ADR-[XXX]-[feature]-deprecation.md`
- [ ] 30-day notice to users (if applicable)
- [ ] Feature flag toggled OFF
- [ ] Cost tracking disabled after 30 days

---

**Engineering Lead:** _____________ **CPO:** _____________ **Date:** _____________
