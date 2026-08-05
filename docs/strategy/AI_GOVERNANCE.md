# AI Governance

**Status:** Active — permanent governance framework
**Last updated:** 2026-08-05
**Authority:** Any modification requires an ADR with CEO + CTO approval

---

## Mission Permanence

The AI mission defined in `AI_PHILOSOPHY.md` may not be altered without a new Architecture Decision Record approved by both the CEO and CTO.

The mission: *"Playmorrow AI exists to connect every player with the games they'll love, and to empower every indie studio with the insights they need to be discovered."*

---

## Immutable Principles

The 15 principles defined in `AI_GUIDING_PRINCIPLES.md` are permanent. They may be added to but never removed. Examples of immutable principles:

- AI assists, never replaces
- AI always explains recommendations
- AI respects player autonomy
- AI respects studio ownership
- AI never manipulates purchasing decisions
- AI is provider-agnostic by default
- AI preserves privacy by default

---

## Document Ownership

| Document | Owner | Modification Authority |
|----------|-------|----------------------|
| `AI_NORTH_STAR.md` | CEO | CEO + CTO approval, ADR required |
| `AI_PHILOSOPHY.md` | CTO | ADR required |
| `AI_GUIDING_PRINCIPLES.md` | CTO | Additions only, ADR required for removals |
| `AI_PRODUCT_PRINCIPLES.md` | CPO | Product review, ADR required |
| `AI_DECISION_FRAMEWORK.md` | Engineering Lead | Engineering review |
| `AI_FEATURE_EVALUATION_MATRIX.md` | Engineering Lead | Engineering review |
| `AI_PERSONALITY.md` | Design Lead | Design review |
| `AI_SUCCESS_METRICS.md` | Data Lead | Quarterly review |
| `AI_CONSTITUTION.md` | CTO | ADR required for any change |

---

## Decision Authority

| Decision Type | Who Decides | Documentation Required |
|--------------|-------------|----------------------|
| New AI feature proposal | Product Manager | Decision Framework checklist |
| AI feature approval | CPO + CTO | Feature Evaluation Matrix score ≥ 12 |
| Provider change | Engineering Lead | ADR + migration plan |
| Model change | Engineering Lead | Test results + cost analysis |
| Prompt change | AI Engineer | Prompt version increment + test |
| Ethics concern | AI Ethics Advisor | Escalation to CTO |
| Architecture change | CTO | ADR required |
| Strategy change | CEO + CTO | ADR required |

---

## Review Cadence

| Review | Frequency | Participants |
|--------|-----------|-------------|
| AI feature audit | Quarterly | CPO, CTO, Engineering Lead |
| AI cost review | Monthly | Engineering Lead, Finance |
| AI ethics review | Bi-annual | AI Ethics Advisor, CTO |
| AI strategy review | Annual | CEO, CTO, CPO |
| AI metrics review | Weekly | Data Lead, AI Engineers |
| Provider health check | Monthly | Engineering Lead |
| Hallucination audit | Monthly | AI Engineers |

---

## Architecture Decision Records (ADR)

Every significant AI architecture decision must be documented as an ADR in `docs/adr/`. Required fields:

- **Status:** Proposed / Accepted / Deprecated / Superseded
- **Context:** Why this decision is needed
- **Decision:** What was decided
- **Consequences:** What becomes easier and harder
- **Alternatives:** What was considered and rejected
- **References:** Relevant documents (North Star, Principles, etc.)

---

## Versioning

All AI strategy documents follow semantic versioning:

- **MAJOR:** Change to a principle, mission, or North Star (requires ADR + CEO/CTO)
- **MINOR:** New section, expanded guidance (requires team approval)
- **PATCH:** Clarifications, examples, formatting (requires author approval)

---

## Deprecation Policy

When an AI feature is removed:
1. Announce 30 days before removal
2. Provide alternative or explain why it's gone
3. Archive feature code (don't delete)
4. Document lessons learned
5. ADR explaining the deprecation

---

## Provider Neutrality

No AI feature may depend on a specific provider. This is enforced by:

1. Architecture: `AIProvider` interface + `ProviderFactory` pattern
2. Testing: All tests use mocked providers, never real API calls
3. CI: Tests must pass with at least 2 mock providers
4. Migration: Provider changes require an ADR with migration plan
5. Cost: Provider costs tracked separately per provider

---

## Privacy Governance

AI must remain privacy-first:

1. AI uses on-platform data only — no third-party tracking
2. Personalized recommendations require opt-in consent
3. Players can view and delete their AI interaction history
4. Studios own their AI-generated insights
5. No PII in AI training data or embeddings
6. GDPR: `deleteUserMemory(userId)` must be maintained
7. Annual privacy audit of AI data usage

---

## Explainability Requirements

Every AI feature must meet explainability standards:

1. Recommendations must include a "because you..." explanation
2. Moderation flags must cite the specific policy violation
3. Studio insights must show confidence intervals
4. Search results must indicate whether AI re-ranked them
5. When AI is uncertain, it must say so explicitly

---

## Ethics Requirements

1. No dark patterns (fake urgency, hidden costs, deceptive UI)
2. No AI-generated content that impersonates real people
3. No AI-driven purchase manipulation
4. No bias amplification (monitor recommendation diversity)
5. No exploitation of vulnerable users
6. Human appeal path for every AI decision
7. Quarterly ethics review by independent advisor

---

## Transparency Requirements

1. Users must know when they're interacting with AI
2. AI-generated content must be labeled
3. AI model versions must be published in a changelog
4. AI uptime and performance stats must be public
5. Privacy policy must explain AI data usage

---

## Measurement Requirements

Every AI feature must have:

1. Pre-launch baseline measurement
2. Success KPI with numeric target
3. Weekly metric tracking
4. Monthly cost analysis
5. Quarterly value assessment
6. Kill switch if metrics regress for 4+ weeks

---

**This document governs all AI decisions at Playmorrow. Violations must be escalated to the CTO.**
