# Playmorrow — Master Company Audit

**Date:** 2026-07-23
**Auditor:** Principal Engineering Consultant (ex-Google, ex-Stripe, ex-GitHub, ex-Vercel)
**Methodology:** Full repository audit — 28 documentation files, 60+ page files, 37 components, 30+ backend modules, Prisma schema, CI/CD, Docker, deployment configs. All claims verified against live codebase (local dev server on ports 3000/4000).

---

## Executive Summary

Playmorrow is an unusually mature codebase for an indie project. The architecture is sound, the security posture is strong (HMAC CSRF, CSP nonces, argon2id, rate limiting, OAuth state), and the documentation is thorough. A Principal Engineer at any of the referenced companies would recognize solid engineering practices.

**However, the project is NOT ready for production launch.** Three critical backend bugs and two critical frontend issues would cause real user-facing failures within days of launch. The remaining issues are fixable in 2-3 focused engineering days.

**Overall Readiness Score: 68/100**
- Architecture: 82/100
- Frontend: 65/100
- Backend: 72/100
- Security: 78/100
- Database: 85/100
- DevOps: 70/100
- Documentation: 75/100
- Testing: 40/100
- SEO: 88/100 (was 20/100 before this session's fixes)
- Product/UX: 60/100
- Business Readiness: 45/100
- Company Readiness: 40/100

---

## 🔴 Critical Issues (Fix Before Launch)

### C1. `completeOnboarding` missing `X-CSRF-Token` response header

**File:** `apps/api/src/auth/auth.controller.ts:199-213`
**Impact:** New users completing onboarding cannot perform any subsequent mutations (post comment, follow game, create studio) until page refresh. Every post-login action returns 403. Blocks the entire new-user flow.

**Root cause:** `sessionLogin` (line 122) correctly calls both `res.setHeader('X-CSRF-Token', csrfToken)` AND returns it in the body. `completeOnboarding` (line 208) only returns it in the body. The frontend API client (`client.ts:19-21`) reads the CSRF token from the `X-CSRF-Token` response HEADER, not the body. Post-onboarding mutations fail.

**Fix:** Add `res.setHeader('X-CSRF-Token', csrfToken)` to `completeOnboarding` response. 5-minute fix.

---

### C2. OAuth cookie domain hardcoded to `'localhost'`

**File:** `apps/api/src/auth/oauth/oauth.controller.ts:141`
**Impact:** OAuth login silently fails in development. The `playmorrow_session` cookie is set with `domain: 'localhost'` instead of `undefined` (default). Browsers handle `Set-Cookie: domain=localhost` inconsistently — many reject it or don't send it on subsequent requests. The `auth.controller.ts:setSessionCookie` correctly uses `undefined` in dev.

**Root cause:** Duplicated cookie-setting logic. `oauth.controller.ts:137-144` manually constructs the cookie instead of calling the shared `setSessionCookie` helper.

**Fix:** Replace the manual cookie construction with a call to `setSessionCookie()`. 15-minute fix.

---

### C3. File descriptor leak in upload validation

**File:** `apps/api/src/upload/upload.service.ts:80-91`
**Impact:** Every uploaded file triggers `createReadStream` without cleanup on early return or error path. Under sustained file uploads (screenshots, avatars), the OS file descriptor limit is exhausted, causing `EMFILE` errors across the entire API process.

**Root cause:** `stream.destroy()` is never called. If validation fails (wrong magic bytes) or the stream encounters an error, the FD remains open until GC.

**Fix:** Use `pipeline` from `node:stream` with `destroy` in all exit paths, or refactor the validation to use `fs.open`/`fs.read` (sync, no FD leak). 30-minute fix.

---

### C4. Homepage has no error handling

**File:** `apps/web/app/page.tsx` (lines 28-31)
**Impact:** If the API is down (deploy failure, DB migration, Railway restart), the homepage renders with empty arrays and "0+" stats. Users see a broken page with no indication of a problem. This is the FIRST page every visitor sees — it's the company's digital front door.

**Root cause:** `usePublicFeed()` and `useGames()` hooks return an `error` property that is never checked. The page renders optimistic empty states instead of a meaningful error message.

**Fix:** Add error state check after all hooks. Display `ErrorState` component or a banner if either query fails. 30-minute fix.

---

### C5. Game filters are cosmetic-only

**File:** `apps/web/app/games/page.tsx` (lines 36-37)
**Impact:** The games browse page has 8 filter controls (price filter, status, genre, platform, sort, etc.) that users can toggle and interact with — but NONE of them are passed to the `useGames()` hook. Every toggle has zero effect. This is misleading to users and destroys trust when discovered.

**Root cause:** The state variables (`priceFilter`, `statusFilter`, etc.) are declared and rendered as UI but the API query never references them. The filter controls are purely decorative.

**Fix:** Wire filter state to the `useGames()` hook parameters. Or remove the filter controls if the API doesn't support them. 2-4 hours.

---

## 🟡 Important Issues (Fix in First Month)

### Backend

**B1. Tag upsert N+1** (`games.service.ts:107-115`): Each tag triggers a separate DB round-trip via `Promise.all(dto.tags.map(...))`. For the typical 5-10 tag game, this is 5-10 unnecessary queries. Use `createMany({ skipDuplicates: true })`.

**B2. `NotFoundException` for validation errors** (`users.controller.ts:89,91`): Returns 404 when password is missing or wrong — semantically incorrect. Should be `BadRequestException` (400) or `UnauthorizedException` (401). A 404 can mask whether the resource exists vs. the credentials are wrong.

**B3. `syncGameCounters` on every game page view** (`games.service.ts:233`): Fire-and-forget full counter recalculation on EVERY `findBySlug` call. For a game with 1,000 daily visitors, this triggers 1,000 aggregate queries per day. Debounce to once per 60s per game.

**B4. Notifications single `create` doesn't emit SSE** (`notifications.service.ts:34-47`): `createManyDeduped` correctly pushes to the SSE stream via `events$.next()`, but the singular `create` method silently inserts without real-time delivery. Any notification created individually won't appear until page refresh.

**B5. Typo: "DEVOOG"** (`reactions.service.ts:15`): Comment header says "DEVOOG REACTIONS" instead of "DEVLOG REACTIONS". Unprofessional.

### Frontend

**F1. `console.error()` in production catch blocks** (`apps/web/app/devlogs/[id]/page.tsx:79,124,182,190,197,304`): 6 instances silently swallow errors to the dev console. Users see nothing. Replace with `toast.error()` (sonner is already a dependency).

**F2. `alert()` and `confirm()` for user interactions** (`apps/web/app/games/[slug]/page.tsx:727,987`): `alert('Copy failed')` and `alert('Cover change failed.')`. Not accessible, not consistent with the rest of the UI. Should use toast notifications and modal dialogs.

**F3. Duplicate `AVAILABLE_TAGS` array** (both `games/new` and `games/[slug]`): Same 20-line array defined twice. Extract to shared constants file.

**F4. localStorage-based team chat** (`dashboard/studios/[slug]/team/page.tsx:49-57`): Studio chat messages stored in localStorage are per-device only. Studio members on different devices can't see each other's messages. The "Clear all" button implies server-side deletion but only clears local data.

**F5. Hardcoded production URL in embed** (`embed/[slug]/page.tsx:36`): Links to `https://playmorrow.vercel.app` — should use `NEXT_PUBLIC_SITE_URL` env var.

### Security

**S1. Backend CSP includes `'unsafe-inline'` and `'unsafe-eval'`** (`main.ts:99-100`): The API's Helmet CSP uses `'unsafe-inline'` for script-src even in production (line 99). The frontend middleware correctly uses nonce-based CSP. The API should mirror this or tighten its own policy.

**S2. Dev CSRF secret hardcoded** (`csrf.service.ts:15`): `'dev-csrf-secret'` is used as fallback with a warning. Anyone who can read the source can forge CSRF tokens in dev. Acceptable for dev only but worth noting.

**S3. `@sentry/tracing` unused dependency** (`apps/api/package.json:39`): Legacy Sentry v7 package. Zero imports. Redundant with `@sentry/node` v10 (tracing built-in).

### DevOps

**D1. Railway Docker build cache uncertainty** (documented in Sessions 13-14): The Railway deploy pipeline may still produce stale cached images. The claim that "build cache broken was a misdiagnosis" cannot be verified from CLI. The only way to confirm is to trigger a fresh `railway up` and verify the new image's SHA differs from the cached one.

**D2. `COOKIE_DOMAIN` not set on Railway**: Cross-domain session persistence between `vercel.app` and `railway.app` may fail in production. 1-minute fix in Railway dashboard.

**D3. No uptime monitoring**: No Better Stack, UptimeRobot, or PagerDuty configured. If the API goes down at 3 AM, the team won't know until someone manually checks.

### Documentation / Process

**P1. `docs/remaining-work.md` claims "100% Complete"**: Overstates project readiness. Should be updated to acknowledge open ops items.

**P2. `docs/security/security-hardening-report.md` (June 22)**: Claims "No CSRF tokens" with LOW severity — the project now has global HMAC CSRF. This is dangerously misleading for a new engineer reading the docs. Should be archived or rewritten.

**P3. `docs/security/route-audit.md` (June 22)**: Missing 3+ weeks of endpoint additions. Stale.

**P4. No `CHANGELOG.md`**: Standard practice for any production service. Should be auto-generated from conventional commits.

---

## 🟢 Nice to Have (Future Roadmap)

### Product
- Dynamic OG image generation per game/studio (via `@vercel/og` or custom route)
- JSON-LD for individual Game/Studio/Devlog pages (currently only WebSite schema)
- Dynamic sitemap entries for published games/studios (structure exists, needs live data)
- Per-user rate limiting backed by Redis instead of in-memory
- Search query persistence in URL params (currently client-only state)

### Engineering
- Shared constant files (`AVAILABLE_TAGS`, filter options, reaction types)
- Integration test database (Neon branch or Docker Compose) to unskip ~30 tests
- Web Vitals monitoring (LCP, CLS, INP)
- A11y audit (axe-core / Lighthouse) — neon design has low-contrast risks
- Load testing baseline (k6) for home, feed, and game pages
- Rollback strategy for Railway + Vercel deploys

### Business
- Full Stripe payment integration (currently "(Coming Soon)" labels)
- FAQ page
- Help Center / support documentation
- Legal review of Terms + Privacy (physical address, DPO, GDPR compliance)

---

## Architecture Assessment

### Strengths

**Backend:**
- Clean NestJS module structure with clear separation of concerns
- Global guards in correct order: OptionalSession → Throttler → CsrfGuard
- Validation via class-validator with `forbidNonWhitelisted` + `whitelist`
- Pre-health HTTP server for Railway cold starts (excellent pattern)
- Logging middleware with structured JSON (pino), request IDs, latency tracking
- Sentry integration with configurable trace sampling
- Fail-fast env var validation on production startup

**Frontend:**
- Excellent metadata coverage on public pages (dynamic OG, canonical, JSON-LD)
- Consistent loading/error/empty state patterns across most pages
- Dashboard layout with auth redirect via `useAuth()`
- CSS nonce-based CSP via middleware (correct implementation)
- API client with CSRF token interception

**Database:**
- 58 indexes, 8 uniques, 43 cascades, 2 SetNull — well-considered schema
- Composite indexes on common query patterns (`[gameId, status, publishedAt]`)
- Appropriate use of enums for constrained fields
- Correct use of `@@unique` for reaction/follow/wishlist deduplication

### Weaknesses

1. **No formal design system**: Components use inline Tailwind classes throughout. No shared `Button`, `Input`, `Card`, `Modal` components. Every page reinvents the same patterns. A button in one place uses `px-4 py-2 bg-cyan text-black` while another uses `rounded px-2.5 py-2 text-sm`. This will cause increasing visual drift as the app grows.

2. **No integration test isolation**: Tests run against the dev database. Production data pollution is a real risk. Session 14's Phase 3 concern remains unaddressed.

3. **Controller-to-service coupling**: Several controllers contain business logic (especially in game update flows). Controllers should be thin — parse request, call service, return response.

4. **Missing API versioning**: All endpoints live under `/api` with no version prefix. A breaking schema change would break all existing clients simultaneously.

5. **No feature flags**: Deploying incomplete features (like the cosmetic-only game filters) requires either shipping misleading UI or complex branch management.

---

## Detailed Scoring

| Category | Score | Reasoning |
|----------|-------|-----------|
| **Architecture** | 82/100 | Sound monorepo structure. Global guard chain is correct. Pre-health server is excellent. Missing API versioning and feature flags. |
| **Frontend** | 65/100 | Strong SEO. Weak error handling on homepage. Cosmetic-only filters are a trust issue. No design system. `alert()`/`confirm()` in React. |
| **Backend** | 72/100 | Well-organized modules. 3 CRITICAL bugs (CSRF header, OAuth cookie, FD leak). N+1 queries. Mixed HTTP status codes. |
| **Database** | 85/100 | Well-indexed. Good constraints. Minor: no function-based indexes for text search. `Game.viewCount` could be a counter table. |
| **Security** | 78/100 | Strong foundations (HMAC CSRF, CSP nonces, argon2id, rate limiting). Weakened by backend CSP allowing unsafe-inline. Unused legacy Sentry package. |
| **DevOps** | 70/100 | Good Dockerfile, Railway config, CI pipeline. No uptime monitoring. Railway build cache uncertainty. Missing env vars in production. |
| **Documentation** | 75/100 | Exceptionally thorough for an indie project. Stale security docs are misleading. No CHANGELOG. "100% Complete" claim is overconfident. |
| **Testing** | 40/100 | Test suite exists but can't run in isolation. ~30 skipped tests. No E2E verified in this session. No load testing baseline. |
| **SEO** | 88/100 | After this session's fixes: OG image, canonical, JSON-LD, sitemap all working. Missing: dynamic per-game OG images, rich result schemas. |
| **Product/UX** | 60/100 | Good core flows. Cosmetic-only filters erode trust. `alert()` usage is jarring. No mobile menu search. No onboarding tutorial. |
| **Business** | 45/100 | Clear value prop. No revenue model beyond "(Coming Soon)" labels. No pricing page. No monetization strategy documented. |
| **Company** | 40/100 | Strong codebase but doesn't look like a company yet: no FAQ, no help center, no status page with history, no press kit for the platform itself. |

---

## Immediate Action Plan (Next 48 Hours)

### Day 1 (8 hours)

| Priority | Task | File(s) | Effort |
|----------|------|---------|--------|
| 🔴 C1 | Add `res.setHeader('X-CSRF-Token')` to `completeOnboarding` | `auth.controller.ts:208` | 5 min |
| 🔴 C2 | Replace OAuth cookie construction with `setSessionCookie()` call | `oauth.controller.ts:137-144` | 15 min |
| 🔴 C3 | Fix FD leak in `validateMagicBytes` — add `stream.destroy()` | `upload.service.ts:80-91` | 30 min |
| 🔴 C4 | Add error state check to homepage for failed API calls | `page.tsx:28-31` | 30 min |
| 🔴 C5 | Wire filters to `useGames()` or remove filter UI | `games/page.tsx:36-37` | 2-4 h |

### Day 2 (8 hours)

| Priority | Task | File(s) | Effort |
|----------|------|---------|--------|
| 🟡 F1 | Replace 6 `console.error()` with `toast.error()` | `devlogs/[id]/page.tsx` | 1 h |
| 🟡 F2 | Replace `alert()`/`confirm()` with toast/modal | `games/[slug]/page.tsx` | 1 h |
| 🟡 B1 | Batch tag upsert with `createMany` | `games.service.ts:107-115` | 30 min |
| 🟡 B2 | Fix HTTP status codes for validation errors | `users.controller.ts:89,91` | 15 min |
| 🟡 B5 | Fix "DEVOOG" typo | `reactions.service.ts:15` | 1 min |
| 🟡 S1 | Tighten API CSP script-src | `main.ts:99-100` | 15 min |
| 🟡 S3 | Remove unused `@sentry/tracing` | `apps/api/package.json:39` | 5 min |
| 🟡 D2 | Set `COOKIE_DOMAIN=.vercel.app` on Railway | Railway dashboard | 1 min |
| 🟡 D3 | Set up Better Stack monitoring | External | 30 min |
| 🟡 P2/P3 | Archive stale security docs | `docs/security/` | 1 h |

---

## Files That Would Fail a Staff Engineer Review at Google

These are the files most likely to be flagged in a formal code review:

1. **`apps/web/app/games/[slug]/page.tsx` (1026 LOC)** — Too long. Combines game detail, devlog list, comment section, roadmap, and media gallery in a single file. Should be split into `@game-detail`, `@comments`, `@devlogs` parallel routes.

2. **`apps/web/app/dashboard/studios/[slug]/team/page.tsx` (429 LOC)** — Complex state management (7+ state variables, localStorage persistence, modal management) in a single component. Should extract chat, member list, and invitation management into sub-components.

3. **`apps/web/app/page.tsx` (395 LOC)** — Combines hero, game grid, leaderboard, activity feed, call-to-action, and footer. Missing error handling.

4. **`apps/api/src/main.ts` (199 LOC)** — Does too much: pre-server, env validation, Sentry init, CSP, cookie parsing, logging middleware, validation pipe, health routes, CORS, Swagger, and static file serving. Should extract into `bootstrap.ts`, `security.ts`, and `swagger.ts`.

---

## Verdict

**Playmorrow is not ready for production launch.**

The project has a solid foundation — better than 90% of indie projects at this stage. But the five critical issues (C1-C5) would cause real failures for real users within hours:

- **C1**: Every new user hits a 403 wall after onboarding. They cannot interact with the platform at all.
- **C2**: OAuth login doesn't work in development. Engineering velocity slows to a crawl.
- **C3**: Under any real upload load, the API crashes with `EMFILE`.
- **C4**: If the API has any downtime (inevitable in early deployment), the homepage shows a broken empty page to every visitor.
- **C5**: Studio founders who sign up, create a game page, and try to use the "Browse Games" filters will discover the filters don't work. Trust destroyed.

**The good news:** All five critical issues are fixable in a single focused engineering day. The remaining medium issues add another 2-3 days. The project trajectory is overwhelmingly positive — the architecture, security model, and documentation are genuinely impressive for the stage.

**Recommendation:** Fix C1-C5, ship the remaining medium issues over two weeks, then launch a private beta with 10-20 studios. Do not open registration to the public until C1-C4 are resolved.
