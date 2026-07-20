# Playmorrow — Enterprise Readiness Roadmap

✅ **Most items from previous audits RESOLVED in Session 13 (2026-07-10)**

See AGENTS.md (Session 13 table) and STATUS.md ("Still Remaining") for the current authoritative list.

**Major items completed/verified in Session 13:**
- `COOKIE_DOMAIN` and `SENTRY_DSN` set on Railway
- Dashboard restructure + 3 new pages (`/devlogs`, `/media`, `/achievements`)
- Login redirect fixed (`/games` → `/dashboard`)
- DOMPurify on devlog detail page
- GitHub branch protection enabled
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` created
- Nested comments bug fixed (frontend tree structure)
- Production smoke test — all green
- Many previous "open" items (auth guards, dead links, legal pages, repo files, price labels, etc.) verified as already done or completed

**Only ops/deferred items remain** (no code changes):
- Test DB (Neon branch)
- Staging environment
- Uptime monitoring
- GDPR legal review
- Data safety / disaster recovery docs
- A11y audit
- Load testing
- Full payments (Stripe) — "(Coming Soon)" labels are in place

**Note on Railway:** Docker build cache issues were worked around in prior sessions using `deploymentRedeploy`. Env vars for CSRF, Sentry, cookie domain, Resend etc. have been set.

---

## The 6-Phase Plan (from Session 13 audit)

See [`docs/handoff/session-13.md`](docs/handoff/session-13.md) for the complete audit and Claude AI super prompt. The project now has a comprehensive plan covering:

- **Phase 1:** Foundation Fixes — login redirect, dead links, auth guards, "Join as studio" fix
- **Phase 2:** Devlog → Notícias (Blog System) — 5/page pagination, blog layout
- **Phase 3:** Dashboard Restructure — player/studio separation, fix navigation
- **Phase 4:** Model Games & Page Polish — 5 showcase games, homepage, game pages
- **Phase 5:** Security Hardening — OAuth state, CSRF expiry, CSP, DOMPurify, middleware
- **Phase 6:** Production Readiness — Railway cache, legal pages, Sentry, CI gating (may cause session issues in prod; set to `.vercel.app`)

**Full browser walkthrough (after registration is fixed):**

1. Open https://playmorrow.vercel.app in fresh incognito.
2. Go to /register, create account with real email → should succeed or require verification.
3. Verify email (6-digit code via Resend or DB).
4. Log in.
5. Navigate to home, a game page, feed, dashboard.
6. Hard refresh pages — session must persist.
7. Perform mutations: follow a game, post a comment, create wishlist item.
8. Publish a devlog (if studio role), comment on it, confirm appears in feed.
9. Log out — session cleared, protected routes deny.
10. Record exact results (screenshots or curl + browser notes) here.

---

Items from the production-hardening audit (Session 10, 2026-07-09) that could not be completed during the session. Each includes an honest size estimate and dependencies. **Session 12 items merged and re-tiered below.**

---

## Tier 1 — Blocking Production Functionality (HIGH)

### 1. Fix production registration (500 error)

**Estimate:** 2–4 hours from start
**Dependency:** Railway dashboard access

`POST /api/auth/register` returns HTTP 500 on the live Railway instance. Root cause is unknown — likely one of:
- Missing `SESSION_SECRET` env var (session creation fails after user creation)
- Missing `JWT_SECRET` env var (token generation fails)
- DB migration gap (Prisma schema doesn't match production DB)

**Actions:**
1. Check Railway logs for error stack trace
2. Verify env vars on Railway dashboard
3. Run `npx prisma migrate deploy` if schema is out of sync
4. Fix whatever the root cause is and redeploy

---

### 2. Production env var audit

**Estimate:** 1 hour
**Dependency:** Vercel + Railway dashboard access

Set and verify every required env var on both platforms:

**Vercel:**
- `API_URL` → `https://playmorrow-api-production.up.railway.app/api`
- `NEXT_PUBLIC_API_URL` → `/api`
- `NEXT_PUBLIC_SITE_URL` → `https://playmorrow.vercel.app`

**Railway:**
- `WEB_ORIGIN` → `https://playmorrow.vercel.app`
- `COOKIE_DOMAIN` → `.vercel.app`
- `CSRF_SECRET` → strong random hex (64+ chars)
- `SESSION_SECRET` → must match what's in local `.env`
- `JWT_SECRET` → must match what's in local `.env`
- `NODE_ENV` → `production`
- `DATABASE_URL` → Neon connection string

**Evidence:** After setting, run the smoke test from STATUS.md and paste real Set-Cookie output.

---

### 3. Full browser login verification

**Estimate:** 30 minutes
**Dependency:** Items 1+2 resolved

After registration works and env vars are correct:
1. Open `https://playmorrow.vercel.app` in browser
2. Register a new account
3. Verify email (check Resend inbox or use DB bypass)
4. Log in
5. Navigate to 3 different pages
6. Reload the page — confirm session persists
7. Log out — confirm session cookie is cleared

---

## Tier 2 — Platform Reliability (MEDIUM)

### 4. CI gating

**Estimate:** 2–3 hours

Configure branch protection on GitHub:
1. Require the test job to pass before merge to `main`
2. Require lint + typecheck to pass
3. Verify by pushing a deliberately broken PR

---

### 5. Integration test database

**Estimate:** 4–6 hours

(The number of skipped files/tests has improved on the session-11-ci-trigger branch — see Phase 0 paragraph in STATUS.md. A dedicated test DB is still recommended for reliable CI runs of all suites.) Options:
- **(Recommended)** Spin up a free Neon branch for testing — `TEST_DATABASE_URL` env var
- **(Alternative)** Docker Compose with local PostgreSQL for CI

After setup:
1. Create a test runner that runs `prisma db push` on the test DB before tests
2. Un-skip all 11 test files
3. Fix any assertion mismatches exposed by the clean DB
4. Verify all 260 tests pass

---

### 6. Nested comments end-to-end verification

**Estimate:** 1–2 hours

The backend has the recursive Prisma include (3 levels). The frontend has the `replies` prop. But this has never been tested with actual data.

**Actions:**
1. Write a seed script that creates a comment chain 4 levels deep
2. Hit the GET comments endpoint
3. Verify the JSON has nested `replies` at all 4 levels
4. Check the frontend renders all 4 levels in the UI
5. If level 4 doesn't render, increase the Prisma include depth or add a recursive CTE

---

### 7. Error tracking (Sentry)

**Estimate:** 4–6 hours
**Dependency:** Sentry account

- `POST /api/auth/register` returning 500 with zero visibility is exactly the problem Sentry solves.

**Frontend (`apps/web`):**
```bash
npm install @sentry/nextjs
npx sentry-wizard -i nextjs
```

**Backend (`apps/api`):**
```bash
npm install @sentry/node
```

Configure with `SENTRY_DSN` env vars. Attach request context (user ID, URL, latency) to each event. Verify by triggering a deliberate error and checking Sentry dashboard.

---

### 8. Structured logging

**Estimate:** 2–3 hours

Replace ad-hoc `console.log` with structured JSON logging:
- Install `pino` + `pino-pretty` (dev) on the API
- Create a NestJS logger that outputs JSON with: `timestamp`, `level`, `message`, `requestId`, `userId`, `latencyMs`, `path`
- Wire into NestJS's `Logger` abstraction

---

## Tier 3 — Production Hardening (LOW)

### 9. Staging environment

**Estimate:** 4–8 hours

Create isolated preview environments so schema changes aren't tested first in production.

**Railway:** Can clone the existing project into a `staging` environment with its own DB.
**Vercel:** Preview deployments are free — link a `staging` branch.

**Minimum viable:** Document the process (not automated) — "to test a risky migration, create a staging branch, deploy to Railway preview env, run migration, verify, then merge to main."

---

### 10. Uptime monitoring

**Estimate:** 30 minutes

Free tier options:
- **Better Stack (formerly Better Uptime):** Free 3-minute interval checks
- **UptimeRobot:** Free 5-minute interval checks
- **Railway built-in:** Health check at `/health`

Monitor both:
- `https://playmorrow.vercel.app` (frontend)
- `https://playmorrow-api-production.up.railway.app/health` (API)

Configure alert to email/slack/Discord.

---

### 11. GDPR / legal compliance

**Estimate:** 6–10 hours

**Required for EU users (Portugal is plausible):**
- **Terms of Service page** — write or import from template. Currently the repo only states "All Rights Reserved" (license note, not ToS).
- **Privacy Policy page** — must disclose: what data is collected (email, name, avatar, game activity), how it's stored (Neon PostgreSQL), third-party processors (Resend for email, Neon for DB, Vercel/Railway for hosting, GitHub/Google for OAuth), data retention period, and user rights (access, rectification, erasure).
- **Account deletion flow** — verify the existing `DELETE /users/me` endpoint actually removes or anonymizes personal data from all tables (comments, reactions, devlogs, studios, etc.).
- **Cookie consent** — verify the existing banner actually blocks non-essential cookies (analytics, marketing) until consent, and stores the preference for 6 months.

---

### 12. Data safety / disaster recovery

**Estimate:** 2–4 hours

1. Log into Neon dashboard
2. Check backup/point-in-time recovery settings (Neon has automatic PITR)
3. Document the actual recovery window
4. Perform a test restore to a new branch
5. Document the restore procedure in `ARCHITECTURE.md` or similar

---

### 13. Accessibility audit

**Estimate:** 2–3 hours

Run `axe-core` or Lighthouse on:
- Homepage — check color contrast (neon design system is a likely offender)
- Game page — check heading hierarchy, keyboard navigation
- Devlog editor — check form labels, ARIA attributes
- Login/register pages
- Studio dashboard

Fix everything below baseline. Prioritize: color contrast, keyboard navigation, screen reader labels.

---

### 14. Payment processor evaluation

**Estimate:** 2 hours (research), 20+ hours (implementation)

Games display prices ($19.99, $24.99, etc.) but no payment processor exists in the stack.

**Options:**
- **Real purchase flow:** Integrate Stripe. Requires: Stripe account, webhook handling, order system, refund flow, tax calculation. Likely 2-3 weeks.
- **Clear labeling:** Change UI to show "(Coming Soon)" next to prices, or make the price field explicitly "Planned price" to not mislead users. This is the right call for now since there's no payment infra.
- **Wishlist-only:** Remove prices entirely and just show "Add to Wishlist" (current behavior). Document that prices are placeholders.

**Recommendation:** Adopt option 2 (clear labeling) immediately — this is a 30-minute CSS change. Option 1 when scaling justifies the investment.

---

### 15. Load testing

**Estimate:** 4–6 hours

Run k6 or autocannon against the API:
- `GET /api/games` (read-heavy for homepage)
- `GET /api/feed` (read-heavy for feed)
- `GET /api/devlogs/:id` (read-heavy for detail pages)
- `POST /api/auth/session/login` (auth, rate-limited)

Establish current ceiling (rps, p95 latency). Document in STATUS.md so future optimizations have a baseline to compare against.

---

## Summary — Post Session 13

**The vast majority of items from the original 15-item + Session 12 audit list are now complete or verified.**

**Only pure ops / non-code items remain** (see full details in STATUS.md):

- Test DB for integration tests (Neon branch)
- Staging environment (Railway clone)
- Uptime monitoring (Better Stack / UptimeRobot)
- GDPR legal review
- Data safety / disaster recovery documentation
- Accessibility audit (axe-core / Lighthouse)
- Load testing baseline (k6)
- Full payments / Stripe (only "(Coming Soon)" labels needed for now)

All previous code, security, auth, dashboard, devlog, and documentation items have been resolved.

See:
- AGENTS.md → Session 13 for the complete "Done This Session" table
- STATUS.md → "Still Remaining (ops / deferred)" for the current list

**No large hour estimate remains for core functionality.** Focus is now on operational maturity items.

---

## Items from Professionalization Audit (Session 12)

Most items from the Session 12 audit have been resolved or verified as complete during Session 13.

See:
- AGENTS.md (Session 13 table) for what was done/verified
- STATUS.md for the current "Still Remaining (ops/deferred)" list

The original detailed audit is preserved in `docs/handoff/session-12.md` and `docs/handoff/session-13.md`.

Repository hygiene items (CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md) are now created. Dependabot was added (per user's summary). 

All core code and security items from the audit are considered complete.
