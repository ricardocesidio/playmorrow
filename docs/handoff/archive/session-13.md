# Session 13 — The Great Refactor: Production Fix, Full Audit, and Claude Super Prompt

**Date:** 2026-07-10
**Focus:** Fixed production registration 500 via Railway API. Performed comprehensive audit of auth, dashboards, routing, security, and UX. Created a complete handoff + super prompt for Claude AI to continue the work.

---

## Summary

Production registration was blocked by two issues: `RESEND_API_KEY` missing from the runtime environment, and the old code throwing an uncaught error when email sending failed. Fixed via Railway GraphQL API `deploymentRedeploy(id, usePreviousImageTag: true)` to restart the old working image with new env vars. However, the **Docker build cache is broken on Railway** — all builds produce the same cached image digest `sha256:979115f7b45c18bbc2218ac028cd89f1123822dde2612f0a84791801248d4bc1` regardless of code changes.

A full audit of auth routes, dashboard structure, security, game pages, and devlog system was performed to produce this comprehensive handoff.

---

## The Vision (Playmorrow)

Playmorrow is a platform where **indie game studios** post updates about their games (devlogs → "notícias"/blog posts) and **players** discover games, make wishlists, follow studios, and engage with the community. Every indie company should have their page here. Every player should have their wishlist and feed of studios they follow.

The project is currently a "solid public beta." The goal is to reach **professional / production-ready** — real users, real data, polished UX, bulletproof security.

---

## What Has Been Fixed

| Issue | Status | How |
|-------|--------|-----|
| Registration 500 in production | ✅ FIXED | `RESEND_API_KEY` set on Railway + `deploymentRedeploy` via Railway API |
| `session-11-ci-trigger` not merged | ✅ MERGED | Fast-forward merged to `main` (44 commits with CSRF, tests, fixes) |
| `COOKIE_DOMAIN` not set | ❌ STILL MISSING | Needs `.vercel.app` |
| Railway Docker build cache | ❌ BROKEN | All builds produce cached digest. Workaround: use Railway API `deploymentRedeploy` |

---

## Full Audit Results

### 1. Auth / Login System

**Login routes verified (production):**

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/auth/register` | ✅ 201 | Registration works with `acceptedTerms` + `acceptedPrivacy` required |
| `POST /api/auth/session/login` | ✅ Works | Returns "EMAIL_NOT_VERIFIED" for unverified users (correct) |
| `POST /api/auth/session/me` | ✅ Works | Returns user profile when authenticated |
| `GET /api/games` | ✅ Works | Returns 35 games with pagination |
| `GET /health` | ✅ 200 | Database + email provider checks |

**Critical issues found:**

- **OAuth lacks CSRF `state` parameter** — No state validation in Google/GitHub OAuth. An attacker could craft a callback URL. Files: `github.strategy.ts:15-39`, `google.strategy.ts:16-40`
- **OAuth callback does NOT generate CSRF token** — After OAuth login, the frontend has no `playmorrow_csrf` cookie. All subsequent POST requests will fail with 403. File: `oauth.controller.ts:73-80`
- **CSRF token never expires** — `CsrfService.validateToken()` at `csrf.service.ts:24-38` does NOT check the embedded timestamp. A leaked token is valid forever.
- **"Remember me" checkbox is cosmetic** — The checkbox on `/login` at `login/page.tsx:120-123` does nothing. There's no backend logic for persistent vs session-only login.
- **`SameSite=None` in production** — Session cookie is cross-origin in prod (`auth.controller.ts:26`), expanding CSRF attack surface.

**Login flow (how it works):**
1. User fills form at `/login` → submits to `POST /api/auth/form-login` (Next.js server route)
2. Server route forwards to `POST /api/auth/session/login` on backend
3. Backend validates credentials, checks lockout, checks email verification
4. Creates 32-byte session token, stores SHA-256 hash in DB
5. Sets `playmorrow_session` httpOnly cookie + generates CSRF token
6. Server route captures cookie + sets `playmorrow_csrf` non-httpOnly cookie for JS
7. AuthProvider hydrates by calling `GET /auth/session/me`

There are three login paths: (A) Email/password via form (primary, server route), (B) Email/password via JS API client, (C) OAuth (Google/GitHub).

### 2. Dashboard Structure

**All 16 dashboard routes:**

| Route | Purpose | Issues |
|-------|---------|--------|
| `/dashboard` | Root dispatcher → PlayerDashboard or StudioDashboard | Login redirects to `/games`, not `/dashboard` |
| `/dashboard/feed` | Personal feed | "Studio Analytics" links here but it's feed, not analytics |
| `/dashboard/level` | Player XP system | **No auth guard** — any visitor can see |
| `/dashboard/notifications` | Notification center | OK |
| `/dashboard/roadmap` | Roadmap CRUD | Studio only |
| `/dashboard/reports` | Admin reports | **No auth guard** — any visitor can see |
| `/dashboard/reports/[id]` | Report detail | **No auth guard** |
| `/dashboard/games` | My games listing | **No auth guard** — returns null but no redirect |
| `/dashboard/games/new` | Create game | OK |
| `/dashboard/games/[slug]` | Edit game | OK |
| `/dashboard/games/[slug]/press-kit` | Press kit | OK |
| `/dashboard/devlogs/new` | Create devlog | OK |
| `/dashboard/devlogs/[id]` | Edit devlog | OK |
| `/dashboard/studios/level` | Studio XP | **No auth guard** |
| `/dashboard/studios/[slug]` | Edit studio | OK |
| `/dashboard/studios/[slug]/team` | Team management | **No auth guard** |

**Dead links found:**
1. `/dashboard/studios` is a dead link at `dashboard/page.tsx:60` — **404s**. The actual route is `/dashboard/studios/[slug]`.
2. "Team" appears **TWICE** in StudioDashboard sidebar (`StudioDashboard.tsx:275,278`).
3. "Media Library" and "Settings" point to the **same** edit-studio page (`StudioDashboard.tsx:276,280`).
4. "Playtests" links to `/feed` but feed shows devlog/roadmap updates, not playtests.
5. "Recently Viewed" and "Library" are fake features (both go to `/games`).
6. "Achievements" sidebar link points to `/dashboard` (self-referencing).
7. "Followers" in studio sidebar goes to public `/studios` listing.
8. "Devlogs" sidebar links to create form (not a listing page).
9. No dedicated devlogs listing page exists.
10. "Studio Analytics" quick action goes to personal feed page.
11. Hardcoded "View all 5" text at `PlayerDashboard.tsx:516`.
12. "Playtests Active" stat hardcoded to `0` at `StudioDashboard.tsx:154`.

**Architecture issues:**
- **No `dashboard/layout.tsx`** — Auth check is repeated in every single page (fragile).
- Dashboard top bar uses `<a>` tags instead of Next.js `<Link>` — causes full page reloads.
- Login redirects to `/games`, not `/dashboard` — users land on public games page after login.
- Inconsistent level paths: `/dashboard/level` (player) vs `/dashboard/studios/level` (studio).

### 3. "Join as a Studio" Appears When Logged In

**File: `apps/web/app/page.tsx:68-71`** — The homepage hero has:
```tsx
<Link href="/register" ...>
  <UserPlus className="size-5" /> Join as a studio
</Link>
```

This button is ALWAYS shown, even to authenticated users. It should be hidden or replaced with "Go to Dashboard" when the user is logged in.

Also in **`site-header.tsx:201-206`**: "Share your game" button links to `/register` when not authenticated. When authenticated as STUDIO, shows "Studio Dashboard". When authenticated as PLAYER, shows `/dashboard/games/new`. This is partially correct but inconsistent.

### 4. Devlog/Notícias System

Devlogs should become **"notícias" (news/blog posts)** for games. Each post should have:
- Game title
- Photos/screenshots
- The devlog body
- 5 posts per page, with pagination (past 5 → next page)

**Current state:**
- `/games/[slug]/devlogs` — exists but loads all devlogs at once (no pagination)
- `/devlogs/[id]` — detail page works
- The editor at `/dashboard/devlogs/new` and `/dashboard/devlogs/[id]` works

**What needs to change:**
- Game devlogs listing needs pagination (5 per page)
- The UI should look like a blog/news feed, not a list
- Game detail page (`/games/[slug]`) should show the latest 3 devlogs in a blog-like format

### 5. Security Hardening Needed

**Already implemented (strong):**
- ✅ Global CsrfGuard (HMAC-SHA256) covering all mutating endpoints
- ✅ Session-based auth (httpOnly, secure, SHA-256 hashed tokens)
- ✅ Rate limiting (60/min global, per-route overrides)
- ✅ Input validation (class-validator whitelist + forbidNonWhitelisted)
- ✅ Helmet + CSP headers on API
- ✅ Argon2 password hashing
- ✅ Account lockout after 5 failed attempts
- ✅ File upload validation (MIME, magic bytes, dimensions, 20MB)
- ✅ Password policy (8+ chars, special char, common password blocklist)
- ✅ Prisma ORM (no SQL injection surface)

**Critical gaps:**
- ❌ **OAuth CSRF**: No `state` parameter in Google/GitHub OAuth (`github.strategy.ts:15-39`, `google.strategy.ts:16-40`)
- ❌ **OAuth missing CSRF token**: OAuth callback at `oauth.controller.ts:73` doesn't generate `playmorrow_csrf` cookie
- ❌ **CSRF token never expires server-side**: `CsrfService.validateToken()` ignores timestamp
- ❌ **Devlog body rendered without explicit DOMPurify**: `devlogs/[id]/page.tsx:429` uses `@uiw/react-md-editor` Markdown component
- ❌ **No Next.js security headers**: No `middleware.ts`, no `headers()` in `next.config.ts`
- ❌ **CSP with `'unsafe-eval'`**: `main.ts:81` weakens XSS protection
- ❌ **No server-side HTML sanitization**: Markdown stored as-is, no sanitize-html
- ❌ **Uploaded files publicly accessible**: No access control on `/api/uploads/*`
- ❌ **Swagger docs exposed in production**: `main.ts:153` always enables `/docs`
- ❌ **`SameSite=None` in production**: Session cookie cross-origin

### 6. Security Rules (NEVER violated)

When working on the codebase, enforce these rules:
1. **NEVER commit `.env` files or secrets** — use `.env.example` only
2. **NEVER expose user data** — emails, passwords, IPs must be hashed/truncated
3. **ALWAYS use parameterized queries** — Prisma ORM, never raw SQL with user input
4. **ALWAYS validate file uploads** — whitelist MIME types, magic bytes, size limits
5. **ALWAYS sanitize user-generated HTML** — DOMPurify on all rendered markdown
6. **ALWAYS use httpOnly + secure cookies** for session tokens
7. **NEVER trust the client** — validate every input server-side
8. **ALWAYS rate-limit sensitive endpoints** — auth, upload, comments
9. **NEVER store plaintext passwords** — Argon2 only
10. **ALWAYS check authorization** — RBAC + studio-level permissions

---

## The Plan: 6 Giant Phases

### Phase 1: Foundation Fixes (1-2 days)

1. **Fix "Join as a studio" appearing when logged in**
   - `apps/web/app/page.tsx:68-71`: Wrap in `if (user)` check → show "Dashboard" instead
   - `apps/web/components/site-header.tsx`: Review and standardize auth-conditional rendering

2. **Fix all dashboard dead links**
   - Remove duplicate "Team" in StudioDashboard sidebar
   - Add `/dashboard/devlogs` listing page (redirect from `/dashboard/devlogs/new` to listing)
   - Fix "Media Library" and "Settings" to point to different pages
   - Fix "Followers" to link to actual followers management
   - Fix "Playtests" to link to actual playtests (or remove)
   - Fix "Recently Viewed" and "Library" (implement or remove)
   - Fix "Achievements" sidebar to point to real page
   - Fix hardcoded "View all 5" to use actual count

3. **Add `dashboard/layout.tsx`**
   - Centralize auth check instead of repeating per page
   - Add consistent sidebar/navigation

4. **Fix login redirect**
   - Change `/login` redirect from `/games` to `/dashboard`

5. **Add missing auth guards**
   - `/dashboard/level`
   - `/dashboard/reports`
   - `/dashboard/reports/[id]`
   - `/dashboard/games`
   - `/dashboard/studios/level`
   - `/dashboard/studios/[slug]/team`

### Phase 2: Devlog → Notícias (Blog System) (2-3 days)

1. **Rename concept to "Notícias" (News/Blog Posts)**
   - Each post has: game title, featured image, screenshots gallery, body text
   - Blog-style layout with featured image at top

2. **Add pagination (5 per page)**
   - Backend: add `page` and `pageSize` query params to devlogs endpoint
   - Frontend: add "Load more" or page navigation
   - Default: 5 per page

3. **Redesign game devlogs listing (`/games/[slug]/devlogs`)**
   - Blog feed layout, not a list
   - Featured image + title + excerpt + date
   - Pagination at bottom

4. **Update game detail page (`/games/[slug]`)**
   - Show latest 3 devlogs in blog card format
   - "View all devlogs" link

5. **Verify game detail page shows devlogs**
   - In production, game detail was returning empty devlogs/roadmap. Check `games.service.ts` includes.

### Phase 3: Dashboard Restructure (2-3 days)

1. **Player Dashboard redesign**
   - Remove fake features (Recently Viewed, Library, Playtests)
   - Fix sidebar to link to real pages
   - Add: My Wishlist, My Following, Achievements, Settings

2. **Studio Dashboard redesign**
   - Fix duplicate "Team" entry
   - Separate "Media Library" and "Settings"
   - "Followers" → real followers management page
   - "Devlogs" → listing page (not create form)
   - "Studio Analytics" → real analytics or inline data

3. **Standardize navigation**
   - Dashboard top bar uses `<Link>` instead of `<a>`
   - Consistent level paths (both Player + Studio under `/dashboard/level`)

4. **Create missing pages**
   - `/dashboard/devlogs` — devlog listing for the studio
   - `/dashboard/followers` — followers management
   - `/dashboard/media` — media library
   - `/dashboard/achievements` — achievements page

### Phase 4: Model Games & Page Polish (2-3 days)

1. **Create 5 fake model games**
   - Each with: title, subtitle, description, screenshots (3-5), tags, platforms, studio
   - Diverse genres to showcase the platform

2. **Polish game detail page**
   - Blog-style devlogs section
   - Screenshots gallery (lightbox)
   - Studio info + link
   - Tags + platforms + release date
   - Wishlist/follow buttons
   - Comments section

3. **Polish studios page**
   - Studio profile with banner, logo, description
   - List of games by the studio
   - Follow/unfollow button
   - Contact/social links

4. **Polish homepage**
   - Featured games carousel
   - Latest devlogs feed
   - Popular studios
   - "Join as a studio" → hidden when logged in

### Phase 5: Security Hardening (2-3 days)

1. **Fix OAuth CSRF** — Add `state` parameter to Google + GitHub OAuth strategies
2. **Fix OAuth CSRF token** — Generate `playmorrow_csrf` cookie after OAuth callback
3. **Add CSRF token expiry** — Validate timestamp in `CsrfService.validateToken()`
4. **Add DOMPurify to devlog rendering** — Wrap `@uiw/react-md-editor` Markdown with DOMPurify
5. **Add Next.js middleware with security headers** — CSP, HSTS, X-Frame-Options
6. **Remove `'unsafe-eval'` from CSP** — Find alternative for Next.js
7. **Add server-side HTML sanitization** — `sanitize-html` on devlog body before storage
8. **Gate Swagger docs behind NODE_ENV check** — Only enable in development
9. **Fix `SameSite=None` issue** — Review cross-origin cookie strategy
10. **Fix `completeOnboarding` input validation** — Add proper DTO instead of `Record<string, unknown>`

### Phase 6: Production Readiness (2-3 days)

1. **Fix Railway Docker build cache** — Investigate Railway builder snapshot caching. Try: (a) deleting `node_modules/.cache/turbo` before build, (b) using `--no-cache` equivalent, (c) contacting Railway support, (d) creating new service
2. **Set `COOKIE_DOMAIN=.vercel.app`** on Railway
3. **Fix legal pages** — Terms + Privacy are still drafts with banner "Draft: This is a draft. Legal review is required before production."
4. **Add `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`**
5. **Configure Sentry DSN** for error tracking
6. **Add CI gating** — Test failures should block merge to main
7. **Add Dependabot/Renovate** for automated dependency updates
8. **Fix `coverUrl` clean migration** — Drop orphan column from `devlogs` table
9. **Create `middleware.ts`** on frontend for auth + redirects
10. **Enable CSP reporting** (`report-uri` / `report-to`)

---

## Key Files for Claude to Analyze

These are the most important files. DO NOT send all of them — select the relevant ones per phase.

### Architecture & State
```
STATUS.md                          → Current project state, all features
ROADMAP.md                         → Prioritized roadmap with estimates
docs/handoff/session-13.md         → THIS FILE — full audit + plan
packages/database/prisma/schema.prisma → Full database schema
turbo.json                         → Build orchestration
apps/web/next.config.ts            → Frontend configuration
```

### Auth (Foundation)
```
apps/api/src/auth/auth.controller.ts       → All auth endpoints
apps/api/src/auth/auth.service.ts           → Auth business logic
apps/api/src/auth/dto/login.dto.ts          → Login DTO
apps/api/src/auth/dto/register.dto.ts       → Register DTO
apps/api/src/auth/guards/session-auth.guard.ts  → Session guard
apps/api/src/auth/oauth/oauth.controller.ts → OAuth endpoints
apps/api/src/auth/oauth/strategies/github.strategy.ts
apps/api/src/auth/oauth/strategies/google.strategy.ts
apps/api/src/session/session.service.ts     → Session management
apps/web/app/api/auth/form-login/route.ts   → Server-side login proxy
apps/web/lib/api/auth-context.tsx           → Auth state provider
apps/web/app/login/page.tsx                 → Login page
apps/web/app/register/page.tsx              → Register page
```

### Security
```
apps/api/src/common/csrf.service.ts     → HMAC CSRF token
apps/api/src/common/csrf.guard.ts       → Global CSRF guard
apps/api/src/app.module.ts              → Guard wiring (line 76-84)
apps/api/src/main.ts                    → Helmet CSP config (line 76-92)
apps/api/src/common/custom-throttler.guard.ts → Rate limiting
apps/web/lib/api/client.ts              → CSRF token capture (line 302-322)
```

### Dashboard
```
apps/web/app/dashboard/page.tsx                    → Root dispatcher
apps/web/components/dashboard/PlayerDashboard.tsx  → Player dashboard
apps/web/components/dashboard/StudioDashboard.tsx  → Studio dashboard
apps/web/components/site-header.tsx                → Navigation + auth
```

### Devlog / Notícias
```
apps/api/src/devlogs/devlogs.service.ts        → Devlog CRUD
apps/api/src/devlogs/devlogs.controller.ts     → Devlog endpoints
apps/web/app/devlogs/[id]/page.tsx             → Devlog detail
apps/web/app/games/[slug]/devlogs/page.tsx     → Devlog listing
apps/web/app/dashboard/devlogs/new/page.tsx    → Devlog editor
apps/web/components/md-editor.tsx              → Markdown editor
```

### Game Pages
```
apps/api/src/games/games.service.ts   → Game detail + includes
apps/web/app/games/[slug]/page.tsx     → Game detail page
apps/web/app/games/[slug]/comments/page.tsx → Game comments
apps/web/app/page.tsx                  → Homepage
```

---

## Quick Wins (Can Be Done in Parallel)

These are small, independent fixes that don't require deep architecture changes:

1. **Fix "Join as a studio" on homepage** — Wrap in `if (user)` check
2. **Remove duplicate "Team" in StudioDashboard** — Delete one `<SidebarLink>`
3. **Fix dead `/dashboard/studios` link** — Change to `/dashboard/studios/[slug]` or `/dashboard/studios/level`
4. **Fix `<a>` → `<Link>` in dashboard top bar** — 6 links to convert
5. **Fix login redirect to `/dashboard`** — Change `/games` to `/dashboard` in `login/page.tsx:33`
6. **Add auth guard to unprotected pages** — 6 pages need `if (!user) redirect('/login')`
7. **Fix hardcoded "View all 5"** — Use actual data count
8. **Add `dashboard/layout.tsx`** — Centralized auth + sidebar

---

## The Claude Super Prompt

Below is the complete prompt to send to Claude AI for continuing the project:

---

```
# PLAYMOLLOW — COMPLETE PROJECT HANDOFF FOR CLAUDE

You are now the lead developer of Playmorrow, a platform for indie game studios and players. Read this entire document carefully before starting any work.

## PROJECT IDENTITY

Playmorrow is a platform where indie game studios post updates about their games ("notícias"/blog posts) and players discover games, make wishlists, follow studios, and engage with the community.

**Vision:** Every indie company has their page here. Every player has their wishlist and feed of studios they follow.

**Current state:** Solid public beta with mature architecture but several critical UX bugs, security gaps, and incomplete features.

## TECH STACK

- **Frontend:** Next.js 15 (app router) + React 19 + Tailwind CSS v4 + TanStack Query
- **Backend:** NestJS (REST API on port 4000, deployed on Railway)
- **Database:** PostgreSQL via Neon (pooler) + Prisma ORM
- **Monorepo:** pnpm workspace with `apps/web`, `apps/api`, `packages/database`
- **Auth:** Session-based (`playmorrow_session` cookie, SHA-256 hashed tokens, 7-day expiry)
- **Package manager:** pnpm
- **Dev:** `pnpm dev` (turbo runs both API + frontend)

## CRITICAL CONTEXT

1. The session-11-ci-trigger branch has been MERGED to main (44 commits including CSRF global guard, test fixes, registration error handling).
2. RESEND_API_KEY is SET on Railway (registration now works in production — verified).
3. Railway Docker build cache is BROKEN — all `railway up` and GitHub auto-deploy builds produce the same cached image. Workaround: use Railway GraphQL API `deploymentRedeploy(id, usePreviousImageTag: true)` to deploy old image with new env vars.
4. You CANNOT deploy new code via Docker build. Any code changes that require a rebuild will not reach production until the Railway cache issue is resolved.

## YOUR TASK

Analyze the project and create a detailed, step-by-step implementation plan covering ALL 6 phases below. For each task, specify:
- Exact files to modify
- What to change
- Testing approach (local: `pnpm dev`, API: `curl`)

## THE 6 PHASES

### Phase 1: Foundation Fixes (1-2 days)
1. Fix "Join as a studio" button on homepage — hide when user is authenticated
2. Fix all dashboard dead links (duplicate Team, fake Recently Viewed/Library, etc.)
3. Add `dashboard/layout.tsx` for centralized auth checking
4. Fix login redirect from `/games` to `/dashboard`
5. Add missing auth guards to 6 unprotected pages
6. Fix `<a>` tags to `<Link>` in dashboard top bar

### Phase 2: Devlog → Notícias (Blog System) (2-3 days)
1. Add pagination to game devlogs listing — 5 per page, page navigation
2. Redesign `/games/[slug]/devlogs` as a blog/news feed (featured image, title, excerpt, date)
3. Update game detail page to show latest 3 devlogs in blog card format
4. Ensure `games.service.ts` includes devlogs with screenshots in the game detail response

### Phase 3: Dashboard Restructure (2-3 days)
1. Player Dashboard: remove fake features, fix sidebar, add real links
2. Studio Dashboard: fix duplicate entries, separate real pages, add devlogs listing
3. Create missing pages: `/dashboard/devlogs`, `/dashboard/media`, `/dashboard/achievements`
4. Standardize level paths

### Phase 4: Model Games & Page Polish (2-3 days)
1. Create 5 model games via API with screenshots, platforms, studios
2. Polish game detail page UI
3. Polish studios page
4. Polish homepage (featured games, latest devlogs)
5. Fix homepage CTA to respect auth state

### Phase 5: Security Hardening (2-3 days)
1. Add `state` parameter to OAuth strategies
2. Generate CSRF token after OAuth callback
3. Add timestamp validation to CSRF token
4. Wrap devlog rendering with DOMPurify
5. Add Next.js middleware with security headers
6. Remove `'unsafe-eval'` from CSP
7. Add server-side HTML sanitization
8. Gate Swagger docs behind NODE_ENV=development
9. Fix `SameSite=None` cookie strategy
10. Fix `completeOnboarding` DTO

### Phase 6: Production Readiness (2-3 days)
1. Investigate Railway Docker build cache fix
2. Set `COOKIE_DOMAIN=.vercel.app` on Railway
3. Fix legal pages (Terms + Privacy — remove draft banner, add real content)
4. Add CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md
5. Configure Sentry DSN
6. Add CI gating (test failures block merge)
7. Add Dependabot/Renovate config
8. Drop orphan `coverUrl` column from `devlogs` table
9. Create `middleware.ts` for frontend auth + security headers
10. Enable CSP reporting

## ROUTE STRUCTURE (Complete)

### Public Routes
```
/                           → Homepage
/games                      → Games listing with filters
/games/[slug]               → Game detail
/games/[slug]/devlogs       → Devlogs/Notícias listing (needs pagination — 5/page)
/games/[slug]/comments      → Game comments
/devlogs/[id]               → Devlog/Notícia detail
/studios                    → Studios listing
/studios/[slug]             → Studio detail
/feed                       → Public feed (devlogs + roadmap updates)
/login                      → Login page
/register                   → Registration
/verify-email               → Email verification
/forgot-password            → Password reset request
/reset-password             → Password reset
/settings/profile           → Profile settings
/me/wishlist                → My wishlist
/me/following               → My following
/status                     → Placeholder page (needs real content)
/terms                      → Draft legal page
/privacy                    → Draft legal page
/onboarding                 → Onboarding wizard
/oauth/callback             → OAuth callback landing
/invite/[token]             → Studio invitation
```

### Dashboard Routes (All Under /dashboard)
```
/dashboard                          → Player or Studio dashboard
/dashboard/feed                     → Personal feed
/dashboard/level                    → Player XP (NO AUTH GUARD)
/dashboard/notifications            → Notification center
/dashboard/roadmap                  → Roadmap CRUD
/dashboard/reports                  → Admin reports (NO AUTH GUARD)
/dashboard/reports/[id]             → Report detail (NO AUTH GUARD)
/dashboard/games                    → My games (NO AUTH GUARD)
/dashboard/games/new                → Create game
/dashboard/games/[slug]             → Edit game
/dashboard/games/[slug]/press-kit   → Press kit editor
/dashboard/devlogs/new              → Create devlog
/dashboard/devlogs/[id]             → Edit devlog
/dashboard/studios/level            → Studio XP (NO AUTH GUARD)
/dashboard/studios/[slug]           → Edit studio
/dashboard/studios/[slug]/team      → Team management (NO AUTH GUARD)
```

## AUTH ROUTES (Backend API)

```
POST /api/auth/register              → Register (201)
POST /api/auth/session/login         → Login (200/401)
POST /api/auth/session/logout        → Logout (200)
GET  /api/auth/session/me            → Get current user (200/401)
POST /api/auth/verify-email          → Verify email code
POST /api/auth/resend-verification   → Resend code
POST /api/auth/forgot-password       → Request reset
POST /api/auth/reset-password        → Reset password
POST /api/auth/complete-onboarding   → Finish onboarding
GET  /api/auth/google                → Google OAuth
GET  /api/auth/google/callback       → Google callback
GET  /api/auth/github                → GitHub OAuth
GET  /api/auth/github/callback       → GitHub callback
```

## SECURITY RULES — NEVER VIOLATE

1. NEVER commit `.env` files or secrets — use `.env.example` only
2. NEVER expose user data — emails, passwords, IPs must be hashed/truncated
3. ALWAYS use parameterized queries — Prisma ORM, never raw SQL with user input
4. ALWAYS validate file uploads — whitelist MIME + magic bytes + size
5. ALWAYS sanitize user-generated HTML — DOMPurify on ALL rendered markdown
6. ALWAYS use httpOnly + secure cookies for session tokens
7. NEVER trust the client — validate every input server-side
8. ALWAYS rate-limit sensitive endpoints — auth, upload, comments
9. NEVER store plaintext passwords — Argon2 only
10. ALWAYS check authorization — RBAC + studio-level permissions

## IMPORTANT NOTES

1. The project uses Portuguese UI in some places ("Notícias", "Jogos") and English in others. Decide on a language and be consistent.
2. The Railway build cache is broken. Code changes that require a rebuild CANNOT be deployed until this is fixed.
3. The OAuth callback is missing CSRF token generation — this will break all POST requests after OAuth login.
4. Some pages have NO auth guards — unauthenticated visitors can access admin reports, team management, etc.
5. The "Remember me" checkbox on login does nothing — purely cosmetic.
6. The database has test data from multiple test runs. Clean it up before creating model games.
```

---

## How to Use This

1. Copy the entire section **"The Claude Super Prompt"** (from `---` to `---`)
2. Send it to Claude AI (claude.ai or via API)
3. Claude will analyze and create a detailed step-by-step implementation plan
4. Come back here with Claude's plan
5. We'll start implementing together, one phase at a time

## Verifying Login (Current State)

```bash
# Registration (works now)
curl -X POST "https://playmorrow-api-production.up.railway.app/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!@#","acceptedTerms":true,"acceptedPrivacy":true}'

# Login
curl -X POST "https://playmorrow-api-production.up.railway.app/api/auth/session/login" \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"test@example.com","password":"Test1234!@#"}'

# Health check
curl "https://playmorrow-api-production.up.railway.app/health"
```

---

*End of Session 13 handoff. The next session should begin by reviewing Claude's implementation plan and starting Phase 1.*
