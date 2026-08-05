# AI North Star

**Status:** Active — governs all AI decisions at Playmorrow
**Last updated:** 2026-08-05
**Authority:** CEO + CTO joint approval required to modify

---

## What This Is

The AI North Star is the single-page strategic identity of Playmorrow AI. Every AI feature, every prompt design, every architecture decision must be consistent with the answers below.

---

## 1. If OpenAI disappeared tomorrow, would Playmorrow continue working?

**Yes. Completely.**

Playmorrow AI is built on a provider abstraction layer. The `AIProvider` interface defines what AI can do; `OpenAIProvider`, `AnthropicProvider`, and future providers implement it. The `ProviderFactory` selects the active provider via the `AI_PROVIDER` environment variable.

If OpenAI disappeared:
1. Set `AI_PROVIDER=anthropic` → same features, different provider
2. Set `AI_PROVIDER=gemini` → same features, different provider
3. Set `AI_PROVIDER=local` → degraded but functional via Ollama/LM Studio

**Playmorrow owns its intelligence layer. Providers are replaceable infrastructure.**

This is not hypothetical preparation — it is built into the architecture, tested, and documented. No business-critical feature depends on a single vendor.

---

## 2. If users never realized AI existed, would the product become better?

**Yes. Invisible AI is the goal.**

The best AI features don't announce themselves. They make the product better silently:

| Feature | User Experience | AI Behind It |
|---------|----------------|--------------|
| Better search | "I typed 'cozy farming game with romance' and it just worked" | Semantic search + embeddings |
| Better recommendations | "The recommendations actually make sense" | Collaborative filtering + content analysis |
| Better moderation | "I never see spam here" | Toxicity detection + auto-flagging |
| Better discovery | "How did it know I'd like this?" | Cross-genre recommendation engine |
| Better support | "My question was answered instantly" | RAG-powered help search |
| Smarter notifications | "This notification was actually relevant" | Relevance scoring + personalization |

The user should experience **value**, not **AI**. If an AI feature requires explanation to be appreciated, it should be redesigned.

---

## 3. If all AI disappeared tomorrow, what would users immediately miss?

### Players would miss:
- Finding games they didn't know existed
- Search that understands natural language
- Recommendations that feel personal
- A community free of spam

### Studios would miss:
- Insights about what players actually think
- Understanding why their store page converts (or doesn't)
- Devlog topic suggestions that resonate with their audience
- Competitive benchmarking they can't do manually

### Moderators would miss:
- Automatic spam detection (80% of reports eliminated)
- Toxicity flagging before content is seen by users
- Triage that prioritizes the most urgent cases

### Marketplace users would miss:
- "Related assets" that actually make sense
- Fraud detection that keeps transactions safe

### Support would miss:
- Instant answers to common questions
- Ticket routing to the right person

**This confirms: AI at Playmorrow creates real, measurable, immediately noticeable value — not novelty.**

---

## 4. Where should Playmorrow be in five years?

**Playmorrow should be the most trusted indie game discovery platform in the world — not because it has a chatbot, but because it understands games, respects players, and empowers studios.**

In five years:
- **Discovery:** Playmorrow AI should know more about indie game discovery than any human curator. Not because it's sentient — because it's trained on millions of real player interactions.
- **Studio Intelligence:** An indie developer should get more actionable insights from Playmorrow than from any other platform — including Steam.
- **Recommendations:** Playmorrow recommendations should have the highest trust rating of any gaming platform. When Playmorrow says "you might like this," players believe it.
- **Community:** Playmorrow communities should be the healthiest in gaming — not because of heavy-handed moderation, but because AI catches toxicity before it spreads.
- **Provider Independence:** Playmorrow should be able to run its core AI features on any provider, including self-hosted models.

---

## 5. What sentence do we want users to say?

**"Playmorrow always finds the game I didn't even know I wanted."**

This is the official North Star statement. Here's why:

- **"Always finds"** — consistency. Not sometimes, not "when it works." Always. This is an engineering quality commitment.
- **"The game"** — singular. Personalized. Not a list of 50. The right game.
- **"I didn't even know I wanted"** — serendipity. Discovery beyond what the user could find themselves. This is the AI's core value proposition.
- **Absence of technology** — the user doesn't say "the AI found me a game." They say "Playmorrow found me a game." The AI is the platform, not a feature.

---

## Why This Matters

Every AI feature proposal must be evaluated against this page:

- **Does it work without OpenAI?** → If no, redesign for provider independence.
- **Is the AI invisible?** → If it requires explanation, redesign for seamlessness.
- **Would users miss it?** → If no, it shouldn't exist.
- **Does it move toward the 5-year vision?** → If no, defer.
- **Does it make users say the sentence?** → If no, question its priority.

---

**This document is the North Star. Every AI decision starts here.**
