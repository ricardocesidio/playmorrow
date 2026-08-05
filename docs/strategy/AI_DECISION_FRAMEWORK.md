# Playmorrow AI — Decision Framework

**Version:** 1.0
**Date:** 2026-08-05
**Status:** Active (Mandatory — all AI features must pass before implementation)

---

## Table of Contents

1. [Purpose](#purpose)
2. [Section 1: Problem Validation](#section-1-problem-validation)
3. [Section 2: Value Assessment](#section-2-value-assessment)
4. [Section 3: Risk Assessment](#section-3-risk-assessment)
5. [Section 4: Architecture Compatibility](#section-4-architecture-compatibility)
6. [Section 5: Final Gate](#section-5-final-gate)
7. [Scoring & Thresholds](#scoring--thresholds)
8. [Example: Completed Framework (M23 Recommendation Engine)](#example-completed-framework-m23-recommendation-engine)

---

## Purpose

This framework is a **mandatory decision checklist** that every AI feature proposal must complete before entering the development pipeline. It is not a suggestion, not a guideline, not a "nice to have." It is a gate. Features that do not pass this framework are not built.

The framework has 5 sections spanning 24 checklist items. Each item requires a written answer — not a checkbox. Blank answers, "N/A" without justification, and answers that show no evidence of thought are treated as failures.

---

## Section 1: Problem Validation

**Purpose:** Confirm that we are solving a real problem for real people, and that AI is the right tool.

| # | Question | Guidance |
|---|---|---|
| 1.1 | What specific problem does this solve? | Be concrete. "Search is slow" is not specific. "Manual tag filtering requires 4-8 clicks and 45 seconds to narrow results, and 22% of searches are abandoned mid-filter" is specific. |
| 1.2 | Who benefits? (Player / Studio / Moderator / Publisher / Marketplace) | Multiple beneficiaries is fine. No beneficiary is not. |
| 1.3 | What happens if we DON'T build this? | If the answer is "nothing," the feature has no justification. If the answer is "current manual process continues," quantify the cost of that process. |
| 1.4 | Is there a non-AI way to solve this? | If yes, and the non-AI way is simpler/cheaper/faster, why is AI the right choice? Document the trade-off explicitly. |

### Section 1 Pass Criteria

All 4 items must have substantive answers. Items 1.1 and 1.2 are non-negotiable — if you cannot name the problem and the beneficiary, the proposal is rejected.

---

## Section 2: Value Assessment

**Purpose:** Map the feature to the 4 product goals and quantify expected impact.

### Goal Alignment

| # | Question | Answer Format |
|---|---|---|
| 2.1 | Which of the 4 product goals does this serve? | List: Save Time / Improve Discovery / Increase Revenue / Increase Trust. At least one required. |
| 2.2 | How much time does it save? (quantify) | Estimate in seconds/minutes per user action. State the baseline (current time cost) and the target (expected time cost with AI). |
| 2.3 | How does it improve discovery? (quantify) | Expected increase in unique games seen per session, or expected decrease in zero-result searches. State baseline and target. |
| 2.4 | How does it increase revenue? (quantify) | Expected GMV impact, conversion lift, or studio revenue growth. State baseline and target. |
| 2.5 | How does it increase trust? (quantify) | Expected moderation accuracy improvement, false positive reduction, or user report reduction. State baseline and target. |

### Measurability

| # | Question |
|---|---|
| 2.6 | Can the improvement be measured? (Yes / No) |
| 2.7 | Which specific KPI improves? |

### Measurability Guidance

- If 2.6 is "No," the proposal is rejected. A feature whose impact cannot be measured cannot be evaluated and should not ship.
- 2.7 must name a specific metric from the [AI Product Principles](./AI_PRODUCT_PRINCIPLES.md) success metrics tables, with both a current baseline value and a target value after launch.
- Example (good): "Time-to-discovery: current baseline 47 seconds (median), target 33 seconds (30% reduction)."
- Example (bad): "User satisfaction will improve." (Not specific, not measurable.)

### Section 2 Pass Criteria

At least one goal (2.1) must be selected. 2.6 must be "Yes." 2.7 must include a specific metric with baseline and target. Items 2.2-2.5 only need answers for goals the feature actually serves — a discovery-only feature doesn't need a revenue answer, but must say "N/A (feature does not target this goal)."

---

## Section 3: Risk Assessment

**Purpose:** Surface every way this feature could fail, harm users, or cost more than expected.

### Risk Categories

| # | Risk | Level | Explanation |
|---|---|---|---|
| 3.1 | Privacy risks | Low / Medium / High | What user data does the AI process? Is it stored? Is it sent to a third-party provider? Are PII, emails, or passwords ever in the AI context window? |
| 3.2 | Security risks | Low / Medium / High | Could the AI be prompt-injected? Could a user extract system prompts? Could the AI generate outputs that enable attacks (e.g., SQL injection in generated text)? |
| 3.3 | Hallucination risks | Low / Medium / High | Is the AI generating factual claims (game release dates, pricing, studio info) or purely creative content? If factual, what happens when it hallucinates — is the error visible to users? |
| 3.4 | Bias risks | Low / Medium / High | Could the AI favor certain game genres, studio sizes, languages, or regions? Could recommendation feedback loops amplify existing popularity biases? |
| 3.5 | Abuse risks | Low / Medium / High | Could a malicious user exploit the AI? Could a studio game the recommendation system? Could prompt injection generate harmful content that appears platform-endorsed? |
| 3.6 | Operational cost | $X/month estimate | Total estimated cost including: API calls to AI provider, additional database storage, additional compute (if self-hosted models), additional bandwidth. |
| 3.7 | Maintenance complexity | Low / Medium / High | How often will prompts need tuning? How often will the AI provider change their API? Will the feature break if the provider changes their model? How many lines of code are involved? |
| 3.8 | Provider lock-in risk | Low / Medium / High | Is the feature tightly coupled to one provider's API? Could it work with an alternative provider without a rewrite? Does it use provider-specific features (e.g., OpenAI function calling vs generic tool use)? |

### Risk Level Definitions

| Level | Definition |
|---|---|
| Low | Mitigation is simple and built into the architecture. Residual risk is negligible. |
| Medium | Mitigation requires deliberate engineering. Residual risk exists but is acceptable with controls. |
| High | Significant risk that could cause user harm, platform liability, or irreversible trust damage. Requires explicit mitigation plan before proceeding. |

### Section 3 Pass Criteria

Every risk (3.1-3.8) must be assessed — no "N/A" without justification. Features with:
- **2+ High risks** → Rejected or redesigned.
- **1 High risk** → Requires a written risk mitigation plan signed off by product lead before proceeding.
- Any Medium risk without a documented mitigation → Treated as High.

"High" risks are not automatic rejections — they are signals that the feature needs more work before it's ready.

---

## Section 4: Architecture Compatibility

**Purpose:** Ensure the feature integrates with the existing AI foundation and respects user autonomy.

### Compatibility Checks

| # | Question | Required Answer |
|---|---|---|
| 4.1 | Does this work with multiple AI providers? (Yes / No) | Must be "Yes" for features that call an LLM directly. Must use the `AIProvider` interface from the AI foundation layer, not a provider-specific SDK. If "No," document which provider it depends on and the migration plan if that provider becomes unavailable. |
| 4.2 | Can this feature explain its reasoning? (Yes / No) | Must be "Yes" for any feature that makes decisions affecting users (recommendations, moderation, content generation). If "No," document why — some features (e.g., spam detection) may legitimately not need user-facing explanations. |
| 4.3 | Can the user disable this AI feature? (Yes / No) | Must be "Yes" for user-facing features. If "No," document why — some features (e.g., server-side spam detection) are platform infrastructure that users don't interact with directly. |
| 4.4 | Can a human override the AI? (Yes / No) | Must be "Yes" for any feature that takes actions (moderation, content publishing, pricing). If "No," document why and what the appeal/escalation path is. |
| 4.5 | Does this fail safely? (Yes / No) | Must be "Yes." Describe the graceful degradation path: what happens if the AI provider is down? If the model returns an error? If the response times out? The feature must not break the user experience when AI is unavailable. |

### Graceful Degradation Patterns

| Pattern | When to Use |
|---|---|
| **Fallback to non-AI path** | AI-powered search → falls back to keyword search if AI is down. AI recommendations → falls back to tag-based "More Like This." |
| **Silent skip** | AI moderation → if the moderation model is down, content is published and flagged for later review (no blocking of legitimate content). |
| **Queued retry** | AI-generated devlog drafts → if AI is down, the draft request is queued and the user is notified when it's ready. |
| **Disable badge** | AI feature toggle in user settings → "AI features temporarily unavailable" badge with no broken UI. |

### Section 4 Pass Criteria

4.1 must be "Yes" for any LLM-calling feature. 4.5 must be "Yes" — no exceptions. If 4.2, 4.3, or 4.4 are "No," written justification is required.

---

## Section 5: Final Gate

**Purpose:** The gut-check. After all analysis, does this feature deserve to exist?

| # | Question | Guidance |
|---|---|---|
| 5.1 | Should this feature exist at all? | Not "can we build it?" — "should we?" AI is powerful enough to build things that shouldn't exist. Does this feature make the platform better or just more complex? |
| 5.2 | Would removing this feature be noticed within a week? | If no one would notice it's gone, it added no value. "Would be noticed" doesn't mean "someone would complain" — it means "a measurable KPI would drop." |
| 5.3 | Is this the simplest version that delivers value? | What can be cut and still deliver 80% of the value? Ship the simplest version first; iterate only if metrics demand it. |
| 5.4 | Has a non-AI prototype been tested first? | Before building an AI-powered recommendation engine, did we test a rule-based version? Before AI devlog drafts, did we test a template-based version? If "No," build the non-AI prototype first. It establishes the baseline and often reveals that AI is unnecessary. |

### Section 5 Pass Criteria

5.1 must be "Yes." 5.2 should be "Yes" — if "No," the feature is likely low-value. 5.3 should be "Yes" — if not, scope is too large. 5.4 is strongly recommended but not required for features where a non-AI prototype is genuinely infeasible (explanation required).

---

## Scoring & Thresholds

### How to Score

Each item in Sections 1-4 is evaluated as Pass or Fail based on the criteria in each section. Section 5 items are subjective but inform the final decision.

### Passing Thresholds

| Criterion | Threshold |
|---|---|
| Section 1 (Problem Validation) | 4/4 items must have substantive answers. |
| Section 2 (Value Assessment) | At least 1 goal selected. Measurability confirmed. Specific KPI with baseline/target. |
| Section 3 (Risk Assessment) | All 8 risks assessed. 0-1 High risks (with mitigation plan if 1). |
| Section 4 (Architecture Compatibility) | 4.1 and 4.5 must be "Yes." Others require written justification if "No." |
| Section 5 (Final Gate) | 5.1 must be "Yes." 5.2 and 5.3 should be "Yes." |

### Escalation Path

- **Proposal passes all sections** → Approved for roadmap. Proceed to [AI Feature Evaluation Matrix](./AI_FEATURE_EVALUATION_MATRIX.md) for priority scoring.
- **Proposal fails 1 section** → Returned to proposer with specific feedback. Resubmit after revision.
- **Proposal fails 2+ sections** → Rejected. May be resubmitted with substantial redesign — not just better answers, but a fundamentally different approach.
- **High-risk feature (3.1-3.8) with no mitigation plan** → On hold until mitigation is designed and approved.

---

## Example: Completed Framework (M23 Recommendation Engine)

### Section 1: Problem Validation

| # | Answer |
|---|---|
| 1.1 | Players currently discover games through homepage leaderboard (popularity-biased), manual tag filtering (slow, 4-8 clicks), or social feed (limited to followed studios). None of these surfaces games the player would like but doesn't know about. Analysis of 10,000 sessions shows the average player views only 3.2 unique games per session, and 78% of catalog games receive zero views per week. |
| 1.2 | Players (primary — find games they'll love), Studios (secondary — get discovered by the right audience), Platform (tertiary — increased engagement). |
| 1.3 | The catalog continues to be dominated by the top 5% of games. Studios with small marketing budgets remain invisible. Players continue to see the same games repeatedly. Platform growth stalls because only a narrow slice of the catalog generates value. |
| 1.4 | A tag-based "More Like This" section exists (non-AI). It works for surface-level similarities (same genre, same tags) but cannot find structural similarities across genres (e.g., recommending a narrative walking simulator to an RPG player based on character development depth). AI is the right choice because the problem is semantic understanding, not keyword matching. |

### Section 2: Value Assessment

| # | Answer |
|---|---|
| 2.1 | Improve Discovery (primary), Save Users Time (secondary — faster than manual filtering). |
| 2.2 | Estimated 15-second reduction per discovery action vs manual tag filtering. Baseline: 47 seconds (median) to find a game via manual filtering. Target: 32 seconds via AI recommendation click. |
| 2.3 | Baseline: 3.2 unique games viewed per session. Target: 5.0 unique games viewed per session (56% increase). |
| 2.4 | N/A (feature does not directly target revenue; revenue impact is downstream from improved discovery). |
| 2.5 | Recommendation explanation improves trust in "why am I seeing this?" Baseline: 0% transparency (no explanations on current recommendations). Target: 15% of recommendations have their explanation expanded by the user. |
| 2.6 | Yes. |
| 2.7 | Unique games discovered per session (baseline 3.2, target 5.0). Serendipity score — ratio of cross-genre to same-genre recommendations (baseline 0%, target 40%). |

### Section 3: Risk Assessment

| # | Level | Explanation |
|---|---|---|
| 3.1 | Medium | AI processes wishlist data, reaction history, and followed studios to build preference profiles. This data is not sent to the AI provider raw — it is abstracted into preference vectors. No PII in the AI context window. |
| 3.2 | Low | Read-only feature (generates recommendations, doesn't take actions). Prompt injection risk is limited to recommendation manipulation (e.g., a game with a description designed to be recommended to everyone). Mitigated by input sanitization and recommendation diversity requirements. |
| 3.3 | Medium | AI describes why it recommended a game. If it hallucinates game features ("Recommended because you like crafting games" — but the game has no crafting), the user sees wrong information. Mitigation: explanations are generated from structured game data, not AI free-text. AI selects from a catalog of verified attributes; it doesn't describe the game from scratch. |
| 3.4 | High | Feedback loops: if the AI recommends popular games more often (because they have more interaction data), those games become more popular, reinforcing the bias. Mitigation: recommendation diversity requirements (40% cross-genre minimum), cold-start bonuses for new games, explicit popularity-decay factor. |
| 3.5 | Medium | Studios could attempt to game recommendations by keyword-stuffing descriptions, manipulating tags, or generating fake engagement. Mitigation: recommendation signals are weighted — structured game data > description text > engagement metrics. Review bombing and fake engagement detection (from Goal 4) feed into recommendation quality. |
| 3.6 | $200-400/month (estimated). Depends on recommendation volume and embedding storage. Embedding generation: ~$0.0001 per game embedding. Recommendation queries: ~$0.002 per query. At 10,000 queries/day: ~$600/month. At 3,000 queries/day: ~$180/month. |
| 3.7 | Medium. Recommendation models need periodic retraining as the catalog grows. Embedding model changes may require re-embedding the entire catalog. Prompt tuning for explanation generation will be iterative. Estimated: 1-2 days/month of maintenance. |
| 3.8 | Low. The AI foundation layer abstracts the embedding provider behind the `EmbeddingProvider` interface. Switching from OpenAI embeddings to a local model requires changing one configuration value, not rewriting the feature. |

Risk assessment: 1 High risk (3.4, bias). Requires written bias mitigation plan (above). Approved with mitigation plan.

### Section 4: Architecture Compatibility

| # | Answer |
|---|---|
| 4.1 | Yes. Uses `EmbeddingProvider` and `AIProvider` interfaces. Works with OpenAI, Anthropic, or a locally-hosted embedding model. |
| 4.2 | Yes. Each recommendation includes a "Why this?" explanation generated from structured game attributes, not free-text. |
| 4.3 | Yes. "AI-Powered Recommendations" is a toggle in user settings. Disabling it falls back to tag-based "More Like This." |
| 4.4 | Yes. Recommendations are suggestions, not actions. The user always decides what to click. No override needed. |
| 4.5 | Yes. If the AI provider is down, recommendations fall back to tag-based "More Like This" (graceful degradation). If the embedding index is corrupted, a background job rebuilds it while the fallback runs. No broken UI. |

### Section 5: Final Gate

| # | Answer |
|---|---|
| 5.1 | Yes. The core platform promise is discovery. Without intelligent recommendations, we are a directory, not a discovery engine. |
| 5.2 | Yes. 78% of catalog games receive zero views per week. A recommendation engine that surfaces these games would be immediately visible in the "unique games viewed" metric. |
| 5.3 | Yes. V1 ships with "Games Like This" on game detail pages and a "Recommended for You" section on the homepage. V2 adds personalized feed integration. V3 adds cross-genre exploration. |
| 5.4 | Yes. The current tag-based "More Like This" section on game detail pages is the non-AI prototype. Metrics: 3.2% click-through rate. AI version target: 8-12% click-through rate. |

### Outcome

**Passes all 5 sections.** Proceed to [AI Feature Evaluation Matrix](./AI_FEATURE_EVALUATION_MATRIX.md) for priority scoring. Scoring result: 13.6 → Approved.
