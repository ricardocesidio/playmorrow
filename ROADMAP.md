# Playmorrow — Enterprise Readiness Roadmap

**URGENT BLOCKER — COPY-PASTE CHECKLIST (do this first)**

This item has been HIGH and unexecuted across Sessions 9–13. **Root cause now fully identified:**

The production version deploys from `main` branch, which has OLD code in `apps/api/src/email/email.service.ts:56-58`:
```typescript
} else {
  throw new Error('Email provider not configured. Set RESEND_API_KEY.');
}
```

The fix (swallowing the error gracefully so registration succeeds without email sending) exists on the `session-11-ci-trigger` branch but was **never merged to main**. Two things are needed: (A) deploy the fixed code, AND (B) set RESEND_API_KEY for actual email delivery.

**Checklist:**

**(A) Deploy the fixed code (registration will succeed even without RESEND_API_KEY):**

Option 1 — Merge & deploy from main (recommended):
```
git checkout main && git merge session-11-ci-trigger && git push origin main
```
(Railway auto-deploys from main. Wait ~2 min.)

Option 2 — Deploy current branch directly:
```
cd /path/to/playmorrow && railway up --detach
```
(Deploys from session-11-ci-trigger's code.)

**(B) Set environment variables (pick one):**

Option 1 — Railway CLI (already authenticated as Ricardo Cesídio):
```
railway variable set RESEND_API_KEY="re_YOUR_REAL_RESEND_PROD_KEY"
```

Option 2 — Railway Dashboard:
1. Open https://railway.app/project/gentle-grace
2. Select "playmorrow-api" service → "Variables" tab
3. Add `RESEND_API_KEY` with your real Resend production API key
4. Click "Deploy" (Railway will auto-redeploy)

**(C) Verify:**
```
curl -s -X POST "https://playmorrow-api-production.up.railway.app/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke-'$(date +%s)'@example.com","password":"Test1234!@#","acceptedTerms":true,"acceptedPrivacy":true}'
```
Expected: HTTP 201 with `{"requiresEmailVerification":true,...}`

**Current env var status on Railway (verified 2026-07-10 via CLI):**
- ✅ `SESSION_SECRET` — set
- ✅ `JWT_SECRET` — set
- ✅ `WEB_ORIGIN` — set to `https://playmorrow.vercel.app`
- ✅ `NODE_ENV` — set to `production`
- ✅ `DATABASE_URL` — set
- ✅ `CSRF_SECRET` — set (was missing, now set via CLI in Session 13)
- ❌ `RESEND_API_KEY` — **still missing** (needs your Resend key)
- ❌ `COOKIE_DOMAIN` — not set (may cause session issues in prod; set to `.vercel.app`)

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

## Summary

| Item | Estimate | Why It Matters Now |
|------|----------|-------------------|
| 1. Fix registration 500 | 2–4h | **Blocks all new signups** |
| 2. Env var audit | 1h | Unknown state blocks multiple features |
| 3. Browser login test | 0.5h | Last mile of production qualification |
| 4. CI gating | 2–3h | Prevents regressions reaching production |
| 5. Test DB | 4–6h | Enables 193 regression tests |
| 6. Nested comments E2E | 1–2h | Validate existing feature |
| 7. Sentry | 4–6h | Blind without it (current 500 proves this) |
| 8. Structured logging | 2–3h | Debugging production requires it |
| 9. Staging env | 4–8h | Risk management for DB changes |
| 10. Uptime monitoring | 0.5h | Zero cost, high value |
| 11. GDPR compliance | 6–10h | Legal requirement if EU users exist |
| 12. Data safety | 2–4h | Fundamental platform responsibility |
| 13. Accessibility | 2–3h | Legal + ethical baseline |
| 14. Payments evaluation | 0.5h UI / 20h+ full | UI currently misleading |
| 15. Load testing | 4–6h | Know ceiling before hitting it |
| **Total** | **~35–67 hours** | |

**Immediate priorities (next session):** Items 1-3 (production functionality), then Item 7 (Sentry, since the 500 shows you're blind).

**One-week sprint (40h):** Items 1-3 (6h) + Item 7 (6h) + Item 4 (3h) + Item 5 (6h) + Item 6 (2h) + Item 8 (3h) + Item 10 (0.5h) + Item 14 UI fix (0.5h) ≈ 27h.

---

## Items Merged from Professionalization Audit (Session 12) — Re-tiered

These were identified in the Session 12 audit and consolidated here as the single source of truth. Re-tiered by **actual current blocking impact** and history of deferral. Items open across 3+ sessions are explicitly flagged.

### Repeatedly Deferred HIGH (open since Session 9/10, re-documented 11 & 12 without execution)

- **1. Fix production registration (500 error)** — See top checklist. **Repeatedly deferred.**

### New / Specific Items (added from Session 12 audit)

**Legal & Compliance (HIGH — concrete, not generic)**

- Get the existing Terms of Service and Privacy Policy drafts legally reviewed. Remove the "Draft: This is a draft..." banners from both pages once reviewed. (Previously buried under generic "GDPR compliance".)

**Repository & Process Hygiene (MEDIUM)**

- Add `CONTRIBUTING.md`
- Add `SECURITY.md` (vulnerability reporting process)
- Add `CODE_OF_CONDUCT.md`
- Add Dependabot or Renovate config for dependency updates
- Add `CHANGELOG.md` or formal release process notes
- Document API versioning strategy (or confirm none needed)
- Publish/version Swagger docs (currently only available at /docs on running instance)

**Other Gaps (LOW/MEDIUM)**

- Add feature flag mechanism (or document why none is needed)
- Achievements/XP subsystem exists in code (AchievementController, PlayerXpService, schema, frontend hooks/UI) but was missing from prior STATUS.md feature inventories — documented in STATUS now.

See `docs/handoff/session-12.md` (plan section superseded by this document).
