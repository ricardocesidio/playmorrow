# M23 — Recommendation Engine: Implementation Plan

**Status:** Approved for implementation (all governance gates pass)
**Date:** 2026-08-09
**Based on:** AI_ROADMAP_V2 (M23 = Tier 1, score 48), AI_CONSTITUTION, AI_GUIDING_PRINCIPLES, AI_DECISION_FRAMEWORK_V2, AI_FEATURE_EVALUATION_MATRIX
**Repository state:** v1.0.0-platinum, P0.1.1 hardening certified 🟢, Phase 6 unblocked

---

## 0. Feature Decision Gate (AI_DECISION_FRAMEWORK_V2 — 8 gates)

| Gate | Question | Verdict | Evidence |
|---|---|---|---|
| 1 Value | Specific problem + measurable fix? | ✅ | Problem: players can't find games beyond trending lists; discovery is same-for-everyone. Measure: CTR, wishlist conversion from recommendations. |
| 2 User | Can user disable? Human override? | ✅ | Personalization toggle (opt-out default for personalization per Principle 3); dismiss button on every card (Principle 1, Article 7). |
| 3 Privacy | Personal data → opt-in? Delete history? | ✅ | Personalization is opt-in via toggle; `recommendation_feedback` rows cascade on user deletion; no user data in embeddings (game content only). Article 5. |
| 4 Safety | Degradation path + kill switch? | ✅ | Provider/embedding failure → deterministic fallback (existing 9 static scorers + trending). `AI_RECOMMENDATIONS_ENABLED` feature flag = instant kill switch. Article 8, 15. |
| 5 Cost | Monthly cost at 100%? Cheaper provider? | ✅ | <$5/month at any scale (no per-request inference; v1 uses cached pgvector similarity). Provider swap = `AI_PROVIDER` config, zero code change (Article 6). |
| 6 Explainability | Can it explain, understandably? | ✅ | Every item returns `reason` + `reasonType` ("Because you wishlisted X", "Similar to games you follow"). Article 3, Principle 2. |
| 7 North Star | Finds games you didn't know you wanted? | ✅ | Primary purpose: cross-genre semantic discovery + hidden gems + cold-start discovery. |
| 8 Ship small | Simplest valuable version? ≤100 users test? | ✅ | v1 = hybrid engine on existing signals + persisted game embeddings; rollout 5% → 25% → 100%. |

**All 8 gates pass → Approved.**

### Feature Evaluation Matrix (AI_FEATURE_EVALUATION_MATRIX)

| Dimension | Score (1-5) | Rationale |
|---|---|---|
| User Value (UV) | 5 | Game-changing for discovery — the North Star feature |
| Business Value (BV) | 4 | Drives wishlist conversion + marketplace attach; retention driver |
| Differentiation (D) | 4 | Explainable cross-genre indie discovery — beyond Steam-style "more like this" |
| Complexity (C) | 2 | 5-8 week roadmap item; hybrid engine + pgvector infra |
| Operational Cost (OC) | 5 | <$10/month (no per-request AI) |

**Priority Score = (5×2) + 4 + 4 − 2 − (5/10) = 15.5 → ≥12 → APPROVED** (consistent with AI_ROADMAP_V2 score 48, Tier 1).

---

## 1. Current Architecture

Two parallel recommendation paths exist (audit verified):

1. **`GET /recommendations`** (static, `apps/api/src/recommendations/`) — 9 weighted scorers (tag-similarity 0.25, follow 0.30, wishlist 0.20, trending 0.15, interaction 0.10; hidden-gems, similar-studios, recently-updated, latest-releases ×1.0). Response: `{items: [{gameId, score, reasons[]}], nextCursor}` — IDs only, explanations from a static label map. Used by homepage trending, discover, and game-detail "Similar Games".
2. **`GET /ai/recommendations`** (semantic, `apps/api/src/ai/services/recommendation.service.ts`) — request-time description embeddings with 24h in-memory cache, cosine >0.7 → "Semantically similar to X", tag fallback, studio-follow bonus. Returns full games + explanation. Not surfaced in the UI; `useRecommendations()` hook is dead code.

**AI foundation** (Session 22, 35 files, 82 tests): `AIProvider`/`EmbeddingProvider`/`ModerationProvider` interfaces, OpenAI + Anthropic providers, `ProviderFactory`, `AIService`, `EmbeddingService` (chunking), `PgVectorStore` (raw SQL on `ai_documents`), `PromptRegistry`, `ConversationMemory`, `AIMetricsService` (cost/latency tables, **not wired to runtime**), `AIConfig` (mostly decorative), 8 spec files with mock providers.

**Critical gaps found (must be addressed inside M23):**
- ❌ pgvector extension never enabled; `ai_documents` table never migrated (fresh DB would 500)
- ❌ No persisted game embeddings (request-time embed + memory cache only)
- ❌ No user taste/tracking model; `GameView` has no userId (anonymous)
- ❌ `AIMetricsService` not wired to any controller; `AI_PROVIDER` env var not honored by `ProviderFactory`
- ❌ `RecommendationController` (`/ai/recommendations`) lacks `@Throttle`
- ❌ No CTR/feedback instrumentation anywhere → no KPI baseline exists
- ❌ No personalization opt-out toggle; no feature flag (Article 15)

## 2. Existing Data Available (reused, not duplicated)

| Signal | Model | Strength | Used by |
|---|---|---|---|
| Wishlist | `WishlistItem` | Strong positive | 3 existing scorers |
| Follows | `Follow` (GAME/STUDIO) | Medium | follow-based scorer |
| Purchases | `PurchasedLicense`, `Transaction` | Strong intent | (new: exclusion + boost) |
| Views | `AnalyticsEvent` (eventType, userId, gameId, metadata) | Weak implicit | interaction-history scorer |
| Engagement | `Comment`, `Reaction`, `DevlogLike` (via Devlog.gameId) | Medium | (new: taste signal) |
| Content | `Game`: title, tagline, description, genres (CSV string), priceCents, isFree, status, releaseDate, counters (followers/wishlists/comments/views) | — | tag similarity + embeddings |
| Taxonomy | `Tag` (kind: genre/feature/mood/platform) + `GameTag` join | — | content similarity, explanations |
| Onboarding | `User` preferences (fields on User model — verify `onboarding`/`preferredGenres`) | — | cold start |

## 3. Missing Data

| Gap | Resolution (within M23) |
|---|---|
| Persisted game embeddings | New `game_embeddings` table (pgvector) + nightly refresh cron + refresh on game publish/update (EventBus) |
| pgvector extension | Migration `CREATE EXTENSION IF NOT EXISTS vector` + HNSW index |
| CTR/negative feedback | New `recommendation_feedback` table (userId, gameId, action CLICKED/DISMISSED/WISHLISTED, createdAt) |
| KPI baseline | Instrument baseline on existing trending section before flipping for-you |
| User→game view attribution | Leave `GameView` anonymous (out of scope); use `AnalyticsEvent` where userId exists |
| Taste profile storage | v1 computes taste on the fly from existing signals (no new profile table — YAGNI); ALS latent vectors deferred to later sprint (roadmap week 3) |

## 4. Recommendation Strategy

**Hybrid, deterministic-first** (Principle 8 / Article 6 / Article 8):

```
User signals (wishlist, follows, purchases, views, engagement)
        ↓
Candidate generation
  ├─ A. Content-based: tag/genre overlap (existing scorers)
  ├─ B. Semantic: pgvector cosine similarity vs user-taste vector
  ├─ C. Behavioral: interaction-history scorer + similar-users (wishlist-similarity)
  └─ D. Freshness/popularity floor: trending, hidden-gems, recently-updated (cold-start floor)
        ↓
Ranking (weighted hybrid + MMR diversity re-rank)
        ↓
Filtering (exclude owned, wishlisted, followed, previously dismissed, self)
        ↓
Explanation (dominant-signal reason per game)
        ↓
Response + feedback capture (CTR)
```

- **No per-request AI inference.** The user-taste vector is computed from interaction history **deterministically in Postgres** (weighted genre/tag centroid), then matched against cached game embeddings with pgvector cosine. AI (embeddings) is used only in the offline refresh pipeline. Result: $0 per request, provider failure cannot break the endpoint (Article 8).
- **User-taste vector construction:** weight signals — wishlist ×3, purchase ×3, studio follow ×2, game follow ×1.5, view ×0.5, positive reaction ×1 — accumulate normalized tag/genre preference vector + a text-queried semantic centroid (embed the titles/descriptions of positively-signaled games, average). Embedding of user taste happens only when the user has ≥1 positive signal AND personalization is opted-in.
- **Similarity scoring:** `score = 0.45·semantic + 0.30·content(tags) + 0.15·behavioral + 0.10·freshness`, minus popularity penalty for serendipity (boost hidden gems); MMR diversity with λ=0.5 on genre.

## 5. Candidate Generation

- Reuse all 9 existing scorers as **deterministic candidate sources** (no changes to their behavior).
- Add **semantic candidates**: top-40 games by cosine to the taste vector (when personalization enabled); when disabled or new user → skip.
- Add **hidden-gems** (high review sentiment, low wishlists) and **recently-updated** always (discovery floor, cold-start).
- Merge + dedupe by gameId; cap at 100 candidates per request.
- All candidate games must be `status=RELEASED`-or-later public published games (`isPublished=true`) with a cover.

## 6. Ranking Strategy

1. Compute hybrid score per candidate (weights above; normalize each sub-score to [0,1] via min-max).
2. **MMR diversity re-rank**: repeatedly pick highest-scoring candidate whose genre differs from already-picked; λ=0.5.
3. Score-cursor pagination (same contract as existing `/recommendations`: `nextCursor = {score, gameId}`).
4. Explanation attached post-rank from the dominant contributing signal (see §8).

## 7. Cold-Start Strategy

New user / no history / personalization off:
1. **Onboarding preferences** if present (User.preferredGenres / onboarding data) → content-based candidates only (tags match, no user data beyond what the user explicitly gave).
2. Otherwise: **trending + hidden-gems + recently-updated** floor (deterministic, same for everyone).
3. Explicit "I like this" quick actions on cold-start cards (like/wishlist) seed the taste vector fast — cards respond immediately.
4. Popularity is a fallback, never the primary signal (per brief §6).

## 8. Explainability Strategy

Per-item `reason` + `reasonType` (Article 3, Principle 2), generated from the dominant signal:
- `WISHLISTED_SIMILAR` → "Because you wishlisted {game}"
- `PURCHASED_SIMILAR` → "Because you own {game}"
- `FOLLOWED_STUDIO` → "From a studio you follow" / "Because you follow {studio}"
- `FOLLOWED_GAME` → "Because you follow {game}"
- `TAG_AFFINITY` → "Because you enjoy {genre/tag} games"
- `SEMANTIC` → "Because it's similar to {game in your library}"
- `HIDDEN_GEM` → "A hidden gem matching your taste"
- `TRENDING` / `RECENT` → "Popular with players who enjoy {shared tag}" / "Newly updated"
- No chain-of-thought; max 12 words; always user-facing and verifiable.

## 9. Privacy Model

- **Embeddings contain game public content only** (title, tagline, description, tag names). No user data is ever embedded or sent to providers (Article 5).
- **Taste vector is computed server-side from on-platform signals**; it is never transmitted to any AI provider (v1 has no per-request inference at all).
- **Personalization is opt-in** (Principle 3): `settings → personalization` toggle. Off → content-based + discovery floor only; no signal gathering for recs.
- **GDPR**: `recommendation_feedback` rows include `userId` and cascade-delete with the user (FK ON DELETE CASCADE); taste vectors are ephemeral (recomputed per request) so deletion is immediate by construction. Game embeddings are game-level data (not personal data).
- **Audit log**: what data enters embeddings/prompts/models/logs/analytics is documented in `docs/ai/M23_SECURITY.md`.

## 10. Provider Integration

- Embeddings via `ProviderFactory.getEmbeddingProvider().embedTexts()` (existing interface; OpenAI default, swappable via `AI_PROVIDER`).
- **Fix (in scope):** honor `AI_PROVIDER` in `ProviderFactory` (currently hardcoded openai-first); wire `AIConfig` getters into the factory + `AIMetricsService` recording (currently decorative).
- Refresh pipeline failure (provider down) → skip refresh, keep last-good embeddings (Article 8); endpoint still serves deterministic candidates.
- No chat/model inference in the request path → Anthropic-only setups still serve recommendations (tag-based).

## 11. API Design

| Method/Path | Auth | Description |
|---|---|---|
| `GET /recommendations/for-you?limit=&cursor=` | OptionalSessionGuard + `@Throttle(30/min)` | Personalized feed. Anonymous/cold → content-based/discovery floor. Response: `{items:[{gameId, score, reason, reasonType, sourceGameId?}], nextCursor, method: 'hybrid'\|'content'\|'trending'}` |
| `POST /recommendations/feedback` | SessionAuthGuard + `@Throttle(60/min)` | Body `{gameId, action: CLICKED\|DISMISSED\|WISHLISTED}` → rows in `recommendation_feedback` (drives CTR + dismissal exclusion + Article 12 learning) |
| `POST /recommendations/refresh-embeddings` | ADMIN only + `@Throttle(1/min)` | Manual embedding refresh (also nightly cron + EventBus on game publish/update) |
| `GET /ai/recommendations` (existing) | unchanged | kept as provider-backed fallback path, add `@Throttle` |

Existing `/recommendations` and `/ai/recommendations` remain untouched except throttling — no breaking changes.

## 12. Database Changes

Migration `20260809000000_m23_recommendation_engine` (raw SQL, additive):
1. `CREATE EXTENSION IF NOT EXISTS vector;`
2. `CREATE TABLE game_embeddings (id UUID PK, game_id UUID UNIQUE REFERENCES games(id) ON DELETE CASCADE, embedding vector(1536), model TEXT, dimensions INT, version INT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());` + `CREATE INDEX ... USING hnsw (embedding vector_cosine_ops);`
3. Prisma model `RecommendationFeedback`: `id`, `userId` (FK cascade), `gameId` (FK cascade), `action` (enum CLICKED/DISMISSED/WISHLISTED), `createdAt`. Index `(userId, gameId)`.
4. No user-taste table (ephemeral), no changes to existing models.

Applied via `pnpm db:migrate` (dev branch; guard allows). Prod deploy via `prisma db deploy` in CI/Docker (safe op).

## 13. Frontend Changes

- **Homepage "For You" section** (`components/recommendations/for-you-section.tsx`): shown to logged-in users when flag on; SSR loading skeleton; renders existing `GameCard`-style cards + explanation line ("Because you wishlisted X"), dismiss (✕) button, and "More like this" affordance.
- **A11y (Article 19):** `aria-live="polite"` section container, `role="list"`/`listitem`, dismiss button with `aria-label="Dismiss recommendation: {game}"`, visible `focus-visible` ring, keyboard dismiss (Enter/Space), error state via shared `ErrorState` (`role="alert"`).
- **Settings**: personalization toggle in `/settings/notifications` → new `/settings/personalization` section (opt-in consent, one-click reset of feedback history per Principle 3).
- **Feedback wiring**: client fires `POST /recommendations/feedback` on card click (CLICKED), dismiss (DISMISSED), wishlist add (WISHLISTED) — optimistic UI on dismiss (card removed instantly, Article 12).
- Dead `useRecommendations()` hook either wired or removed (no dead code).
- Rollout-gated via `AI_RECOMMENDATIONS_ENABLED` + `AI_RECOMMENDATIONS_PCT` checked server-side on `/recommendations/for-you` (consistent user hash) — UI needs no client-side bucketing.

## 14. Analytics

- Wire `AIMetricsService.recordEmbedding()` in the refresh pipeline (tokens, model, latency, cost).
- New `RecommendationMetricsService` (or extend AI metrics): request count, method breakdown (hybrid/content/trending), candidate count, latency p50/p95, CTR (feedback CLICKED/impressions), dismissal rate, wishlist conversion from recs, diversity (unique genres per page), repeated-recommendation rate, cold-start share.
- No PII in metrics (userIds excluded from aggregates).

## 15. Testing Strategy

Unit tests (mocked providers, existing `vi.fn()` pattern — zero real API calls):
- candidate generation (each source, merge, dedupe, cap)
- ranking (weights, normalization, MMR diversity, ties)
- filtering (owned/wishlisted/followed/dismissed exclusions)
- cold start (no history, onboarding prefs, personalization off)
- duplicate prevention + repeated-recommendation penalty
- explanation generation (each reasonType, truncation, no chain-of-thought leak)
- provider failure → deterministic fallback (Article 8 test)
- empty datasets (0 games, 0 signals), malformed game data (null description/genres)
- privacy boundaries (no user data in embedding payloads), GDPR deletion (feedback cascade)
- deterministic fallback equivalence (semantic disabled == tag-based)
- diversity (MMR output genre spread)

Integration: against disposable PG :5433 with `vector` extension + migrations (`vitest.setup.ts`), covering table creation, embedding write/search round-trip, feedback write + cascade delete.

## 16. Rollout Strategy (AI_EXECUTION_FRAMEWORK)

1. Ship behind `AI_RECOMMENDATIONS_ENABLED=false` (kill switch verified, Article 15).
2. **5%**: hash-consistent bucket; measure 2 weeks.
3. Gate to 25%: for-you CTR ≥ 1.2× trending-baseline CTR **and** dismissal rate < 30%.
4. Gate to 100%: 25% CTR ≥ 1.5× baseline and wishlist conversion from recs +20% (per AI_ROADMAP_V2 KPIs).
5. Underperformance for 2 consecutive weeks → flag off (rollback), review (Article 16).

## 17. KPI Baseline

| KPI | Baseline today | Target (AI_ROADMAP_V2) |
|---|---|---|
| Recommendation CTR | **Not instrumented** — v1 must establish baseline on existing trending section (2 weeks) | +35% over static scorers |
| Wishlist conversion from recs | Not instrumented | +20% |
| Diversity (unique genres/page) | Not measured | +30% |
| Serendipity (games outside top-50) | Not measured | +25% |
| Acceptance (not dismissed in 7d) | Not measured | >70% |
| Cold-start CTR | Not measured | ≥ trending CTR (no regression) |

## 18. Cost Estimate

| Component | Per unit | Monthly |
|---|---|---|
| Embedding refresh: `text-embedding-3-small` ($0.02/1M tokens), ~1.5K tokens/game | $0.00003/game | Full re-embed 10K games = $0.30; nightly changed-only ≈ $0.01 |
| Storage: 1536×float4 ≈ 6KB/game | — | 10K games ≈ 60MB (free tier) |
| Per-request inference | **$0** (none in path) | $0 |
| **Total** | | **<$5/month** |
| At 10K DAU | no per-request AI | <$5/month |
| At 50K DAU | no per-request AI | <$20/month (refresh growth only) |

Within Phase 6 budget ($500/month cap) by 2 orders of magnitude.

## 19. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Filter bubble | Medium | MMR diversity λ=0.5, hidden-gems floor, serendipity metric, region diversity (Article 17) |
| Poor recs damage trust | Medium | Every item explainable (Article 3); dismissal teaches; kill switch |
| Cold start poor UX | Medium | Onboarding-pref content + discovery floor; explicit quick-like actions |
| Provider/embedding outage | Low | Deterministic fallback always available (Article 8); last-good embeddings kept |
| Gaming/manipulation of recs | Low | Signals from purchases/wishlists are hard to fake at scale; rate limits; admin kill switch; Article 2 compliance (no urgency language) |
| Cost creep | Low | No per-request AI; nightly diff refresh; metrics cost dashboard |
| Hallucination | None | No generated content — only real games with real explanations (Article 11) |
| Privacy | Low | Opt-in personalization; no user data to providers; GDPR cascade (Article 5) |
| pgvector on Neon | Low | HNSW index; fallback if extension unavailable (deterministic path still works) |

## 20. Kill Criteria

- CTR < trending baseline for 2 consecutive weeks at ≥25% rollout → flag off, redesign.
- Dismissal rate > 45% at 25% → flag off.
- Cost > $100/month without justification → flag off.
- Any personal data leak to provider → flag off immediately + incident process.
- A11y regression on recommendations surfaces → disable feature (Article 19).

---

## Scope Guard

**In scope:** hybrid engine (v1), pgvector infra + game embeddings + refresh cron, `for-you` + feedback + refresh endpoints, homepage For You section, personalization toggle, metrics wiring, provider-factory `AI_PROVIDER` fix, throttles, tests, docs.

**Out of scope (deferred, documented in AI_ROADMAP_V2):** ALS collaborative filtering latent vectors (week 3), Emotional Discovery mood classification (week 7), full A/B framework (week 5), Semantic Search (M26), Studio Intelligence (M25), chat assistant (M22), AI moderation (M24). No schema changes beyond the two additive tables.
