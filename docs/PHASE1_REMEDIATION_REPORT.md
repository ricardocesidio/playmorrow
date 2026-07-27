# Playmorrow — Phase 1 Remediation Report

**Date:** 2026-07-27
**Author:** Senior/Staff Engineer
**Branch:** `main` (827 commits)
**Status:** All 4 critical blockers fixed. 11 medium issues addressed.

---

## Summary

| Issue | Status | Commit(s) | Evidence |
|-------|--------|-----------|----------|
| **C1** — Test suite failures | ✅ Fixed | `c93ffc6` | 16/16 files pass, 258 pass, 1 skip, 0 failures |
| **C2** — In-memory feed pagination | ✅ Fixed | `8d721f6` | Added `take: perTypeLimit` to all feed queries |
| **C3** — No dynamic SEO metadata | ✅ Fixed | `8d721f6` | Added `generateMetadata` + JSON-LD to 3 content routes |
| **C4** — MEMBER can delete devlogs | ✅ Fixed | `c93ffc6` | Removed `MEMBER` from devlog delete permissions |
| **M1** — Missing settings pages | ✅ Fixed | `733b4fc` | Added `/settings/account` + `/settings/notifications` |
| **M2** — CSRF cookie maxAge mismatch | ✅ Fixed | `8d721f6` | Aligned frontend cookie to 7 days |
| **M3** — Analytics N+1 | ✅ Fixed | `c2be3be` | Replaced per-game loop with batched `groupBy` |
| **M4** — STATUS.md inaccuracies | ✅ Fixed | `b8bb3ac` | Updated with real verified output numbers |
| **M5** — EventBus ephemeral (doc only) | ✅ Fixed | `8ceeb30` | Documented limitation in `ARCHITECTURE.md` |
| **M6** — Dual event system (doc only) | ✅ Fixed | `8ceeb30` | Documented both systems in `ARCHITECTURE.md` |
| **M7** — Press kit naming confusion | ✅ Fixed | `c2be3be` | Added JSDoc to all press-kit module classes |
| **M8** — No exception filter | ✅ Fixed | `c2be3be` | Created `GlobalExceptionFilter` registered in `main.ts` |
| **M9** — Dead adminOnly endpoint | ✅ Fixed | `8d721f6` | Removed test endpoint from `auth.controller.ts` |
| **M10** — TOCTOU in onboarding | ✅ Fixed | `c2be3be` | Replaced `findFirst` + create with try/catch P2002 |
| **M11** — Auth check ordering | ✅ Fixed | `8d721f6` | Moved `assertStudioAccess()` before business logic |

### Deferred (infra, not code)
- No staging environment on Railway
- Env vars not fully set on Railway
- No dedicated test database

---

## Evidence per Fix

### C1 — Test suite

**Before:** 2 failed, 14 passed, 214 pass, 45 skip, 2 errors (STATUS.md falsely claimed "258 pass, 0 failures")

**After:**
```
Test Files  16 passed (16)
     Tests  258 passed | 1 skipped (259)
```

**Files changed:**
- Added `vi.setConfig({ hookTimeout: 30_000 })` to 13 spec files
- Fixed `RoadmapItemsController.remove()` — added `studioId`/`gameId` to event emission
- Fixed `RoadmapItemsController.reorder()` — added `studioId` to event emission
- Changed `RoadmapItemsService.remove()` return to include `{ success, gameId, studioId }`
- Changed `RoadmapItemsService.reorder()` return to include `{ reordered, gameId, studioId }`

**Root cause of hooks:** Heavy sequential DB operations on remote Neon exceeding vitest's 10s default timeout.
**Root cause of errors:** Event emissions in `remove()`/`reorder()` missing `studioId` — caused `GoalsService.progress()` to pass `undefined` to Prisma.

### C2 — Feed pagination

**Before:** `feed.service.ts` `getPersonalFeed()` used `findMany()` with no `skip`/`take`, then sliced in memory:
```ts
const start = (page - 1) * cappedSize;
const paged = feedItems.slice(start, start + cappedSize);
```

**After:** Each type query bounded with `take`:
```ts
const perTypeLimit = (page + 1) * cappedSize * 3;
// ...
this.prisma.devlog.findMany({ ..., take: perTypeLimit })
this.prisma.roadmapItem.findMany({ ..., take: perTypeLimit })
```

`getPublicFeed()` already had bounded `take` — no change needed there.

### C3 — Dynamic SEO metadata

Added `layout.tsx` files to 3 dynamic routes:

| Route | File | generateMetadata | JSON-LD schema |
|-------|------|------------------|----------------|
| `/games/[slug]` | `games/[slug]/layout.tsx` | ✅ title + description + OG image from API | ✅ `VideoGame` |
| `/studios/[slug]` | `studios/[slug]/layout.tsx` | ✅ title + description + OG image from API | ✅ `Organization` |
| `/devlogs/[id]` | `devlogs/[id]/layout.tsx` | ✅ title + description + OG image from API | ✅ `BlogPosting` |

Feed page intentionally uses generic metadata (live content, no single entity).

### C4 — Devlog delete permissions

**Before:** `devlogs.service.ts:317` included `StudioRole.MEMBER` in allowed roles.

**After:** MEMBER removed — only OWNER, ADMIN, MODERATOR can delete.

### M2 — CSRF maxAge

**Before:** Frontend cookie: `maxAge: 60 * 60 * 24` (1 day). Backend: `7 * 24 * 60 * 60 * 1000` (7 days).

**After:** `form-login/route.ts:76` — `maxAge` changed to `60 * 60 * 24 * 7` (7 days).

### M3 — Analytics N+1

**Before:** `getStudioStats` ran 1 count query per game. `runDailyAggregation` ran 1 findMany per event group.

**After:** Both replaced with single batched queries using Prisma `groupBy` and `in` filters.

### M7 — Press kit naming

Added JSDoc comments to 5 classes across both modules clearly identifying which is game-level vs studio-level.

### M8 — Exception filter

Created `apps/api/src/common/exception.filter.ts` with `@Catch()` that returns consistent `{ statusCode, message, error, timestamp, path }` shape. Registers in `main.ts`.

### M10 — TOCTOU

**Before:** `findFirst` to check username → TOCTOU window → create.
**After:** Removed pre-check. Wrapped `$transaction` in try/catch catching Prisma P2002 (unique constraint violation). DB is sole authority.

### M11 — Auth ordering

**Before:** Business logic at lines 260-287 ran before `assertStudioAccess()` at line 289.
**After:** `assertStudioAccess()` moved to line 248 (right after user lookup).

---

## Final Verified Numbers

| Check | Result |
|-------|--------|
| `pnpm typecheck` | ✅ 6/6 successful |
| `pnpm lint` | ✅ 0 errors, 50 warnings (all pre-existing `token` unused-var) |
| `pnpm --filter @playmorrow/api test` | ✅ 16/16 files, 258 pass, 1 skip, 0 failures, 0 errors |
| `git log --oneline \| wc -l` | 827 commits |

---

## What Remains (Deferred to Phase 2 infra work)

1. **No staging environment** — Railway preview deployments not configured
2. **Production env vars incomplete** — `COOKIE_DOMAIN`, `VAPID_*`, `AWS_*` not set on Railway
3. **No isolated test database** — Suite still depends on shared Neon DB (hook timeouts mitigated but not eliminated)

These are infrastructure/account-access issues, not code issues. They do not block Phase 1 certification.

---

## Updated Recommendation

**Phase 1 is now certifiable.** All 4 critical blockers and all 11 medium issues are fixed. The platform has:

- ✅ Working test suite (16/16 files, 258/259 passing)
- ✅ Bounded feed pagination (no unbounded memory)
- ✅ Dynamic SEO metadata for all content pages
- ✅ Correct authorization (MEMBER cannot delete devlogs)
- ✅ Global exception filter for consistent errors
- ✅ 7 settings pages (profile, account, notifications)
- ✅ Aligned CSRF cookie lifecycle
- ✅ Batched analytics queries (no N+1)
- ✅ Accurate STATUS.md documentation

The Phase 2 execution plan from the audit report can proceed. The 3 deferred infra items should be addressed as part of Phase 2 setup.
