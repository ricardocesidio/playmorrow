# Playmorrow AI — Feature Evaluation Matrix

**Version:** 1.0
**Date:** 2026-08-05
**Status:** Active (Scoring framework — evaluates features that passed the Decision Framework)

---

## Table of Contents

1. [Purpose](#purpose)
2. [Scoring Dimensions](#scoring-dimensions)
3. [Scoring Formula](#scoring-formula)
4. [Approval Thresholds](#approval-thresholds)
5. [Phase 6 Milestone Evaluations](#phase-6-milestone-evaluations)
6. [How to Score a New Feature](#how-to-score-a-new-feature)
7. [Score Interpretation Guide](#score-interpretation-guide)
8. [Re-evaluation Triggers](#re-evaluation-triggers)

---

## Purpose

This matrix scores AI feature proposals on 10 dimensions to produce a single, comparable Priority Score. It is used for **features that have already passed the [AI Decision Framework](./AI_DECISION_FRAMEWORK.md)** — the matrix does not replace the framework; it ranks features that survived it.

The matrix serves three functions:

1. **Prioritization:** Compare features objectively. A score of 14.2 beats a score of 10.7. No debate.
2. **Redesign signal:** A feature scoring 8-11 is not rejected — it needs redesign to improve value or reduce cost before re-evaluation.
3. **Portfolio balance:** Track the distribution of scores across goals. If all approved features target Revenue and none target Trust, the portfolio is unbalanced.

---

## Scoring Dimensions

Each dimension is scored 1 (worst) to 5 (best).

### Dimension Reference Table

| Dimension | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **User Value** | Marginal improvement over current state | Minor quality-of-life improvement | Notable improvement for a specific user segment | Significant improvement across multiple segments | Game-changing — transforms how users interact with the platform |
| **Business Value** | No measurable revenue or growth impact | Indirect benefit (e.g., minor retention lift) | Modest revenue increase or cost reduction | Significant revenue driver or market differentiation | Core to business model — platform wouldn't function without it |
| **Engineering Complexity** | Major project (8+ weeks, 3+ engineers) | Large feature (5-8 weeks, 2-3 engineers) | Moderate (2-4 weeks, 1-2 engineers) | Small feature (1-2 weeks, 1 engineer) | Trivial (<1 week, 1 engineer part-time) |
| **Operational Cost** | $1,000+/month in AI provider fees + infrastructure | $500-1,000/month | $100-500/month | $10-100/month | <$10/month (mostly compute, negligible API costs) |
| **Privacy Impact** | Processes personal data, user content, or PII | Processes preference data tied to user accounts | Processes anonymized usage patterns | Processes aggregate statistics only | No user data processed (reads public data only) |
| **Security Impact** | Handles financial transactions or authentication | Creates/moderates user-facing content | Generates content displayed to users | Read-only analysis, no user-facing output | Fully internal, no user interaction |
| **Maintenance Cost** | Weekly tuning, frequent provider API changes, brittle prompts | Bi-weekly attention, quarterly model updates | Monthly monitoring, occasional prompt updates | Quarterly health checks, stable prompts | Set-and-forget — deterministic, no model dependency |
| **Scalability** | Designed for 100,000+ requests/day | Designed for 10,000-100,000 requests/day | Designed for 1,000-10,000 requests/day | Designed for 100-1,000 requests/day | <100 requests/day |
| **Explainability** | Black box — cannot explain any decision | Can explain some outputs, most are opaque | Partial explanation — covers major cases | Mostly transparent — minor edge cases unexplained | Fully transparent — every output explainable |
| **Differentiation** | Commodity — every platform has this | Common — most competitors have a version | Competitive parity — matches competitor offerings | Distinct advantage — meaningfully better than competitors | Unique — no competitor has anything like it |

### Detailed Dimension Definitions

#### User Value (UV)
How much does this feature improve the experience of the people using it? Score based on impact magnitude and breadth. A feature that transforms the experience for 10% of users may score higher than a marginal improvement for 100%.

#### Business Value (BV)
What measurable business outcome does this drive? Revenue, retention, acquisition, cost reduction. Score based on the size and certainty of the impact — a 5% revenue increase with high confidence beats a 20% estimate based on assumptions.

#### Engineering Complexity (C)
**Inverted scale.** Lower complexity = higher score. This ensures that simpler solutions are rewarded and over-engineered solutions are penalized. A feature scoring 1 (8+ weeks) is not bad — it's expensive, and the matrix reflects that.

| Score | Weeks | Engineers |
|---|---|---|
| 5 | <1 week | 1 part-time |
| 4 | 1-2 weeks | 1 engineer |
| 3 | 2-4 weeks | 1-2 engineers |
| 2 | 5-8 weeks | 2-3 engineers |
| 1 | 8+ weeks | 3+ engineers |

#### Operational Cost (OC)
Estimated monthly AI provider cost (API calls) + any additional infrastructure (vector storage, additional compute). Includes both fixed costs (embedding storage) and variable costs (per-query fees). Score uses the estimated steady-state cost 90 days post-launch, not the initial spike.

#### Privacy Impact (PI)
What user data flows through the AI system? Score is lower (worse) when the AI processes PII, user-generated content, or behavioral data that could identify individuals. Score is higher when the AI operates on public or aggregate data. This dimension does not affect the Priority Score formula directly but must be reviewed separately — a feature scoring 1 or 2 on Privacy Impact requires a Data Protection Impact Assessment.

#### Security Impact (SI)
What is the blast radius if the AI is compromised or produces harmful output? Lower score for features that handle money or authenticate users. Higher score for features that are internal or read-only. This dimension does not affect the Priority Score formula directly but features scoring 1 or 2 require a security review.

#### Maintenance Cost (MC)
How much ongoing human attention does this feature require? AI features that depend on provider-specific APIs, fragile prompt engineering, or rapidly-evolving models score lower. Features with stable, provider-abstracted implementations score higher.

#### Scalability (S)
What is the expected request volume in steady state? Score matches the feature's design target, not the launch-day volume. A feature designed for 100 req/day that gets 1,000 req/day will break — score it based on the design target.

#### Explainability (E)
Can the AI explain why it produced a specific output? Essential for trust features (Goal 4), important for discovery features (Goal 2), less critical for internal infrastructure. Score lower if the model is a black box with no explanation mechanism.

#### Differentiation (D)
Does this feature give Playmorrow a competitive advantage? Score based on what competitors offer today. A feature that matches Steam's recommendation quality scores 3 (competitive parity). A feature that does something Steam cannot do scores 5.

---

## Scoring Formula

```
Priority Score = (User Value × 2) + Business Value + Differentiation - Complexity - (Operational Cost / 10)
```

### Formula Rationale

| Component | Weight | Why |
|---|---|---|
| User Value × 2 | Double-weighted | Playmorrow exists for users. Features that don't deliver user value are not worth building, regardless of business impact. |
| Business Value | Single | Important but secondary to user value. |
| Differentiation | Single | Competitive advantage matters, but not more than user value. |
| Complexity | Subtracted | Complexity is a cost, not a benefit. Simpler solutions are rewarded. |
| Operational Cost / 10 | Subtracted (scaled) | Cost is divided by 10 to bring it into the same range as other dimensions (a $500/month feature subtracts 0.5, not 50). |

### What the Formula Does NOT Include

The following dimensions are **excluded from the formula** but must be scored and reviewed separately:

- **Privacy Impact** — Reviewed via Data Protection Impact Assessment when PI ≤ 2.
- **Security Impact** — Reviewed via security review when SI ≤ 2.
- **Maintenance Cost** — Informs staffing and sprint planning, not feature priority.
- **Scalability** — Informs infrastructure planning, not whether to build.
- **Explainability** — Informs UX design requirements, not whether to build.

These dimensions are excluded because they are **constraints** (go/no-go checks), not **value signals**. A feature with catastrophic privacy impact should be rejected regardless of its Priority Score.

---

## Approval Thresholds

| Priority Score | Verdict | Action |
|---|---|---|
| ≥ 12 | **Approved** | Added to roadmap. Schedule based on Priority Score rank + dependencies. |
| 8-11 | **Needs redesign** | Returned to proposer. Reduce complexity or increase value. Resubmit with revised design. |
| < 8 | **Rejected** | Not worth building in current form. May be revisited if technology or platform changes significantly reduce cost or complexity. |

### Tiebreakers

When two features have the same or very close Priority Scores (±0.5):

1. Trust features (Goal 4) beat other goals — trust is the foundation.
2. Discovery features (Goal 2) beat Time-Saving features (Goal 1) — discovery is the platform's core differentiator.
3. Lower operational cost beats higher — conserve resources.
4. Lower complexity beats higher — ship faster, learn faster.

---

## Phase 6 Milestone Evaluations

These are the evaluations for the Phase 6 milestones as defined in the [Phase 6 Roadmap](./PHASE6_ROADMAP.md). Scores are based on the current architecture and estimates as of 2026-08-05.

### M22 — AI Assistant (Chat + Devlog Drafts + Support)

| Dimension | Score | Justification |
|---|---|---|
| User Value (UV) | 4 | Studio-facing: AI devlog drafts save 30 min/post. Player-facing: AI chat for game discovery. Notable improvement for studios, moderate for players. |
| Business Value (BV) | 3 | Modest revenue increase from faster devlog publishing (more content → more engagement). Indirect retention benefit. |
| Engineering Complexity (C) | 3 | 2-4 weeks. Chat UI, context window management, prompt templates. Built on existing AI foundation layer. |
| Operational Cost (OC) | 4 | $100-300/month at expected volume. Devlog drafts are bursty (weekly), chat is low volume initially. |
| Privacy Impact (PI) | 4 | Processes query text but not PII. Chat history stored anonymized. |
| Security Impact (SI) | 3 | Generates user-facing content. Prompt injection risk. Mitigated by output sanitization. |
| Maintenance Cost (MC) | 3 | Monthly prompt tuning, quarterly model evaluation. Provider API may change. |
| Scalability (S) | 3 | Designed for 1,000-10,000 requests/day. |
| Explainability (E) | 4 | Chat responses can include explanations. Devlog drafts are user-reviewed before publishing. |
| Differentiation (D) | 4 | Distinct advantage — no indie game platform has an AI assistant integrated into the developer workflow. |

**Calculation:**
```
(4 × 2) + 3 + 4 - 3 - (4 / 10)
= 8 + 3 + 4 - 3 - 0.4
= 11.6 → Needs redesign
```

**Verdict:** 11.6 → **Needs redesign.** The score is borderline (0.4 below the 12.0 threshold). Two options:

1. **Reduce scope to pass:** Ship Devlog Drafts only (UV=4, C=4 → score 12.6, Approved). Defer AI Chat to a later milestone.
2. **Increase value to pass:** Add Support Ticket Auto-Triage to M22 (UV rises to 5, score 13.6, Approved).

Recommendation: Option 1 (Devlog Drafts first, Chat later). Devlog Drafts alone has clearer user value and lower risk.

### M23 — Recommendation Engine

| Dimension | Score | Justification |
|---|---|---|
| User Value (UV) | 5 | Game-changing. Transforms discovery from directory-browsing to intelligent matching. Players find games they'd never see otherwise. |
| Business Value (BV) | 4 | Significant revenue driver. Better discovery → more games played → more wishlists → more purchases. Direct impact on marketplace GMV. |
| Engineering Complexity (C) | 4 | 6-8 weeks. Embedding pipeline, vector store, recommendation endpoint, explanation generation. Complex but well-understood architecture. |
| Operational Cost (OC) | 3 | $200-600/month. Embedding generation ($0.0001/game) + recommendation queries ($0.002/query) + vector storage. |
| Privacy Impact (PI) | 3 | Processes anonymized preference vectors. No PII in AI context. Wishlist/follow data abstracted before embedding. |
| Security Impact (SI) | 4 | Read-only — generates recommendations, doesn't create or moderate content. |
| Maintenance Cost (MC) | 3 | Periodic model updates, embedding regeneration on catalog changes, prompt tuning for explanations. |
| Scalability (S) | 4 | Designed for 10,000+ recommendations/day. Vector index scales with catalog size. |
| Explainability (E) | 4 | "Why this?" explanations generated from structured game attributes, not free-text hallucination. |
| Differentiation (D) | 5 | Unique — no indie game platform has cross-genre structural recommendations. Steam's "More Like This" is tag-based. This is semantic. |

**Calculation:**
```
(5 × 2) + 4 + 5 - 4 - (3 / 10)
= 10 + 4 + 5 - 4 - 0.3
= 14.7 → Approved
```

**Verdict:** 14.7 → **Approved.** Highest Priority Score in the portfolio. This should be the flagship Phase 6 feature. Recommended as M22 (swap with AI Assistant).

### M24 — AI Moderation

| Dimension | Score | Justification |
|---|---|---|
| User Value (UV) | 3 | Notable improvement for community health. Users see less spam. Moderators spend less time on obvious violations. Indirect — most users won't notice the AI working. |
| Business Value (BV) | 2 | Minor revenue impact. Trust improvement drives retention (long-term) but no direct revenue. |
| Engineering Complexity (C) | 4 | 2-3 weeks. Integrate moderation API calls into existing moderation queue, add confidence thresholds, build human-review UI. Leverages existing moderation infrastructure. |
| Operational Cost (OC) | 3 | $100-300/month. Moderation API calls per piece of content. Low cost per call but high volume. |
| Privacy Impact (PI) | 2 | Processes user-generated content (comments, devlogs, reviews) which may contain personal information. Requires careful handling. |
| Security Impact (SI) | 2 | Takes action on user content (flagging, hiding). False positives can silence legitimate speech. High blast radius for errors. |
| Maintenance Cost (MC) | 4 | Quarterly threshold tuning. Occasional false-positive review. Stable once calibrated. |
| Scalability (S) | 4 | Designed for all content posted to the platform (10,000+ moderation checks/day). |
| Explainability (E) | 2 | Moderation decisions are partially explainable ("toxic content" score) but specific reasons may be opaque. Users can appeal to a human. |
| Differentiation (D) | 3 | Competitive parity. Most platforms have AI moderation. Playmorrow's advantage is the human appeal path, but that's a process feature, not an AI feature. |

**Calculation:**
```
(3 × 2) + 2 + 3 - 4 - (3 / 10)
= 6 + 2 + 3 - 4 - 0.3
= 6.7 → Rejected
```

**Verdict:** 6.7 → **Rejected.** The score indicates this feature, as currently scoped, is not worth the engineering investment. However, note:

- **Rejection is not permanent.** Moderation becomes more valuable as the platform grows. At 100,000 DAU, the cost of human-only moderation makes AI moderation a cost-savings feature (BV rises to 4, score becomes 8.7 → still borderline).
- **Redesign option:** Ship as a lightweight "spam probability indicator" in the existing moderation queue, not a full auto-moderation system. Scope reduction → C=5 → score becomes 7.7 → still rejected.
- **Alternative:** Build M23 first. The recommendation engine's bias detection feeds naturally into moderation. Combined, the two features share infrastructure and increase each other's value.

### M25 — Studio Intelligence

| Dimension | Score | Justification |
|---|---|---|
| User Value (UV) | 4 | Significant for studios. Store page optimization, wishlist prediction, launch timing intelligence. Transforms studio dashboard from data-display to decision-support. |
| Business Value (BV) | 4 | Significant revenue driver. Studios that earn more stay on the platform. Better store pages → higher conversion → higher GMV → more commission. |
| Engineering Complexity (C) | 3 | 4-6 weeks. Multiple features: store page analyzer, wishlist predictor, pricing intelligence. Moderate complexity — each feature is a data analysis pipeline, not a real-time system. |
| Operational Cost (OC) | 3 | $200-500/month. Analysis is batched (daily/weekly), not real-time. Lower query volume than recommendations. |
| Privacy Impact (PI) | 4 | Processes aggregate marketplace data, not individual user data. Store page analysis reads public game data. |
| Security Impact (SI) | 4 | Read-only analysis and suggestions. Does not take actions. Studio decides whether to act on recommendations. |
| Maintenance Cost (MC) | 3 | Monthly model updates as marketplace patterns change. Prompt tuning for suggestion quality. |
| Scalability (S) | 2 | Designed for the number of active studios (100-1,000), not per-user. Low request volume but each analysis is compute-intensive. |
| Explainability (E) | 4 | All suggestions include reasoning: "Games with screenshots showing UI/UX elements convert 22% better." Studio can evaluate the logic. |
| Differentiation (D) | 5 | Unique. No indie game platform provides AI-powered store page optimization or wishlist prediction. Steam provides raw data; Playmorrow provides interpretation. |

**Calculation:**
```
(4 × 2) + 4 + 5 - 3 - (3 / 10)
= 8 + 4 + 5 - 3 - 0.3
= 13.7 → Approved
```

**Verdict:** 13.7 → **Approved.** Second-highest Priority Score. Strong studio value proposition. Recommended as M23 (after Recommendation Engine).

### M26 — Semantic Search

| Dimension | Score | Justification |
|---|---|---|
| User Value (UV) | 5 | Game-changing. "3D platformer with a grappling hook and melancholic soundtrack" → instant results. Replaces 8-click manual filtering. Transforms the primary discovery interface. |
| Business Value (BV) | 3 | Indirect revenue. Better search → faster discovery → more games found → more wishlists. Hard to attribute directly. |
| Engineering Complexity (C) | 4 | 3-4 weeks. Embedding-based search index, query-to-embedding pipeline, hybrid keyword + semantic ranking. Well-understood technology. |
| Operational Cost (OC) | 3 | $200-500/month. Query embedding ($0.0001/query) + index storage. Higher volume than recommendations. |
| Privacy Impact (PI) | 4 | Processes search queries (anonymized after 30 days). No PII in queries. |
| Security Impact (SI) | 4 | Read-only — returns search results. No content generation. |
| Maintenance Cost (MC) | 4 | Quarterly index rebuilds. Stable once embedded. Occasional relevance tuning. |
| Scalability (S) | 4 | Designed for all search traffic (10,000+ queries/day). |
| Explainability (E) | 2 | Semantic similarity scores are inherently opaque. "Why did this game match?" is hard to explain in human terms. Mitigation: show matched attributes when available, disclose "AI-powered search" label. |
| Differentiation (D) | 4 | Distinct advantage. Steam's search is keyword-only. itch.io has tag filtering. Semantic search on an indie game platform is unique. |

**Calculation:**
```
(5 × 2) + 3 + 4 - 4 - (3 / 10)
= 10 + 3 + 4 - 4 - 0.3
= 12.7 → Approved
```

**Verdict:** 12.7 → **Approved.** Strong score. The low explainability (E=2) is a concern but acceptable because search results are inherently probabilistic, and the "AI-powered" label manages expectations.

---

## Summary: Phase 6 Milestones Ranked

| Rank | Milestone | Priority Score | Verdict |
|---|---|---|---|
| 1 | M23 — Recommendation Engine | 14.7 | Approved |
| 2 | M25 — Studio Intelligence | 13.7 | Approved |
| 3 | M26 — Semantic Search | 12.7 | Approved |
| 4 | M22 — AI Assistant (full scope) | 11.6 | Needs redesign |
| 4a | M22a — Devlog Drafts Only | 12.6 | Approved |
| 5 | M24 — AI Moderation | 6.7 | Rejected |

### Recommended Phase 6 Order

Based on Priority Scores, dependencies, and portfolio balance:

1. **M23 — Recommendation Engine** (Score: 14.7) — Highest value, core platform differentiator. Ship first.
2. **M25 — Studio Intelligence** (Score: 13.7) — Complements M23. Better discovery → more studio data → better intelligence.
3. **M26 — Semantic Search** (Score: 12.7) — Natural next step after recommendations. Uses the same embedding infrastructure.
4. **M22a — Devlog Drafts** (Score: 12.6) — Lower risk, quick win for studios. Ship as a lightweight milestone between larger features.
5. **M24 — AI Moderation** (Score: 6.7) — Rejected in current scope. Revisit when platform reaches 100,000 DAU or when moderation costs become significant.

---

## How to Score a New Feature

### Step 1: Feature has passed the Decision Framework

This matrix is only for features that have cleared the [AI Decision Framework](./AI_DECISION_FRAMEWORK.md). If the feature hasn't passed the framework, do not score it — send it back.

### Step 2: Score each dimension independently

For each dimension, write a one-sentence justification for the score. Do not adjust scores to achieve a desired result. The matrix produces the score — you don't target a score.

### Step 3: Calculate Priority Score

Use the formula:
```
Priority Score = (User Value × 2) + Business Value + Differentiation - Complexity - (Operational Cost / 10)
```

Round to one decimal place.

### Step 4: Check constraint dimensions

Review Privacy Impact, Security Impact, Maintenance Cost, Scalability, and Explainability. If any of these are 1 or 2:
- **PI ≤ 2:** Requires Data Protection Impact Assessment.
- **SI ≤ 2:** Requires security review.
- **E ≤ 2:** Document user-facing transparency plan.
- **MC ≤ 2:** Document staffing plan for ongoing maintenance.

### Step 5: Apply threshold

| Score | Action |
|---|---|
| ≥ 12 | Add to roadmap |
| 8-11 | Return for redesign |
| < 8 | Reject |

### Step 6: Compare to existing features

Place the new feature in the ranked list. If it outranks a currently scheduled feature, consider swapping — but only if dependencies allow.

---

## Score Interpretation Guide

### Scores ≥ 14: Exceptional

Extremely high-value features that are both impactful and achievable. These should be the platform's flagship capabilities. Expect only 1-2 features per phase to reach this tier.

### Scores 12-13.9: Strong

Solid features with clear value and manageable complexity. These should form the core of each phase's roadmap. Most approved features will fall in this range.

### Scores 10-11.9: Marginal

Features at the edge of viability. They pass the Decision Framework but the cost/value ratio is borderline. Consider:
- Can scope be reduced to improve the Complexity score?
- Can user value be demonstrated more clearly to improve the UV score?
- Is there a non-AI alternative that achieves 80% of the value at 20% of the cost?

### Scores 8-9.9: Weak

Features that barely justify AI. The Decision Framework confirmed the problem exists, but AI may not be the best solution. Before redesign:
- Build a non-AI prototype and measure impact.
- If the non-AI prototype shows strong results, the AI version may be unnecessary.
- If the non-AI prototype shows weak results, the problem may not be as significant as assumed.

### Scores < 8: Not Viable

Do not build. Do not redesign. Do not reconsider unless something fundamental changes:
- Technology becomes dramatically cheaper (e.g., open-source model matches GPT-4 quality at 10% of cost).
- Platform scale increases by 10x (e.g., moderation becomes a cost center).
- A competitor ships a similar feature and demonstrates clear value (validates the problem, even if our solution was wrong).

---

## Re-evaluation Triggers

Features that were rejected or deferred can be re-evaluated when:

1. **Technology changes** — A new model release halves operational costs. Rescore the OC dimension.
2. **Platform scale changes** — The platform grows from 10,000 to 100,000 users. Features that were over-engineered for small scale become appropriate. Rescore the Scalability dimension.
3. **Competitor ships something similar** — A competitor validates the feature's value. Rescore the Differentiation dimension (likely drops) but User Value (now validated) may rise.
4. **New infrastructure is built** — A feature that was complex because it required a new vector store becomes simpler when the vector store already exists (from an earlier milestone). Rescore the Complexity dimension.
5. **Every 6 months** — Scheduled re-evaluation of all rejected and deferred features. Technology and platform context change; scores that were accurate 6 months ago may not be accurate today.

### Re-evaluation Process

1. Pull the original scoring sheet.
2. Re-score each dimension based on current conditions.
3. If the new Priority Score crosses a threshold (e.g., from Rejected to Needs Redesign, or from Needs Redesign to Approved), flag for roadmap review.
4. Document what changed and why the score shifted.

---

## Appendix: Blank Scoring Template

```markdown
## Feature: [Name]

| Dimension | Score (1-5) | Justification |
|---|---|---|
| User Value (UV) | | |
| Business Value (BV) | | |
| Engineering Complexity (C) | | |
| Operational Cost (OC) | | |
| Privacy Impact (PI) | | |
| Security Impact (SI) | | |
| Maintenance Cost (MC) | | |
| Scalability (S) | | |
| Explainability (E) | | |
| Differentiation (D) | | |

### Calculation

(UV × 2) + BV + D - C - (OC / 10) = **SCORE**

### Constraint Review

- PI ≤ 2: [Yes/No] — [If Yes, DPIA required]
- SI ≤ 2: [Yes/No] — [If Yes, security review required]
- E ≤ 2: [Yes/No] — [If Yes, transparency plan required]

### Verdict

[Approved / Needs Redesign / Rejected]
```
