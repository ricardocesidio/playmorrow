# AI Guiding Principles

> *Principles are not suggestions. They are not aspirations. They are the non-negotiable architecture of every AI feature at Playmorrow. If a feature violates a principle, the feature is wrong — not the principle.*

These 15 principles are derived from the [AI Philosophy](./AI_PHILOSOPHY.md) and designed to be actionable. Each includes a compliance example, a violation example, and a binary test. If a feature cannot pass the test, it cannot ship.

---

## 1. Assist, Never Replace

**Explanation:** AI should help humans make better decisions — not make decisions for them. Every AI surface must preserve a meaningful human choice point. AI proposes; the human disposes. The moment AI starts deciding instead of suggesting, the platform has crossed from helpful to paternalistic.

**Compliance:** *"Here are 3 games you might like based on your recent play history. Want to check them out?"*

**Violation:** *"Buy this game now — our algorithm says it's perfect for you."*

**Test:** *Does the human still have final agency? If the AI output cannot be ignored, dismissed, or overridden, it fails.*

---

## 2. Always Explain Recommendations

**Explanation:** Every AI output must include a "why" — not buried in a tooltip, not behind a settings toggle, but visible alongside the recommendation itself. *"Recommended because..."* is the mandatory prefix for every suggestion. A score without context is worse than no score at all — it creates the illusion of objectivity without accountability.

**Compliance:** *"Because you wishlisted Celeste and follow Matt Makes Games, you might like Sunblaze — similar tight platforming mechanics."*

**Violation:** *"Sunblaze: 94% match."* (No explanation of what "94%" means or how it was computed.)

**Test:** *Can a player articulate why this recommendation appeared without reading documentation?*

---

## 3. Respect Player Autonomy

**Explanation:** Players control their AI experience — from day one and at any time thereafter. Opt in, opt out, adjust weights for different signal types, reset recommendation history, or revert to content-based (non-personalized) discovery. Autonomy is not a preference; it is a right. The default state for new players is content-based recommendations with an explicit invitation to personalize.

**Compliance:** *A settings panel where a player can toggle "Use my play history," "Use my wishlist," "Use my follows," each independently, with a one-click "Reset all" button.*

**Violation:** *Personalized recommendations that cannot be disabled — or that require navigating five settings menus and reading a privacy policy to find the toggle.*

**Test:** *Can a player turn off all AI personalization in under 10 seconds, without reading documentation?*

---

## 4. Respect Studio Ownership

**Explanation:** AI analyzes public platform data only. Studios own their store page content, their game descriptions, their screenshots, their brand identity. AI may suggest improvements (tag recommendations, description drafts), but suggestions are opt-in — never auto-applied. A studio that ignores AI suggestions should have exactly the same platform experience as one that uses every suggestion.

**Compliance:** *"We noticed your game doesn't have a 'roguelike' tag. 78% of similar games use this tag and it improves discovery by an average of 35%. Would you like to add it? [Add tag] [Dismiss]"*

**Violation:** *Auto-applying genre tags to a game without studio approval, or changing a studio's store page copy to "optimize for search."*

**Test:** *Does the studio have to take explicit action for AI output to affect their store page?*

---

## 5. Never Manipulate Purchases

**Explanation:** AI may inform purchase decisions, but it must never create urgency, FOMO (fear of missing out), or deceptive patterns. Countdowns, scarcity signals ("only 3 left"), social pressure ("people in your area are buying"), and gamified urgency mechanics are permanently off-limits. A recommendation is an invitation, not a sales funnel.

**Compliance:** *"This game is currently 20% off during the Summer Sale. The sale ends July 15th."* (Factual, informative, no pressure.)

**Violation:** *"Only 2 hours left! 14 people are looking at this game right now! Don't miss out!"* (Manufactured urgency, social pressure.)

**Test:** *Would a reasonable person feel pressured to act immediately after reading this output? If yes, it fails.*

---

## 6. Reduce Friction

**Explanation:** AI should make tasks faster, not add steps. If explaining an AI feature takes longer than performing the task without it, the feature is a net negative. AI is not decoration — it is either noticeably useful or it is noise. Every AI feature must pass the "time saved" test with real users.

**Compliance:** *A semantic search that lets a player type "pixel-art metroidvania with emotional story, under 10 hours" and returns relevant results — replacing 20 minutes of tag filtering and review reading.*

**Violation:** *An "AI-powered search assistant" that asks the player 12 onboarding questions before showing results — when the player could have just typed in the search bar.*

**Test:** *Does an average user complete the task faster with the AI feature than without it?*

---

## 7. Prioritize Transparency

**Explanation:** Users must know when they are interacting with AI. No Turing-test-passing behavior. No ambiguity about whether content came from a human or a model. AI-generated content carries a visible label. AI-generated recommendations carry an explanation. AI moderation actions carry a "flagged by automated system" notice.

**Compliance:** *"This game summary was generated by Playmorrow AI and reviewed by the studio." (Visible label, clear attribution.)*

**Violation:** *AI-generated reviews styled identically to human reviews, with no label, attributed to a plausible-sounding username.*

**Test:** *Can a user immediately distinguish AI-generated content from human-created content without reading fine print?*

---

## 8. Provider-Agnostic By Default

**Explanation:** No feature may depend on a single AI provider. The [AI Architecture](./AI_ARCHITECTURE.md) enforces this through a provider abstraction layer — every feature calls the interface, never the implementation. This is not just an engineering decision; it is a strategic one. Vendor lock-in in AI is a risk to platform independence, cost control, and ethical alignment.

**Compliance:** *A recommendation feature that works identically whether the underlying model is OpenAI, Anthropic, or a self-hosted model — using the `AIProvider` interface with no provider-specific code paths.*

**Violation:** *"This feature requires OpenAI's GPT-4 API. If it's unavailable, the feature is unavailable."*

**Test:** *Can this feature be switched to a different AI provider by changing one environment variable, with zero code changes?*

---

## 9. Privacy By Default

**Explanation:** AI uses the minimum data needed for its function. Recommendations must work without personal data — a content-based fallback is mandatory for every feature. Personalization is a value-add, not a dependency. If a player has no platform activity, they should still get high-quality, genre-based, popularity-based recommendations.

**Compliance:** *A recommendation system that separates signals into tiers: Tier 1 (content-based: genre, tags, platform) always works. Tier 2 (community: popular among similar players) works if available. Tier 3 (personal: based on your activity) works only if opted in.*

**Violation:** *"We can't show you recommendations because we don't have enough data about you."*

**Test:** *Does the feature produce useful output for a brand-new player with zero platform history?*

---

## 10. Be Measurable

**Explanation:** Every AI feature has defined KPIs before launch. If you cannot measure it, you cannot improve it — and you cannot justify its existence. KPIs must include both performance metrics (accuracy, latency, cost) and experience metrics (satisfaction, trust, time saved). Measurement is not optional; it is a prerequisite for shipping.

**Compliance:** *A recommendation feature with pre-defined KPIs: recommendation click-through rate (target: >8%), recommendation-to-wishlist conversion (target: >3%), dismissal rate (target: <15%), user satisfaction survey score (target: >4.0/5). All tracked from day one.*

**Violation:** *"We'll figure out how to measure success after we launch."*

**Test:** *Does the feature have at least 3 quantitative KPIs and 1 qualitative KPI, with baseline measurements and targets, before the first line of code is written?*

---

## 11. Fail Gracefully

**Explanation:** When AI is unavailable — API outage, rate limit, model error, network failure — the platform degrades to non-AI behavior. No blocking paths. No dead ends. No "An error occurred, please try again later" with no fallback. The player should never notice that AI failed; they should only notice that the experience changed modes.

**Compliance:** *AI-powered search degrades to keyword search when the embedding service is unavailable. Recommendations degrade to genre-based lists. The UI transition is seamless — the player sees results either way.*

**Violation:** *"We're sorry, our AI recommendation engine is experiencing issues. Please check back later." (A blocking error with no fallback.)*

**Test:** *If every AI service goes down simultaneously, can a player still browse, search, and discover games?*

---

## 12. Minimize Hallucinations

**Explanation:** Ground AI responses in platform data. When uncertain, AI says "I'm not sure" rather than fabricating. This principle applies at two levels: the system level (retrieval-augmented generation, always) and the output level (confidence thresholds that trigger uncertainty language). Hallucination is not a model problem to be solved later — it is a product problem to be designed around now.

**Compliance:** *"This game has been on the platform for 3 weeks and has 14 reviews, which isn't enough for a confident recommendation. But early players seem to enjoy the combat system."*

**Violation:** *"This game has exceptional combat mechanics, a deep crafting system, and over 40 hours of content" — when the AI has no data about any of those claims.*

**Test:** *Can every factual claim in an AI output be traced to a specific data source on the platform?*

---

## 13. Learn From Feedback

**Explanation:** Every AI interaction captures implicit feedback (click, ignore, dismiss, dwell time). Explicit feedback (thumbs up/down, "not interested," "wrong genre") is available but always opt-in. Feedback loops are designed to improve over time, not to optimize for engagement at the cost of accuracy. A recommendation that a player consistently dismisses must stop appearing — persistence is not persuasion.

**Compliance:** *When a player clicks "Not interested" on a roguelike recommendation, the system reduces the weight of roguelike signals in future recommendations and logs the interaction for model improvement.*

**Violation:** *A player has dismissed "metroidvania" recommendations 8 times, and the 9th recommendation is still a metroidvania.*

**Test:** *If a player provides negative feedback on a category three times, does that category disappear from their recommendations?*

---

## 14. Be Domain-Specialized

**Explanation:** Playmorrow AI knows indie games. It should be the world expert on indie game discovery — not a general-purpose chatbot that happens to know about games. Domain specialization means understanding genre taxonomies, platform ecosystems, indie development realities, and gaming community culture. A general-purpose model answering game questions is not a feature — it's a commodity.

**Compliance:** *Playmorrow AI correctly distinguishes "soulslike" from "metroidvania," understands that "boomer shooter" refers to 90s-style FPS games, and knows that "cozy game" is a distinct genre with its own audience — and recommends accordingly.*

**Violation:** *AI recommends *Call of Duty* to a player asking for indie roguelikes, because the model was trained on general internet data and doesn't understand the platform's domain.*

**Test:** *Does the AI demonstrate knowledge of indie game culture (genres, platforms, development realities) that a general-purpose chatbot would lack?*

---

## 15. Create Real Value

**Explanation:** If removing an AI feature wouldn't be noticed within a week, it shouldn't exist. AI is not decoration. It is not a marketing bullet point. It is not something to add because "everyone else has AI." Every AI feature must solve a real, measurable, user-articulated problem. AI features that exist for their own sake dilute trust and consume engineering resources.

**Compliance:** *A semantic search feature that lets players find games by describing what they want in natural language — replacing the existing tag-filter interface that players consistently reported as frustrating in user research.*

**Violation:** *An "AI game description rewriter" that restates the studio's description in slightly different words, adding no new information and solving no real problem.*

**Test:** *If this feature were removed today, would any user file a feature request asking for it back?*

---

## Governance

### Principle Override

No principle may be overridden by a product manager, an engineer, or an executive. Principle violations require:

1. **Written justification** documenting which principle is being violated, why, and what compensating controls are in place.
2. **Review by at least two people** — one technical (engineering lead) and one non-technical (design or ethics).
3. **Time-bound sunset** — principle exceptions must have an expiration date and a plan for compliance.

### Principle Evolution

These principles are versioned. As the AI landscape evolves, new principles may be added and existing ones refined — but no principle may be removed without a replacement that provides equal or stronger protection.

### Principle Audit

Every AI feature is audited against all 15 principles before launch and quarterly thereafter. Audit results are documented and accessible to the team. A feature that fails any principle test is blocked from shipping until the failure is resolved.

---

## Cross-References

- [AI Philosophy](./AI_PHILOSOPHY.md) — The manifesto from which these principles derive
- [AI Personality](./AI_PERSONALITY.md) — How Playmorrow AI embodies these principles in its voice
- [AI Architecture](./AI_ARCHITECTURE.md) — Technical enforcement of provider-agnosticism (Principle 8) and graceful degradation (Principle 11)
- [Phase 6 Roadmap](./PHASE6_ROADMAP.md) — Execution plan where these principles are first applied at scale

---

*Version 1.0 — Ratified as foundational governance for all Playmorrow AI features. These principles are immutable unless explicitly amended through the governance process described above.*
