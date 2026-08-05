# AI Constitution

**Status:** Active — constitutional document of Playmorrow AI
**Last updated:** 2026-08-05
**Authority:** Any article modification requires an ADR + CEO + CTO approval

---

This document is the constitutional foundation of Playmorrow AI. All AI features, architectures, and strategies must comply with every article. No article may be removed; articles may only be added with an ADR.

---

## Article 1 — Value Over Novelty

AI at Playmorrow exists to create measurable value for players and studios. AI features are not deployed because they are "cool" or "innovative" — they must solve a real problem, with a measurable baseline and target. If removing an AI feature wouldn't be noticed within one week, it should not exist.

- **Engineering implication:** Every AI feature ships with a KPI dashboard.
- **Example:** Semantic search reduced zero-result searches by 50%. That's value. An AI chatbot answering "how are you feeling today?" is novelty.

---

## Article 2 — Never Manipulate Users

AI must never use dark patterns to influence behavior. No fake urgency ("Only 3 left!"), no hidden costs, no FOMO tactics, no deceptive recommendations. AI must inform purchase decisions but never manipulate them.

- **Engineering implication:** UI components using AI must be reviewed for manipulative patterns before deployment.
- **Example:** "Players who liked X also enjoyed Y" is information. "You're missing out — buy Y now before the sale ends" is manipulation.

---

## Article 3 — Always Explain Recommendations

Every AI recommendation must include a "because you..." explanation. Users must understand why something was recommended, flagged, or ranked. Black-box scores are not acceptable.

- **Engineering implication:** Every recommendation endpoint returns an `explanation` field.
- **Example:** "Because you follow studios like X and wishlisted Y, we think you'll enjoy Z."

---

## Article 4 — Respect Studio Ownership

Studios own their content and their data. AI may analyze public store pages and community content to improve recommendations, but it must never claim to represent a studio's voice. AI-generated content for studios (devlog drafts, store page suggestions) is always opt-in.

- **Engineering implication:** AI features for studios have opt-in toggles. AI never publishes content as a studio without human approval.
- **Example:** "Here's a draft devlog based on your recent updates" (opt-in, human-approved) vs "We published your weekly update" (never).

---

## Article 5 — Protect Privacy By Default

AI uses the minimum data necessary. Personalized features require opt-in consent. On-platform data only — no cross-site tracking, no data brokers, no shadow profiles. Players can view and delete their AI interaction history.

- **Engineering implication:** All AI data access goes through PrivacyService. GDPR deletion cascades through AI systems.
- **Example:** Content-based recommendations work without personal data. Personalized recommendations require "Enable personalization" toggle.

---

## Article 6 — Remain Provider-Agnostic

No AI feature may depend on a single provider. The `AIProvider` interface abstracts all provider-specific behavior. Provider changes require configuration updates only — never code changes. This is enforced by architecture and verified by testing.

- **Engineering implication:** Every AI service uses `ProviderFactory`, never `new OpenAI()`. Tests mock providers.
- **Example:** Switching from OpenAI to Anthropic is `AI_PROVIDER=anthropic`, not a code refactor.

---

## Article 7 — Design for Human Oversight

Every AI system must have a human appeal path. Players can disable AI features. Studios can override AI-generated content. Moderators can reverse AI moderation decisions. AI assists humans — it does not replace them.

- **Engineering implication:** Every AI pipeline has a `humanOverride` flag. Moderation decisions have a review queue.
- **Example:** AI flags a comment as toxic. A human moderator reviews and can unflag it.

---

## Article 8 — Fail Gracefully

When AI is unavailable — provider down, rate limited, model error — the platform must degrade to non-AI behavior. No feature may have AI as a single point of failure. Degradation paths must be tested.

- **Engineering implication:** Every AI service call is wrapped in a try/catch with a non-AI fallback. Fallback behavior is tested.
- **Example:** Semantic search fails → falls back to keyword search. Recommendations fail → shows trending games.

---

## Article 9 — Be Domain-Specialized

Playmorrow AI is the world expert on indie game discovery. It knows genres, mechanics, studios, platforms, and the indie ecosystem. It must never become a generic chatbot. Every prompt, every model fine-tune, every embedding must reinforce domain specialization.

- **Engineering implication:** All prompts are versioned in PromptRegistry. Generic prompts are rejected.
- **Example:** "This metroidvania has tight platforming reminiscent of Hollow Knight" (domain-specialized) vs "This is a good game" (generic).

---

## Article 10 — Measure Everything

Every AI feature must be measurable. Pre-launch baseline, post-launch KPI tracking, weekly review, quarterly assessment. If you can't measure whether the AI is improving the product, the AI shouldn't be in the product.

- **Engineering implication:** AIMetricsService is mandatory for all AI endpoints. Every feature has a KPI dashboard.
- **Example:** Recommendation CTR is measured daily. If it drops for 2 consecutive weeks, the model is rolled back.

---

## Article 11 — Minimize Hallucinations

AI must be grounded in platform data. When answering questions about games, AI must reference actual game data — never fabricate. When uncertain, AI must say so. "I'm not sure" is acceptable. Fabricated game facts are not.

- **Engineering implication:** RAG pipeline mandatory for game-related queries. Hallucination audit monthly.
- **Example:** "This game has 4.2 stars from 127 reviews" (grounded) vs "This is widely considered the best game ever" (hallucination).

---

## Article 12 — Learn From Feedback

Every AI interaction captures implicit feedback (clicked, ignored, dismissed). Explicit feedback is opt-in. Feedback must be used to improve the AI — not collected and ignored.

- **Engineering implication:** All AI endpoints log interaction outcomes. Weekly review of feedback patterns.
- **Example:** User dismisses a recommendation → model weights adjusted. User clicks recommendation → model reinforced.

---

## Article 13 — Label AI Content

Users must know when they're interacting with AI. AI-generated content must be visually labeled. AI-powered features must be identifiable. No Turing-test-passing behavior.

- **Engineering implication:** All AI UI components include an "AI" badge or label. API responses include `generatedBy: 'ai'` metadata.
- **Example:** "AI-suggested devlog draft" label on studio dashboard. "AI-powered search" indicator in search bar.

---

## Article 14 — No AI-Generated Reviews

Reviews must come from real players. AI must never generate, rewrite, or fabricate reviews. This protects platform credibility. AI may summarize existing reviews but must attribute them to real players and indicate that the summary is AI-generated.

- **Engineering implication:** Review pipeline gates AI from creating reviews. Review summarization must reference source reviews.
- **Example:** "Players mention the art style positively (23 reviews), but some find the difficulty uneven (8 reviews)" — summary, attributed, labeled AI.

---

## Article 15 — AI Must Be Kill-Switchable

Every AI feature must be independently disableable via feature flags or configuration. If an AI feature causes harm, it must be turned off in minutes — not deployed in days.

- **Engineering implication:** All AI features use feature flags. Kill switches tested quarterly.
- **Example:** `AI_SEMANTIC_SEARCH_ENABLED=true` → set to `false` → instant fallback to keyword search.

---

## Article 16 — No AI Feature Debt

AI features that don't meet their KPIs for 8 consecutive weeks must be either fixed or removed. No zombie AI features running indefinitely without measurable value. The evaluation matrix determines whether a feature is fixed or deprecated.

- **Engineering implication:** Weekly KPI review. Automated alert if feature underperforms for 4+ weeks.
- **Example:** AI moderation with false positive rate > 5% for 8 weeks → redesign or disable.

---

## Article 17 — Respect Cultural Context

AI must recognize that gaming culture varies across regions, languages, and communities. What's toxic in one context may be acceptable in another. Moderation must account for cultural nuance. Recommendations must not be culturally biased.

- **Engineering implication:** Moderation models evaluated across languages and regions. Recommendation diversity metrics tracked by region.
- **Example:** AI recognizes that competitive trash talk in fighting game communities differs from harassment in cozy game communities.

---

## Article 18 — Studios Own Their AI Data

When AI generates insights for a studio — sentiment analysis, store page optimization, competitive benchmarking — that data belongs to the studio. Studios can export it. Studios can delete it. Studios can prevent AI from analyzing their pages.

- **Engineering implication:** Studio-specific AI data stored with studio ownership. Export and deletion endpoints available.
- **Example:** Studio requests "export all AI insights" → receives JSON with all analysis, recommendations, and predictions.

---

## Article 19 — Accessibility Before AI

AI features must not degrade accessibility. AI-powered UI must work with screen readers, keyboard navigation, and reduced motion. If an AI feature breaks accessibility, fix accessibility first — then re-enable AI.

- **Engineering implication:** All AI UI components must pass WCAG 2.2 AA. AI features must be tested with screen readers.
- **Example:** AI-generated recommendation cards must have proper ARIA labels and keyboard navigation.

---

## Article 20 — The Constitution Is Binding

This constitution governs all AI decisions at Playmorrow. No AI feature may violate any article. Articles may be added but never removed. Modification requires an ADR approved by both the CEO and CTO.

- **Engineering implication:** Every PR adding AI code must reference the relevant constitutional articles. CI may include a constitution compliance linter in the future.
- **Example:** PR description: "Adds semantic search (M26). Complies with Articles 1, 6, 8, 9, 10, 11."
