# PLAYMORROW — COMPLETE PROJECT HANDOFF FOR CLAUDE (Session 14, corrected priority order)

You are now the lead developer of Playmorrow, a platform for indie game studios and players. Read this entire document before starting any work. This supersedes the phase ordering in `docs/handoff/session-13.md` — that plan put deploy-pipeline and access-control fixes *after* three phases of UX/feature work, which is backwards when the deploy pipeline may be broken and admin pages are publicly accessible right now. Severity determines order here, not discovery order.

---

## PROJECT IDENTITY

Playmorrow is a platform where indie game studios post updates about their games ("devlogs"/blog posts) and players discover games, wishlist them, follow studios, and engage with the community.

**Current state:** Registration was just fixed via an env-var-only redeploy (old Docker image, new env vars). Whether the actual code from the last several sessions (CSRF hardening, test fixes) is running in the live container is **unverified** — this is the first thing to check.

**Tech stack:** Next.js 15 (app router) + React 19 + Tailwind CSS v4 + TanStack Query (frontend), NestJS REST API on port 4000 (backend, Railway), PostgreSQL via Neon + Prisma ORM, pnpm monorepo.

---

## PHASE 0 — VERIFY WHAT'S ACTUALLY RUNNING (do this before anything else)

1. Check the currently deployed image digest on Railway and compare it against the latest commit on `main`. If `usePreviousImageTag: true` was used, the running container is almost certainly older than `main`. Confirm this explicitly — don't assume either way.
2. If the running code predates Session 11's CSRF hardening, **every security claim in `STATUS.md` about production is currently unverified for the live environment**, even if true for the `main` branch. Say so plainly.
3. Diagnose the actual Railway build cache problem: is it a Docker layer caching issue, a Nixpacks/Railpack builder problem, or a `turbo` remote-cache issue leaking into the Railway build? Try, in order: (a) bump a cache-busting value (e.g. a comment or version bump in a file guaranteed to be in every build's context) and trigger a normal build, (b) check Railway's build logs for "cache hit" on layers that should have changed, (c) try disabling any `turbo.json` remote caching for the Railway build command specifically, (d) as a last resort, delete and recreate the Railway service. Do not treat `deploymentRedeploy(usePreviousImageTag: true)` as an acceptable long-term deploy mechanism — it cannot ship code changes, only config changes.
4. Once real builds work again, do one clean deploy from current `main` and re-verify registration, login, and CSRF still work against the *actually current* code.

**Nothing below this line can be trusted as "in production" until Phase 0 confirms the deploy pipeline ships real code.**

---

## PHASE 1 — ACCESS CONTROL (real data exposure, fix today)

Six dashboard routes have no auth guard and are reachable by anyone:
`/dashboard/level`, `/dashboard/reports`, `/dashboard/reports/[id]`, `/dashboard/games`, `/dashboard/studios/level`, `/dashboard/studios/[slug]/team`.

1. Add `dashboard/layout.tsx` with a single centralized auth check (redirect to `/login` if unauthenticated) instead of repeating the check per page — this is both the fix and the thing that prevents this exact bug from recurring on the next new page.
2. Verify each of the six routes actually redirects unauthenticated visitors after the fix — test with a logged-out browser session, not just by reading the code.
3. Gate Swagger docs (`/docs`) behind `NODE_ENV !== 'production'` — API schema exposure in prod is a reconnaissance gift to attackers.

---

## PHASE 2 — CSRF & OAUTH CORRECTNESS (the coverage was verified before; correctness wasn't)

1. **CSRF token expiry:** `CsrfService.validateToken()` currently ignores the embedded timestamp. Add expiry validation (a stolen/leaked token should not be valid indefinitely — pick a reasonable window, e.g. matching session lifetime, and reject anything older).
2. **OAuth CSRF `state` parameter:** add and validate `state` in both `github.strategy.ts` and `google.strategy.ts` per the standard OAuth2 CSRF mitigation.
3. **OAuth callback CSRF cookie:** `oauth.controller.ts` needs to generate and set the `playmorrow_csrf` cookie after a successful OAuth login, the same way the password-login path does — right now, anyone who logs in via OAuth silently can't perform any mutation afterward (403 on every POST) until they happen to trigger a token refresh some other way. This is both a security gap and a functional bug.
4. Test all three login paths end-to-end after these fixes: email/password form, JS API client login, and OAuth — confirm a `playmorrow_csrf` cookie exists and a subsequent POST (e.g. posting a comment) succeeds for each.

---

## PHASE 3 — PRODUCTION DATA INTEGRITY

Production shows 35 games against a documented demo set of 5 — almost certainly test-run pollution from integration tests that run against the real Neon database instead of an isolated test database.

1. Query production for games/studios/users that don't match the known 5 demo studios and inspect a sample — confirm they're test artifacts (look for `Date.now()`-suffixed slugs/emails per the Session 11 test pattern) rather than real user signups.
2. If confirmed, clean up the test-generated records — but first check whether any of them are real user signups that arrived after registration started working, and don't delete those.
3. **Root-cause fix, not just cleanup:** stand up an actual isolated test database (a Neon branch, or local Postgres in CI) so integration tests stop running against production data. This has been recommended since Session 10 and never done — it's why this pollution happened in the first place.
4. Only after this is clean, proceed to creating the 5 polished model games from the original Phase 4 plan — there's no point building "5 great model games" into a database that already has 30 untracked test artifacts muddying every listing page.

---

## PHASE 4 — SECURITY HARDENING (the rest of the original Phase 5)

1. Wrap devlog Markdown rendering with explicit DOMPurify — don't rely on `@uiw/react-md-editor`'s own escaping as the only line of defense; sanitize at render time regardless of what sanitization happened at write time.
2. Add server-side HTML sanitization on devlog body at write time too (defense in depth — sanitize on the way in AND the way out).
3. Add Next.js `middleware.ts` with real security headers (CSP, HSTS, X-Frame-Options) — currently frontend has no equivalent to the API's Helmet config.
4. Remove `'unsafe-eval'` from the API's CSP — find what actually needs it (likely a dev-only dependency) and scope the exception to development only, not global.
5. Fix `SameSite=None` cookie strategy — understand *why* it's cross-origin (Vercel + Railway are different origins) and evaluate whether a proxy/rewrite setup could get back to `SameSite=Lax`, which is meaningfully safer. If cross-origin is unavoidable, document why explicitly rather than leaving it as an unexplained gap.
6. Fix `completeOnboarding`'s `Record<string, unknown>` input to a proper validated DTO.

---

## PHASE 5 — UX & DEAD LINK CLEANUP (from original Phase 1 + 3, demoted — real but not urgent)

1. Fix "Join as a studio" showing to authenticated users (`apps/web/app/page.tsx`).
2. Fix dashboard dead links: duplicate "Team" entry, `/dashboard/studios` 404, "Media Library"/"Settings" pointing to the same page, fake "Recently Viewed"/"Library"/"Playtests", self-referencing "Achievements" link, hardcoded "View all 5" and "Playtests Active: 0".
3. Convert dashboard top bar `<a>` tags to Next.js `<Link>`.
4. Fix login redirect target (`/games` → `/dashboard`).
5. Standardize level paths (`/dashboard/level` vs `/dashboard/studios/level`).
6. Decide on one UI language (the app currently mixes Portuguese "Notícias"/"Jogos" with English elsewhere) and apply it consistently — pick one before building more UI, not after.

---

## PHASE 6 — DEVLOG/BLOG POLISH & MODEL DATA (from original Phase 2 + 4)

Only after Phases 0-3 are done and the database is clean:

1. Add pagination to game devlogs listing (5 per page).
2. Redesign `/games/[slug]/devlogs` as a blog/news feed layout.
3. Show latest 3 devlogs on game detail page in blog-card format.
4. Verify `games.service.ts` actually includes devlogs + screenshots in the detail response (session-13 flagged this as previously empty in production — re-verify against the Phase 0-confirmed current code).
5. Build the 5 polished model games with real screenshots, platforms, tags.
6. Polish game detail, studio, and homepage UI per original Phase 4 notes.

---

## PHASE 7 — REPO & PROCESS HYGIENE (from original Phase 6, minus the deploy-cache item which moved to Phase 0)

1. Set `COOKIE_DOMAIN=.vercel.app` on Railway (still outstanding).
2. Fix legal pages — remove the draft banner only after actual legal review, not before.
3. Add `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`.
4. Configure Sentry DSN in production — this has been "installed but not configured" for multiple sessions; finish it.
5. Add CI gating (test failures block merge) — verify the real current test count first (Phase 0-adjacent — check whether Session 11's unskip actually merged and is reflected in `STATUS.md`, which was an open contradiction as of Session 12).
6. Add Dependabot/Renovate config.
7. Drop the orphan `coverUrl` column from `devlogs` (still pending from Session 9).

---

## KEY FILES

| Area | Paths |
|------|-------|
| Auth | `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/auth.service.ts`, `apps/api/src/auth/guards/session-auth.guard.ts`, `apps/api/src/auth/oauth/oauth.controller.ts`, `apps/api/src/auth/oauth/strategies/github.strategy.ts`, `apps/api/src/auth/oauth/strategies/google.strategy.ts` |
| CSRF | `apps/api/src/common/csrf.service.ts`, `apps/api/src/common/csrf.guard.ts`, `apps/web/lib/api/client.ts`, `apps/web/app/api/auth/form-login/route.ts` |
| Dashboard | `apps/web/app/dashboard/page.tsx`, `apps/web/components/dashboard/PlayerDashboard.tsx`, `apps/web/components/dashboard/StudioDashboard.tsx` |
| Devlog | `apps/api/src/devlogs/devlogs.service.ts`, `apps/web/app/games/[slug]/devlogs/page.tsx`, `apps/web/app/devlogs/[id]/page.tsx` |
| Games | `apps/api/src/games/games.service.ts`, `apps/web/app/games/[slug]/page.tsx`, `apps/web/app/page.tsx` |
| Security | `apps/api/src/main.ts`, `apps/web/next.config.ts`, `apps/web/lib/api/auth-context.tsx` |
| Config | `turbo.json`, `apps/api/Dockerfile`, `apps/web/next.config.ts` |

---

## SECURITY RULES — NEVER VIOLATE

1. Never commit `.env` files or secrets.
2. Never expose user data (emails, IPs) unhashed/untruncated in logs or responses.
3. Always use parameterized queries — Prisma only, no raw SQL with user input.
4. Always validate file uploads server-side (MIME, magic bytes, size, dimensions).
5. Always sanitize user-generated HTML — both at write time and render time.
6. Always use httpOnly + secure cookies for session tokens.
7. Never trust the client — validate every input server-side.
8. Always rate-limit sensitive endpoints.
9. Never store plaintext passwords.
10. Always check authorization at the resource level (not just "logged in," but "owns or has a role on *this* resource").

---

## GROUND RULE FOR THIS SESSION

Every "fixed" claim needs the same standard this project has been trying to hold itself to since Session 9: the command or test that proves it, not a description of what should now work. Phase 0 exists specifically because the last session's "fixed" claim may only be true for `main`, not for what's actually running — verify before building five more phases on top of an assumption.
