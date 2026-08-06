# AI Decision Framework v2 (Simplified)

**Status:** Active — mandatory for all AI features
**Version:** 2.0 (simplified from 24 to 8 gates)
**Rationale:** 24-gate framework was premature for a project with 0 shipped AI features. 8 gates preserve rigor while being usable.

---

## 8-Gate Decision Checklist

Every AI feature proposal must answer these 8 questions before implementation.

### Gate 1 — Value
- [ ] What specific problem does this solve for players or studios?
- [ ] How would we measure if it solved it?

### Gate 2 — User
- [ ] Can a user disable this AI feature?
- [ ] Can a human override the AI's output?

### Gate 3 — Privacy
- [ ] Does this use personal data? If yes: is there opt-in consent?
- [ ] Can a user delete their AI interaction history for this feature?

### Gate 4 — Safety
- [ ] What happens when the AI is wrong? (Define graceful degradation path)
- [ ] Does this have a kill switch? (Feature flag that disables it)

### Gate 5 — Cost
- [ ] What's the estimated monthly cost at 100% rollout?
- [ ] Is there a cheaper provider we could switch to without code changes?

### Gate 6 — Explainability
- [ ] Can the AI explain why it made this recommendation/decision?
- [ ] Is the explanation understandable by a non-technical user?

### Gate 7 — North Star
- [ ] Does this help players find games they didn't know they wanted?
- [ ] If not: which product goal does it serve instead? (Time/Revenue/Trust)

### Gate 8 — Ship Small
- [ ] What's the simplest version that delivers value? (Build that first)
- [ ] Can we test with ≤100 users before broader rollout?

---

## Scoring

- **All 8 gates pass**: Approved for implementation
- **1-2 gates fail**: Redesign the feature to pass, then re-submit
- **3+ gates fail**: Reject — does not meet minimum bar

---

## Relationship to Constitution

This decision framework implements the following constitutional articles:
- Article 1 (Value Over Novelty) → Gate 1
- Article 3 (Always Explain) → Gate 6
- Article 5 (Protect Privacy) → Gate 3
- Article 7 (Human Oversight) → Gate 2
- Article 8 (Fail Gracefully) → Gate 4
- Article 10 (Measure Everything) → Gate 1
- Article 15 (Kill-Switchable) → Gate 4
- Article 6 (Provider-Agnostic) → Gate 5

---

## Migration from v1 (24-gate)

The original 24-gate framework (v1) is archived at `docs/strategy/AI_DECISION_FRAMEWORK.md`. It remains as a reference for comprehensive evaluation when the project has AI features in production and an organization to support rigorous review.

This v2 framework is proportionate to the current project state: single developer, 0 AI features shipped, pre-production.
