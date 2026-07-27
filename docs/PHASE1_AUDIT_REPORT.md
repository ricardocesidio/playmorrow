# Playmorrow — Phase 1 Independent Validation Audit

**Auditor:** Independent Principal Engineer / Architect / CTO (30+ years)
**Date:** 2026-07-27
**Scope:** Phase 1 (Auth, OAuth, RBAC, Players, Studios, Games, Devlogs, Roadmaps, Wishlist, Follows, Notifications, Support, Help, Analytics, Intelligence, Verification, Docs)
**Methodology:** Evidence-only. Every claim verified against real code, schema, build output, and test runs.

---

## EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| **Overall Score** | **67/100** |
| **Phase 1 Complete?** | **NO** |
| **Blockers (Critical)** | **4** |
| **Medium Issues** | **11** |
| **Low Issues** | **9** |
| **Documentation Accuracy** | 6/10 (4 verified inaccuracies found) |

### Verdict

**Phase 1 is NOT ready for closure.** The platform has a strong foundation — excellent security, clean architecture, well-designed database, and genuine feature breadth. However, 4 critical issues and several documentation inaccuracies prevent Phase 1 from being certified complete. Estimated effort to fix: **3-5 days**.

---

## VERIFIED FACTS (Evidence Confirmed)

### Build Pipeline — ✅ Verified

| Check | Claimed | Actual | Verdict |
|-------|---------|--------|---------|
| pnpm install | — | ✅ Resolves cleanly | ✅ |
| pnpm typecheck | 6/6 | ✅ 6/6 successful, 0 errors | ✅ |
| pnpm lint | 0 errors | ✅ 0 errors (49 warnings, all pre-existing `token` unused-var) | ✅ |

### Test Suite — ❌ CLAIMS INACCURATE

| Claim | Documented | Actual | Delta |
|-------|------------|--------|-------|
| Passing tests | "258 pass" | 214 pass | **44 fewer** |
| Skipped tests | "1 skip" | 45 skipped | **44 more** |
| Failing tests | "0 failures" | **2 test files FAILING** | **2 failures** |
| Errors | "0 errors" | **2 unhandled errors** | **2 errors** |
| "Shared-DB flakiness resolved" | ✅ resolved | ❌ Still dependent on shared Neon DB | **Not resolved** |

**Root cause of failures:**
1. `notifications.controller.spec.ts` — `beforeAll` hook timeout (>10s) because heavy sequential DB operations on remote Neon exceed vitest's default timeout. Missing `vi.setConfig({ hookTimeout: 30_000 })`.
2. `reactions.controller.spec.ts` — Same hook timeout, flaky (passes when Neon responds in <10s).

**Root cause of errors:**
1. `RoadmapItemsController.remove()` at `roadmap-items.controller.ts:92` — emits `roadmap_updated` event WITHOUT `studioId`, causing `GoalsService.progress()` to pass `undefined` to Prisma.
2. `RoadmapItemsController.reorder()` at `roadmap-items.controller.ts:59` — same bug, missing `studioId`.

**Fix: 30 minutes** — add `vi.setConfig({ hookTimeout: 30000 })` to 2 spec files, add `studioId` to 2 event emissions.

---

## SCORES

| Category | Score | Rationale |
|----------|-------|-----------|
| **Documentation** | 60/100 | Well-written but 4 verified inaccuracies; no dynamic SEO docs for client pages; STATUS claims contradict reality |
| **Architecture** | 85/100 | Clean monorepo, well-modularized NestJS, proper separation of concerns, Event Bus pattern. Minor: in-memory EventBus loses events on restart; dual event system (EventBus + FeedEngine) confusing |
| **Frontend** | 70/100 | Good component structure, TanStack Query, proper loading/error/empty states. Major: all pages are `'use client'` — zero dynamic SEO metadata. Missing settings pages (account, notifications) |
| **Backend** | 75/100 | Solid module design, proper DTO validation, audit logging. Critical: feed pagination slices in memory (unbounded). MEMBER can delete devlogs. N+1 in analytics |
| **Database** | 90/100 | Excellent schema design. 38 models, proper indexes, correct cascades, good enum coverage. Model names are consistent. Schema is normalized |
| **Security** | 88/100 | Excellent: global HMAC CSRF, CSP nonce, argon2id, rate limiting, upload validation. Minor: CSRF cookie maxAge mismatch (1 day vs 7 days); dev fallback CSRF secret |
| **SEO** | 50/100 | Root layout has good metadata/OG/canonical/JSON-LD. But ALL content pages are `'use client'` — game/studio/devlog pages have NO dynamic OG metadata. Search engines see generic tags everywhere |
| **Accessibility** | 40/100 | Modal focus trap, basic ARIA. No formal WCAG audit. Keyboard nav not verified. Color contrast not checked |
| **Performance** | 60/100 | In-memory feed pagination fails at scale. Analytics N+1 queries. Auto-refresh 30s is good. No load testing baseline |
| **Testing** | 30/100 | 2 test files fail, 45 skipped, 2 unhandled errors. Depends on shared Neon DB (no test isolation). Hook timeout issues. No Playwright E2E suite verified |
| **DevOps** | 65/100 | CI/CD configured, Docker, Vercel+Railway, Sentry. Missing: staging env, uptime monitoring, env vars not all set on Railway |
| **Business Readiness** | 55/100 | Strong technical foundation. Beta badge present. But test suite red, documentation inaccurate, missing settings pages, no production env var audit |
| **Production Readiness** | 50/100 | Security is strong. But: test suite unreliable, no staging, env vars incomplete, in-memory feed pagination is a scalability blocker |
| **Technical Debt** | 65/100 | Clean code overall. Notable: dual event system, duplicate press kit modules, dead adminOnly endpoint, race condition in onboarding, no exception filter |

---

## TOP 20 STRENGTHS

1. **CSRF protection**: HMAC-SHA256 stateless, global APP_GUARD, timing-safe comparison — enterprise grade
2. **CSP**: Nonce-based middleware with proper directives for all resource types
3. **Security architecture**: Argon2id, rate limiting (60/min + per-route), upload validation (magic bytes + dimensions), Helmet headers, HSTS
4. **Database schema**: 38 well-designed models, proper indexes on all FKs, correct cascade deletes, comprehensive enums
5. **Event Bus pattern**: Central typed emit/on enables loose coupling between modules
6. **Studio RBAC**: 4-tier studio roles (Owner/Admin/Moderator/Member) with seat limits and invitation system
7. **Auth flow**: Session-based cookies + OAuth + email verification + password reset + account lockout — complete auth lifecycle
8. **Audit logging**: Full audit trail for all platform actions across every controller
9. **API consistency**: class-validator DTOs with whitelist + forbidNonWhitelisted on all endpoints
10. **Frontend state management**: TanStack Query with proper cache keys, 30s auto-refresh, optimistic updates, proper invalidation
11. **Loading/Error/Empty states**: Consistent patterns across all pages — skeletons, ErrorState, EmptyState components
12. **Verification platform**: 6-tier system with trust score, company profile, press kit, brand kit — impressive depth
13. **Studio analytics**: Real event tracking, 7d/30d/90d time-series, traffic source breakdowns
14. **Help Center**: Full CMS with categories, search, article feedback, reading time
15. **Support tickets**: Status workflow, departments, admin queue, history trail, email notifications
16. **Devlog system**: Rich markdown editor, preview/split modes, scheduling, categories, tags, screenshots, reactions, sharing
17. **Monorepo organization**: Clean Turborepo setup with proper package boundaries
18. **SSE real-time notifications**: Deduplication, mark-all-read, milestone/report/achievement helpers
19. **Goals + achievements**: 12 deterministic goals, 4 achievements, health score — gamification done right
20. **Studio profile redesign**: Trust score ring + verification badge + company/brand/press kit all in one place

---

## TOP 20 WEAKNESSES

1. ❌ **CRITICAL — Test suite not green**: 2 test files fail, 45 skipped, 2 unhandled errors. STATUS.md claims "258 pass, 0 failures" — this is false. Fix: ~30min
2. ❌ **CRITICAL — In-memory feed pagination**: `feed.service.ts` fetches ALL matching items and `.slice()` in memory. Unbounded memory usage as data grows. Fix: add `skip`/`take` to Prisma queries. Estimate: 2h
3. ❌ **CRITICAL — No dynamic SEO metadata**: ALL content pages are `'use client'`. Game pages, studio pages, devlog pages — zero dynamic OG/title/description. Search engines see only root layout's generic tags. Fix: significant refactor or server component wrapper pattern. Estimate: 4h
4. ❌ **CRITICAL — MEMBER can delete devlogs**: `devlogs.service.ts:317` allows `StudioRole.MEMBER` to delete. Documentation claims only MOD+ can. Fix: 5min
5. ⚠️ **HIGH — No account/notification settings pages**: Only `/settings/profile` exists. Missing: `/settings/account` (delete account, email change) and `/settings/notifications` (preferences). Fix: 3h
6. ⚠️ **HIGH — CSRF cookie maxAge mismatch**: Frontend sets 1-day cookie expiry. Backend validates up to 7 days. Tokens become unusable after 1 day. Fix: 5min
7. ⚠️ **HIGH — Analytics N+1**: `getStudioStats` runs separate query per game. `runDailyAggregation` runs separate query per event group. Fix: 1h
8. ⚠️ **HIGH — Roadmap events missing studioId**: `remove()` and `reorder()` in `RoadmapItemsController` emit events without `studioId`, causing `GoalsService.progress()` to crash silently. Fix: 15min
9. ⚠️ **MEDIUM — Documentation inaccuracies**: STATUS.md claims "Testing score 85/100" and "shared-DB flakiness resolved". Neither is true. Also claims "4 pre-existing lint errors" (actual: 49 warnings, 0 errors). Fix: 30min
10. ⚠️ **MEDIUM — In-memory EventBus**: `event-bus.ts` uses RxJS Subject — events lost on server restart. SSE clients must reconnect. Fix: add persistence layer. Estimate: 4h
11. ⚠️ **MEDIUM — Dual event system**: Some modules emit through `EventBus`, others through `FeedEngineService`. Confusing pattern with no documentation. Fix: 2h
12. ⚠️ **MEDIUM — Duplicate press kit modules**: `press-kits/` (game-level) and `press-kit/` (studio-level) with different schemas. Confusing naming. Fix: 30min
13. ⚠️ **MEDIUM — No custom exception filter**: Error responses may be inconsistent (no global format). Fix: 1h
14. ⚠️ **MEDIUM — Dead adminOnly test endpoint**: `auth.controller.ts:71-77` — exposes admin check endpoint. Should be removed or gated. Fix: 5min
15. ⚠️ **MEDIUM — Race condition in onboarding**: `AuthService.completeOnboarding` has TOCTOU on username uniqueness. Two concurrent requests could both pass `findFirst`. Fix: 30min
16. ⚠️ **MEDIUM — GamesService business logic before auth check**: Lines 260-287 run business logic before `assertStudioAccess()` on line 287. Fix: 5min
17. ⚠️ **MEDIUM — No staging environment**: All changes go directly to production. No preview deployments. Fix: 4h
18. ⚠️ **MEDIUM — Env vars not fully set on Railway**: `COOKIE_DOMAIN`, `VAPID_*`, `AWS_*` not configured. Production features may be broken. Fix: 30min
19. ⚠️ **LOW — robots.txt is static file**: Should be dynamic `app/robots.ts`. Fix: 15min
20. ⚠️ **LOW — Feed page hardcoded fallback image**: `/demo/games/neon-warden/hero.svg` — dev artifact. Fix: 5min

---

## CRITICAL ISSUES — REQUIRED BEFORE PHASE 1 CLOSURE

### C1: Test suite failures and errors
**Evidence:** `pnpm --filter @playmorrow/api test` output shows 2 FAILED test files, 45 skipped tests, 2 unhandled errors.
**Fix:** Add `vi.setConfig({ hookTimeout: 30000 })` to `notifications.controller.spec.ts` and `reactions.controller.spec.ts`. Add `studioId` to `roadmap_updated` events in `RoadmapItemsController.remove()` and `reorder()`.
**Severity:** Critical — test suite must be green before Phase 1 certification.

### C2: In-memory feed pagination
**Evidence:** `apps/api/src/feed/feed.service.ts:159-161,246-248` — `items.slice(page * pageSize, (page + 1) * pageSize)` fetches ALL rows then slices.
**Fix:** Replace `findMany()` with `findMany({ skip: page * pageSize, take: pageSize })`.
**Severity:** Critical — production scalability blocker. 10,000 feed events = 10,000 items loaded in memory per request.

### C3: No dynamic SEO metadata
**Evidence:** Game page (`games/[slug]/page.tsx`), studio page, devlog page, feed page — all are `'use client'` with no `metadata` export.
**Fix:** Create server component wrappers that fetch data and render page-specific `<head>` metadata. Or extract metadata into `generateMetadata()` functions.
**Severity:** Critical — search engines cannot index any content page. This is a business blocker for any discovery platform.

### C4: MEMBER role can delete devlogs
**Evidence:** `apps/api/src/devlogs/devlogs.service.ts:317` — `[StudioRole.MEMBER]` is in the allowed roles array for `delete()`.
**Fix:** Remove `StudioRole.MEMBER` from the delete permission array, keep only `OWNER`, `ADMIN`, `MODERATOR`.
**Severity:** Critical — contradicts documented authorization model. MEMBER users can delete any devlog in their studio.

---

## MEDIUM ISSUES (Fix Before Phase 2)

- M1: No account/notification settings pages
- M2: CSRF cookie maxAge mismatch (1d vs 7d)
- M3: Analytics N+1 in getStudioStats and runDailyAggregation
- M4: Documentation inaccuracies in STATUS.md
- M5: In-memory EventBus (events lost on restart)
- M6: Dual event system (EventBus vs FeedEngine)
- M7: Duplicate press kit modules (press-kits/ vs press-kit/)
- M8: No custom exception filter
- M9: Dead adminOnly test endpoint
- M10: Race condition in onboarding username check
- M11: GamesService business logic before auth check

---

## PHASE 1 VALIDATION

### Is Phase 1 complete? **NO**

**Required fixes to certify Phase 1:**
1. Fix C1 — Test suite hook timeouts and event bugs (30min)
2. Fix C2 — Feed pagination to use DB skip/take (2h)
3. Fix C3 — Dynamic SEO metadata for content pages (4h)
4. Fix C4 — Remove MEMBER from devlog delete permissions (5min)
5. Fix M2 — CSRF cookie maxAge alignment (5min)
6. Fix M4 — Correct STATUS.md inaccuracies (30min)
7. Fix M9 — Remove dead adminOnly endpoint (5min)

**Estimated total: ~8 hours of engineering time.**

Until these 7 items are resolved, Phase 1 cannot be certified as complete. The platform has excellent security, solid architecture, and genuine breadth — but the test suite, SEO, feed pagination, and authorization model have concrete issues that would be identified in any professional code review.

---

## PHASE 2 EXECUTION PLAN

*This section is provided conditionally. The 7 blockers above must be resolved before Phase 2 begins.*

### Milestone 5 — Discovery Platform & Recommendation Engine
**Priority:** HIGH
**Estimated complexity:** 3-4 weeks (1-2 engineers)

**Sub-phases:**
1. **Recommendation Engine** (1 week)
   - Tag-based collaborative filtering
   - Follow-based recommendations
   - Trending algorithm (weighted by follows + reactions + wishlists in time window)
   - Feed integration for personalized suggestions

2. **Discovery Homepage Redesign** (1 week)
   - Curated sections: "Trending", "Recently Updated", "Popular Devlogs", "New Studios"
   - Personalized "For You" section based on follows + wishlist
   - Server components for dynamic OG metadata (fixes C3)

3. **Advanced Search** (3 days)
   - Full-text search with Prisma `search` capability
   - Filters: genre, status, platform, tag, release window
   - Sort: relevance, popularity, newest, most wishlisted

4. **Trending Games Curation** (2 days)
   - Manual curation panel for MOD+ roles
   - Featured games slot on homepage
   - "Rising Star" algorithm for new studios with engagement velocity

**Dependencies:** Must fix C3 (SEO) before or alongside this milestone. Feed pagination (C2) should also be fixed.

### Milestone 6 — Playtests Platform
**Priority:** MEDIUM
**Estimated complexity:** 4-6 weeks (1-2 engineers)

**Sub-phases:**
1. **Demo Upload System** (1.5 weeks)
   - Secure file upload with size limits (2GB max)
   - Platform-specific packaging (Windows/Mac/Linux)
   - Build note field for testers
   - Version management

2. **Playtest Scheduling** (1 week)
   - Date window + participant cap
   - Application workflow (apply, approve, reject)
   - Auto-notifications on schedule changes
   - Calendar integration (optional)

3. **Feedback Collection** (1.5 weeks)
   - Structured feedback form (rating, categories, free text)
   - Bug report template with screenshot attachment
   - Session recording opt-in (optional)
   - Aggregated feedback dashboard for studios

4. **Tester Management** (1 week)
   - Tester reputation system (completion rate, quality score)
   - NDA acceptance flow (upload + digital signature)
   - Tester leaderboard and achievements

**Dependencies:** Milestone 5 must be stable. Upload system must be production-ready.

### Milestone 7 — Community Platform
**Priority:** MEDIUM-HIGH
**Estimated complexity:** 3-5 weeks (1-2 engineers)

**Sub-phases:**
1. **Forums / Game-specific Discussion Boards** (1.5 weeks)
   - Per-game discussion boards
   - Thread creation with categories
   - Pinning, locking, moderation tools
   - Notifications for thread replies

2. **User Profiles 2.0** (1 week)
   - Public profile page (games played, wishlist, comments, devlog reactions)
   - Activity feed on profile
   - Bio, links, game collection
   - Profile customization (banner, theme)

3. **Direct Messaging** (1.5 weeks)
   - One-on-one messaging between users
   - Read receipts
   - Block/mute controls
   - Rate limiting to prevent spam

4. **Community Events** (1 week)
   - Studio-hosted events (game jams, screenshot contests, Q&A sessions)
   - Calendar view
   - Participant RSVP
   - Event notifications

**Dependencies:** Fix C3 (SEO) first. Notifications system (already built) is a dependency for DMs and forum replies.

---

## Strategic Recommendations

1. **Fix the 7 blockers before anything else.** Test suite reliability is non-negotiable for professional development. SEO is non-negotiable for a discovery platform.

2. **Add a dedicated test database.** The shared Neon DB dependency is the root cause of flaky tests and CI unreliability. A Neon branch or local PostgreSQL instance for tests would resolve this completely.

3. **Implement staging environment.** Railway supports preview deployments. Configure a staging project that mirrors production. Push to `main` should deploy to staging first, then promote to production after manual verification.

4. **Document the Event Bus vs FeedEngine duality.** Choose one pattern and migrate all modules to it. The dual system will create maintenance confusion as the team grows.

5. **Invest in accessibility before public launch.** WCAG AA compliance is increasingly a legal requirement and improves SEO. Target 90+ Lighthouse accessibility score.

6. **Plan for the in-memory Event Bus limitation.** At minimum, document that events are ephemeral. For production, consider Redis pub/sub or a message queue (RabbitMQ, SQS) for event persistence.

7. **Hire for the gaps.** The codebase needs someone strong on: (a) Next.js App Router patterns (server components, metadata), (b) NestJS testing best practices, (c) DevOps (Railway, Docker, CI/CD), (d) Accessibility.
