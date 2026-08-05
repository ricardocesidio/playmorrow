# Playmorrow AI — Product Principles

**Version:** 1.0
**Date:** 2026-08-05
**Status:** Active (Governance — all AI features must comply)

---

## Table of Contents

1. [Purpose](#purpose)
2. [Goal 1: Save Users Time](#goal-1-save-users-time)
3. [Goal 2: Improve Discovery](#goal-2-improve-discovery)
4. [Goal 3: Increase Revenue](#goal-3-increase-revenue)
5. [Goal 4: Increase Trust](#goal-4-increase-trust)
6. [Evaluation Checklist](#evaluation-checklist)
7. [Goal Conflict Resolution](#goal-conflict-resolution)
8. [Enforcement](#enforcement)

---

## Purpose

These 4 immutable product goals define the boundaries of what Playmorrow AI can and cannot do. Every AI feature proposal, sprint item, and shipped feature **MUST** satisfy at least one goal. A feature that serves none of these goals does not ship.

These goals are not aspirational. They are **gates**. They exist to prevent scope creep, feature bloat, and AI-for-AI's-sake decisions that erode the platform's identity.

---

## Goal 1: Save Users Time

### Definition

AI should reduce the time players spend searching for games and studios spend on marketing tasks. If a feature adds time to any workflow, it has failed this goal.

### Examples

| Example | Why It Works |
|---|---|
| Semantic search replacing 10-filter manual search | Query: "3D platformer with a grappling hook and melancholic soundtrack." Without AI, this requires genre filter + tag filter + manual scrolling. With AI, it's one query. |
| AI-generated devlog drafts saving 30 min/post | A studio types a bullet list of what happened this week. The AI expands it into a formatted, publishable devlog. Studio reviews, edits, publishes. |
| Review summarization for studios | Instead of reading 200 reviews, a studio gets a structured summary: "Players love the art style (78% mention it). Most complaints are about checkpoint spacing (62%)." |
| Moderation triage | AI flags high-confidence spam before a human sees it. Moderator time shifts from filtering noise to handling edge cases. |

### Counterexamples (Would Fail This Goal)

| Counterexample | Why It Fails |
|---|---|
| AI chat that takes 5 interactions to find a game when browsing would take 3 clicks | The AI made discovery slower, not faster. The non-AI baseline is better. |
| AI-generated store page descriptions that require more editing than writing from scratch | If the human effort unchanged or increased, the AI added no value. |
| "Smart" filter suggestions that add a click before the user can use the real filters | Friction added, not removed. |

### Success Metrics

| Metric | Baseline (before feature) | Target | Measurement |
|---|---|---|---|
| Time-to-discovery | Average session time to first wishlist/add | 30% reduction | Analytics event pipeline |
| Devlog publishing frequency | Average posts/studio/month | 20% increase | Database query |
| Support ticket resolution time | Average time-to-close | 40% reduction | Support system |
| Search-to-action time | Time from search query to click-through | 25% reduction | Analytics event pipeline |

### Business Value

Higher engagement (players find games faster → play more → return more often). Lower churn (players don't leave frustrated). Reduced support burden (fewer "how do I find..." tickets).

### User Value

Less frustration navigating the platform. More time spent playing games rather than finding them. Studios spend more time making games, less time writing marketing copy.

### Engineering Requirement

Every time-saving feature must include a **time-savings benchmark** comparing the AI path against the non-AI baseline path before launch. The benchmark must run against real user sessions (anonymized). If the AI path is not measurably faster, the feature does not ship.

---

## Goal 2: Improve Discovery

### Definition

AI should surface games that players would never have found otherwise. A recommendation that shows a player what they already know about is a failure of discovery.

### Examples

| Example | Why It Works |
|---|---|
| "Games like this" beyond tag matching | Steam's "More Like This" relies on user-defined tags. AI analysis of game descriptions, reviews, and mechanics can find structural similarities that tags miss — e.g., "You liked Hollow Knight because of the exploration-loop pacing, not because it's 'Metroidvania.' Here's a roguelike with the same pacing." |
| Emotion-based search | "Show me games that feel like Journey" — the AI understands mood, tone, and emotional arc, not just genre. |
| Cross-genre recommendations | A player who only plays RPGs gets a recommendation for a narrative walking simulator with RPG-like character development. The AI crossed genres based on structural similarity, not surface tags. |
| "Hidden gems" feed | AI identifies games with high review quality but low visibility (under 100 wishlists, 95%+ positive sentiment in reviews). These appear in a dedicated feed section. |

### Counterexamples (Would Fail This Goal)

| Counterexample | Why It Fails |
|---|---|
| AI that only recommends popular games | Players already see these on the homepage, in the leaderboard, and in social feeds. Adding AI on top of popularity is redundant. |
| AI that creates filter bubbles | Recommending only the same genre, the same art style, the same price tier. The player never discovers anything new. |
| AI that replaces human curation entirely | AI can surface candidates, but editorial curation (featured games, staff picks) surfaces games for reasons AI cannot — cultural relevance, community impact, developer story. |

### Success Metrics

| Metric | Baseline | Target | Measurement |
|---|---|---|---|
| Unique games discovered per session | Average distinct game detail page views per session | 20% increase | Analytics event pipeline |
| Serendipity score | Ratio of same-genre vs cross-genre recommendations | 40% cross-genre (minimum) | Recommendation log analysis |
| Zero-result search rate | Percentage of searches returning no results | 50% reduction | Search query logs |
| "New to me" rate | Percentage of recommendations the player has never seen | 70% minimum | Recommendation deduplication log |

### Business Value

More games get played → more studios succeed → more studios join the platform → platform catalog grows → virtuous cycle.

### User Value

Finding hidden gems that match personal taste but were invisible through conventional browsing. Discovering genres the player didn't know they'd enjoy. Moving beyond the "popularity trap" of most game platforms.

### Engineering Requirement

Discovery features must measure **newness** — the percentage of recommendations the player has never seen before. This requires a per-user recommendation deduplication store. Features that cannot demonstrate a "newness" lift over the non-AI baseline do not ship.

---

## Goal 3: Increase Revenue

### Definition

AI should help studios earn more money and help players make better purchasing decisions. Revenue features are about **value creation**, not extraction.

### Examples

| Example | Why It Works |
|---|---|
| Wishlist prediction (optimal launch timing) | The AI analyzes wishlist velocity patterns across similar games to predict: "Games in this genre with your wishlist curve typically convert at 12% if launched within 2 weeks of a Steam Next Fest appearance." The studio makes a data-informed decision, not a guess. |
| Store page optimization | The AI reviews the game's store page (description, tags, screenshots, trailer thumbnail) and suggests improvements based on what correlates with higher conversion in the same genre. |
| Bundle suggestions | "Players who wishlisted your game also wishlisted these 3. A bundle at $18 would target 2,400 potential buyers." Bundles are mutual-benefit — each game drives sales for the others. |
| Pricing intelligence | The AI surfaces: "Games in your genre with similar review scores typically launch at $14.99. Your current listing is $19.99 — that's the 85th percentile for your category." Informational, not prescriptive. |

### Counterexamples (Would Fail This Goal)

| Counterexample | Why It Fails |
|---|---|
| AI that pushes purchases without value | "Buy now!" buttons injected by AI without context. If the AI creates urgency that doesn't exist, it's deceptive. |
| AI that inflates game quality perception | Generating overly positive blurbs or hiding negative review signals. This erodes trust and violates Goal 4. |
| AI that creates fake urgency | "Only 2 keys left!" or "Sale ends in 5 minutes!" when neither is true. This is dark-pattern territory — explicitly banned. |
| AI pricing suggestions that are always "higher" | If the AI only suggests raising prices (because it optimizes for GMV), it's optimizing for the platform, not the player or studio. |

### Success Metrics

| Metric | Baseline | Target | Measurement |
|---|---|---|---|
| Marketplace GMV | Monthly gross merchandise volume | 15% growth quarter-over-quarter | Stripe dashboard |
| Wishlist-to-purchase conversion | Percentage of wishlisted items eventually purchased | 25% improvement | Analytics pipeline |
| Studio revenue growth | Average revenue/studio/month | 10% growth | Database query |
| Player purchase satisfaction | Post-purchase satisfaction survey (1-5) | Average ≥ 4.0 | In-app survey |
| Refund rate | Percentage of purchases refunded | Below 3% | Stripe dashboard |

### Business Value

Higher GMV → platform commission → financial sustainability. A platform that doesn't make money is a platform that shuts down. Revenue features are a survival function.

### User Value

Better purchase decisions (buying games the player will actually enjoy). Fair pricing (studios get paid what their work is worth; players pay what the game is worth). Discovering paid content that's genuinely valuable rather than regret-purchasing.

### Engineering Requirement

Revenue features must track **player satisfaction alongside revenue**. The dual metric is mandatory — if revenue increases by 10% but satisfaction drops by 5%, the feature is considered broken and must be rolled back or redesigned. Revenue at the expense of trust is not sustainable revenue.

---

## Goal 4: Increase Trust

### Definition

AI should make the platform more trustworthy — for players, studios, moderators, and the community. Trust is the foundation on which every other goal rests.

### Examples

| Example | Why It Works |
|---|---|
| AI moderation catching spam before it's seen | Spam comments, fake reviews, and bot accounts are flagged and removed before a human user ever encounters them. The community feels cleaner and safer without knowing why. |
| Review quality scoring | AI evaluates reviews for substance (length, specificity, balanced critique) and surfaces high-quality reviews above low-effort ones. "10/10 GOTY" is deprioritized. "The combat system is satisfying but the checkpoint spacing in act 3 is frustrating" is promoted. |
| Transparent recommendations | Every AI recommendation has a "Why this?" expandable section: "Recommended because you wishlisted [Game A] and reacted positively to [Devlog B] by the same studio." The player understands why they're seeing this — no black box. |
| Content authenticity detection | AI flags suspicious patterns: a game with 50 reviews all from accounts created on the same day, all with identical wording patterns. Flagged for human review, not auto-removed. |

### Counterexamples (Would Fail This Goal)

| Counterexample | Why It Fails |
|---|---|
| AI that moderates aggressively and silences legitimate criticism | A negative but honest review is flagged as "toxic" because the AI overfits on sentiment polarity. The studio's bad game gets a pass; the player's voice is erased. Both sides lose trust. |
| AI that can't explain its decisions | "This comment was removed" with no explanation. The user assumes bias or error. Trust erodes. |
| AI that manufactures social proof | Fake "X players are viewing this" counts. Fake "Trending" badges. AI-generated reviews posing as real players. All are trust-destroying. |
| AI that's inconsistent | The same behavior flagged as spam on Monday and allowed on Tuesday. Users learn they can't rely on the platform to be fair. |

### Success Metrics

| Metric | Baseline | Target | Measurement |
|---|---|---|---|
| Moderation accuracy | Percentage of moderation actions upheld on human review | ≥ 95% | Moderation review log |
| False positive rate | Percentage of legitimate content incorrectly flagged | < 2% | Human appeal log |
| User reports per week | Number of community-submitted reports | 30% decrease (AI catches it first) | Report database |
| Recommendation acceptance rate | Percentage of AI recommendations that result in a click-through | ≥ 15% | Analytics pipeline |
| "Why this?" interaction rate | Percentage of recommendations where the user expands the explanation | ≥ 10% | Analytics pipeline |

### Business Value

Trust → retention → word-of-mouth growth. Players tell friends about a platform they trust. Players leave a platform they don't.

### User Value

A safer community where spam, harassment, and manipulation are rare. Confidence that recommendations are genuine, not paid placements. Knowing that when the platform takes an action, there's a reason and a human appeal path if it's wrong.

### Engineering Requirement

All trust features must have:
1. **Human appeal paths** — every AI moderation action can be appealed to a human reviewer.
2. **Transparent logging** — every AI decision is logged with the input, model, confidence score, and rationale. These logs are auditable.
3. **Bias monitoring** — moderation actions are tracked by game genre, studio size, and content language to detect patterns of disparate impact.

---

## Evaluation Checklist

Every AI feature proposal must answer these 4 questions before entering the development pipeline:

### 1. Which goal(s) does it serve?

List the specific goals (Save Time / Improve Discovery / Increase Revenue / Increase Trust). A feature that serves none is rejected. A feature that serves multiple is stronger — but must not claim a goal it doesn't actually serve.

### 2. What's the non-AI baseline?

Describe how this problem is solved today without AI. If the answer is "it isn't solved," explain why it needs solving. If the answer is "it's already solved," explain why AI is better — with evidence, not assumption.

### 3. How will we measure improvement?

Identify the specific metric(s) from the goal's success metrics table. State the current baseline value and the target value. If the metric cannot be measured, the feature cannot be evaluated, and should not ship.

### 4. What could go wrong?

Honest failure-mode analysis. Privacy violations? Bias amplification? Hallucinated information presented as fact? User confusion? Revenue without satisfaction? If the answer is "nothing," the analysis is incomplete. Every feature has failure modes. Document them.

---

## Goal Conflict Resolution

Goals can and will conflict. When they do, the following resolution order applies:

### Resolution Hierarchy

1. **Trust over Revenue** — A feature that increases revenue at the expense of trust (Goal 4) is rejected. Revenue built on eroded trust is temporary; trust destroyed is hard to rebuild.
2. **Discovery over Time-Saving** — A feature that saves time by showing fewer, less diverse results saves time but fails discovery. Time-saving within a filter bubble is not a win.
3. **User Value over Business Value** — When the user's interest and the business interest conflict, the user wins. A satisfied user generates more long-term business value than an extracted one.

### Conflict Example

| Conflict | Resolution |
|---|---|
| AI pricing suggestions that always recommend higher prices (Revenue ↑, Trust ↓) | Rejected. Violates Trust-over-Revenue. |
| AI that shows only top-10 most popular games (Time-Saving ↑, Discovery ↓) | Rejected. Violates Discovery-over-Time-Saving. |
| AI that auto-bundles games for higher cart value without player consent (Revenue ↑, Trust ↓) | Rejected. Violates Trust-over-Revenue. |
| AI moderation that blocks all negative reviews (Trust-Studio ↑, Trust-Player ↓) | Rejected. Must balance both sides of trust equally. |

---

## Enforcement

### Before Implementation

Every feature spec must include a completed Evaluation Checklist. The checklist is reviewed during sprint planning. Features without a completed checklist are not estimated or scheduled.

### During Development

The time-savings benchmark (Goal 1), newness measurement (Goal 2), dual revenue-satisfaction tracking (Goal 3), and human-appeal-path verification (Goal 4) must be implemented before code review.

### After Launch

Feature metrics are reviewed at the 30-day and 90-day mark. Features that fail to meet their target metrics are flagged for redesign or removal. Features that actively harm a goal (e.g., revenue up but satisfaction down) are rolled back.

### Governance Body

The product lead (currently the project owner) has final authority on goal interpretation and conflict resolution. For features where two goals conflict and the team is split, the product lead decides — informed by the resolution hierarchy above.
