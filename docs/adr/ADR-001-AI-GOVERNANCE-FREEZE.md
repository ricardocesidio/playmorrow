# ADR-001: AI Governance Freeze

**Status:** Accepted
**Date:** 2026-08-05
**Author:** CTO
**Deciders:** CEO, CTO

---

## Context

Playmorrow has completed its AI strategy sprint, producing 11 strategic documents defining the platform's AI identity, principles, governance, and product goals. The platform has also built the AI Foundation (M22), an engineering module with provider-agnostic architecture and 82 passing tests.

Before beginning M22 feature implementation (AI Assistant), the strategic direction must be frozen to prevent ad-hoc decisions during development.

---

## Decision

**The AI strategy is frozen as governance artifacts.**

Specifically:

1. `AI_NORTH_STAR.md` — the single-page strategic identity governing all AI decisions
2. `AI_GOVERNANCE.md` — permanent governance rules (who decides what, review cadence, versioning)
3. `AI_CONSTITUTION.md` — 20 immutable articles that every AI feature must comply with
4. `AI_PHILOSOPHY.md` — mission, vision, ethics, limitations
5. `AI_GUIDING_PRINCIPLES.md` — 15 principles with compliance tests
6. `AI_PRODUCT_PRINCIPLES.md` — 4 product goals
7. `AI_DECISION_FRAMEWORK.md` — 24-gate checklist
8. `AI_FEATURE_EVALUATION_MATRIX.md` — scoring matrix
9. `AI_PERSONALITY.md` — tone of voice
10. `AI_SUCCESS_METRICS.md` — 25 KPIs
11. `AI_ROADMAP_ALIGNMENT.md` — M22-M26 validated

Any modification to these documents requires a new ADR. For document 1 (North Star), CEO + CTO approval is required. For documents 2-3 (Governance, Constitution), CTO approval with CEO notification is required.

---

## Consequences

### What becomes easier:
- AI feature decisions are objective and governed
- New AI engineers can onboard quickly by reading the strategy documents
- Product reviews have clear acceptance criteria (decision framework + scoring matrix)
- Architecture decisions align with established principles
- Provider changes don't require strategy renegotiation

### What becomes harder:
- Adding "cool" AI features without clear value proposition
- Shipping AI without measurable KPIs
- Vendor-specific AI features
- Changing the AI strategy without deliberate governance process

---

## Alternatives Considered

### Alternative A: No freeze, evolve organically
- **Rejected.** Organic evolution leads to inconsistent AI behavior, conflicting principles, and strategic drift over time.

### Alternative B: Freeze only the philosophy, evolve the rest
- **Rejected.** Partial freeze creates ambiguity about which documents are binding.

### Alternative C: Freeze everything, require ADR for any change
- **Accepted.** This ensures stability while allowing deliberate evolution.

---

## References

- `docs/strategy/AI_NORTH_STAR.md`
- `docs/strategy/AI_GOVERNANCE.md`
- `docs/strategy/AI_CONSTITUTION.md`
- `docs/strategy/AI_PHILOSOPHY.md`
- `docs/strategy/AI_GUIDING_PRINCIPLES.md`
- `docs/strategy/AI_PRODUCT_PRINCIPLES.md`
- `docs/strategy/AI_DECISION_FRAMEWORK.md`
- `docs/strategy/AI_FEATURE_EVALUATION_MATRIX.md`
- `docs/strategy/AI_PERSONALITY.md`
- `docs/strategy/AI_SUCCESS_METRICS.md`
- `docs/strategy/AI_ROADMAP_ALIGNMENT.md`
- `docs/strategy/VISION_PHASE6.md`
- `docs/strategy/PHASE6_ROADMAP.md`
- `docs/strategy/AI_ARCHITECTURE.md`
- `docs/strategy/COMPETITIVE_ANALYSIS.md`

---

## Future Revisions

Any modification to the AI strategy documents requires a new ADR with:
- Context: why the change is needed
- Decision: what specifically changes
- Consequences: impact on existing AI features and governance
- Approval: per the authority table in AI_GOVERNANCE.md
