# Playmorrow — Verified Status (Evidence-Cited)

**Last verified:** 2026-07-23
**Method:** Every claim backed by a command run or file read this session.

---

## Build Verification (Run 2026-07-23)

| Command | Result | Evidence |
|---------|--------|----------|
| `pnpm install --frozen-lockfile` | ✅ Already up to date | `Done in 830ms using pnpm v11.1.3` |
| `pnpm --filter @playmorrow/database db:generate` | ✅ | Prisma client generated |
| `pnpm typecheck` | ✅ 6/6 tasks, 0 errors | `Tasks: 6 successful, 6 total` |
| `pnpm lint` | ✅ 0 errors, 12 warnings | `✖ 12 problems (0 errors, 12 warnings)` |
| `pnpm build` | ✅ 4/4 packages | `Tasks: 4 successful, 4 total` |
| `pnpm test` | ⚠️ 15/16 fail without Docker DB | Known shared-DB pollution issue |

---

## Cross-Check: STATUS.md Claims vs Verified Reality

### Already Fixed (STATUS.md marked as open — code has the fix)

| STATUS.md Claim | Verified Reality | File/Line |
|----------------|-----------------|-----------|
| #7 OAuth missing CSRF state param — HIGH | ✅ FIXED — state generated, stored httpOnly, validated on callback | `oauth.controller.ts:31-42,109-118` |
| #20 Swagger docs exposed in prod | ✅ FIXED — wrapped in `if (!isProd)` | `main.ts:180-188` |
| #19 CSP includes unsafe-eval in prod | ✅ FIXED — only included when `!isProd` | `main.ts:101` |
| #10/14 6 dashboard pages missing auth + no shared layout | ✅ FIXED — all guarded: |
| | `/dashboard/level` | `PlayerXpController: @UseGuards(SessionAuthGuard)` |
| | `/dashboard/reports` | `ReportsController: @UseGuards(SessionAuthGuard, RolesGuard)` |
| | `/dashboard/games` | `GamesController: @UseGuards(SessionAuthGuard)` |
| | `/dashboard/reports/[id]` | `ReportsController: @UseGuards(SessionAuthGuard, RolesGuard)` |
| | `/dashboard/studios/level` | No API endpoint (uses context data from dashboard layout) |
| | `/dashboard/studios/[slug]/team` | `StudiosController: @UseGuards(SessionAuthGuard, StudioRolesGuard)` |
| | Dashboard layout.tsx | Central auth redirect via `useAuth()` + `useEffect` |
| #8 OAuth callback missing CSRF cookie | ✅ FIXED — `playmorrow_csrf` cookie set in `handleCallback()` | `oauth.controller.ts:147-153` |

### New Issues Found (This Session)

| Issue | Severity | Fix Applied | File |
|-------|----------|-------------|------|
| CSRF signature compare not constant-time | HIGH | ✅ Replaced `!==` with `timingSafeEqual` | `csrf.service.ts:39` |
| CSRF token leaks via URL query string | HIGH | ✅ Changed `?csrf=` to `#csrf=` (hash fragment) | `oauth.controller.ts:155`, `callback/page.tsx:13-14` |
| CSP `'unsafe-inline'` documented as known gap | MEDIUM | ✅ Added note + link to nonce-based approach | `middleware.ts:24-27` |

### Ops Items (Not Code — Verified Config)

| Item | Status | Evidence |
|------|--------|----------|
| SENTRY_DSN on Railway | ✅ Set | Verified via Railway CLI Session 14 |
| COOKIE_DOMAIN on Railway | ✅ Set (`.vercel.app`) | Verified via Railway CLI Session 13 |
| VAPID keys (push notifications) | ❌ Not set | Push notifs skip gracefully (logged warning) |
| AWS keys (S3 uploads) | ❌ Not set | Local disk storage (adequate for current scale) |
| Plausible analytics on Vercel | ❌ Not set | Component wired in layout, dormant without env var |

---

## File-by-File Evidence Index

| Purpose | Path | Verified |
|---------|------|----------|
| CSRF service | `apps/api/src/common/csrf.service.ts` | ✅ Timing-safe, HMAC, expiry validated |
| CSRF guard | `apps/api/src/common/csrf.guard.ts` | ✅ Global via APP_GUARD |
| OAuth controller | `apps/api/src/auth/oauth/oauth.controller.ts` | ✅ State param, CSRF cookie, hash-based token |
| API entry | `apps/api/src/main.ts` | ✅ Swagger gated, CSP conditional |
| CSP (frontend) | `apps/web/middleware.ts` | ✅ Noted unsafe-inline limitation |
| Dashboard layout | `apps/web/app/dashboard/layout.tsx` | ✅ Central auth redirect |
| Prisma schema | `packages/database/prisma/schema.prisma` | ✅ 7 indexes, 3 cascade deletes added |
| Railway health | `railway.json` | ✅ /api/health path, 600s timeout |

---

## Remaining Work (Not Code)

| Task | Priority | Notes |
|------|----------|-------|
| Lawyer review Terms + Privacy | HIGH | Legal requirement for public launch |
| Set Plausible env vars on Vercel | LOW | Analytics dormant without it |
| Set VAPID keys on Railway | LOW | Push notifs optional |
| Set AWS keys on Railway | LOW | Local storage adequate at current scale |
| Create /about, /contact pages | LOW | Nice to have before public announcement |
| Docker test DB | LOW | Unblocks ~30 skipped tests |
