# Playmorrow — Engineering Handoff

> **Start here.** This is the entry point for the next agent/developer. It catalogues the
> 34 known issues, explains how to run the repo, and lays out a recommended execution
> order. Each issue has root-cause analysis, affected files, a suggested fix, and an
> effort estimate. Work top-to-bottom through the phases unless told otherwise.

- **Generated:** 2026-06-18
- **Repo:** https://github.com/ricardocesidio/playmorrow (`main`)
- **Source list:** 34 issues — 11 backend, 18 frontend, 5 dev-ex.
- **Decisions captured so far:** email-based features (#4 verification, #5 password reset)
  are **deferred** by product owner. Other feature infra (uploads storage, realtime
  transport, OAuth providers) is **undecided** — those issues are flagged `NEEDS DESIGN`.

## Progress log

| Date | Phase | Issues | Commit | Notes |
|------|-------|--------|--------|-------|
| 2026-06-18 | 0 | #10, #11, #17, #30 done; #31 partial | `cf21a50` | Quick wins. See each issue's Status line for detail. |
| 2026-06-18 | 1 | #12 done | `e48e341` | Feed E2E flake fixed (auth-setup hydration race + locator/retry bugs). Desktop suite 31/31; feed `--repeat-each=3` 18/18. |
| 2026-06-18 | 1 | #13 done | `c3e5e6d` | Mobile project run + triaged. Same auth-setup race fixed in `auth`/`social-actions`/`responsive` via `addInitScript`. Desktop & mobile `--repeat-each=2` → 62/62 each. |
| 2026-06-18 | 1 | #14 done | `13bec33` | GitHub Actions CI green: quality + backend(postgres:16) + e2e(desktop+mobile). [First green run](https://github.com/ricardocesidio/playmorrow/actions/runs/27785284477). Backend suite verified against real Postgres. CI uses Node 22 (pnpm 11.1.3 needs ≥22.13). |
| 2026-06-19 | 2 | #1, #31 done | `8415fdc` | ValidationPipe parity restored. The "SWC can't emit class-validator metadata" claim was stale — re-enabled `whitelist: true` + `forbidNonWhitelisted: true` in `create-test-app.ts`. Full backend suite green **223/223** against local Postgres. Added regression test (unknown body prop → 400), verified it fails under the old config. |
| 2026-06-19 | quick wins | #23, #27, #15, #29, #34 done | `e67251e` | Effort-S sweep. #23 feed scrolls to top on pagination (reduced-motion aware). #27 not reproducible — dashboard (only Feed-card link) is auth-gated. #15 `reuseExistingServer: false` so Playwright owns the server. #34 port map documented + `clean-port` script. #29 README clarified + root `test:all`. Desktop E2E 31/31 green; web typecheck+lint clean. |
| 2026-06-19 | 2 | #7, #8 done | `6328878` | Report schema integrity. #7 `reason` is now a Prisma `enum ReportReason` (in-place `USING` cast migration; compile-time `AssertExact` guard keeps DTO list in sync). #8 added `resolutionNote String?`, accepted on update, cleared on reopen, returned in responses. Backend suite **225/225** green; api typecheck+lint clean. |
| 2026-06-19 | 2 | #19 done | `5543993` | Delete UI for studio/game/devlog/roadmap/notification. Backend DELETE endpoints + service methods (auth-gated via studio-permissions). Frontend hooks + confirm dialogs on edit pages + dashboard rows. Backend suite **241/241** green. |
| 2026-06-19 | 2 | #28 done | `ec217c7` | Visual regression snapshots. 20 `toHaveScreenshot()` baselines covering homepage, games, game detail, login, register, studio, devlog, dashboard, dashboard feed, notifications — each at desktop (1440×900) and mobile (412×915). Snapshot tests excluded from default run (`testIgnore`); run via `test:e2e:snapshots`. Platform-independent paths (no OS suffix) for CI portability. |
| 2026-06-19 | 2 | #3 done | `7b89976` | Rate limiting via `@nestjs/throttler`: global 60/min/IP guard + tighter `@Throttle` overrides (login 10, register 5, comment 20, reaction 30 per min); health `@SkipThrottle()`. New spec asserts login → 429. Backend suite **226/226** green; lint clean. |
| 2026-06-19 | 1 | #16 done | `6d06746` | Dev-mode E2E path: `PLAYWRIGHT_DEV=1` serves with `next dev` (no production build) via `test:e2e:dev`; CI keeps `next start`. README documents both + the `NEXT_PUBLIC_*` inlining caveat. Verified public spec 8/8 in dev mode. |
| 2026-06-19 | polish | #22 done | `02a97c5` | Auth hydration flash: nav renders a stable skeleton while `isLoading` (no pop-in/shift); `/login` + `/register` gate on `authLoading` before redirect so the form doesn't flash for logged-in visitors. 25 E2E tests green. |
| 2026-06-19 | 3 | #9, #24 done | `5607602` | Reaction N+1 fix. New batch endpoint `GET /api/devlogs/:id/comments/reactions` resolves all comments' reactions in 2 queries (`groupBy` + viewer `findMany`), keyed by comment id. Frontend swaps the per-comment fan-out for one `useDevlogCommentReactions` query; mutations invalidate the batch key. Backend **229/229**; web typecheck+lint clean. |
| 2026-06-19 | 4 | #26 done | `d1869ea` | Clickable notifications: server resolves a `targetUrl` per notification (DEVLOG/COMMENT→devlog, GAME/STUDIO→slug routes; batched, no N+1). Rows link to it + mark read on click. Backend **229/229**; web typecheck+lint clean. |

**Phase 0 verification:** `pnpm --filter @playmorrow/web lint` → 0 warnings; `prisma validate`
clean (config + env load); turbo "no output files" warning gone on full `pnpm test`.

> ✅ **Baseline update (2026-06-19):** a local Postgres is now reachable on `localhost:5432`
> (schema up to date via `prisma migrate status`). The full backend suite runs green —
> **223/223** across all 14 test files. The earlier "5 failed · no local backend baseline"
> note (2026-06-18) was caused by the missing DB and no longer applies. E2E (#12) remains
> API-mocked and does not need a DB.

## Issue catalogue (by area)

- [`backend.md`](./backend.md) — issues **1–11**
- [`frontend.md`](./frontend.md) — issues **12–29**
- [`devx.md`](./devx.md) — issues **30–34**

Each issue is tagged: **Type** (Bug / Limitation / Feature / DX), **Severity**, **Effort**
(S ≤ half day · M ≈ 1–2 days · L ≥ 3 days or needs design), and **Status** (`OPEN`).

---

## ⚠️ Important correction before you start

The original list names the **6 failing feed E2E tests (#12)** as the "single most impactful
fix" and guesses the cause is a *"Playwright route-ordering issue with predicate functions."*

That diagnosis is **not supported by the evidence on disk.** The failure artifact at
`apps/web/test-results/personalized-feed-Personal-1497d--filter-shows-mixed-content-desktop/error-context.md`
shows the real error:

```
TypeError: makeItem is not a function or its return value is not iterable
```

That is a JavaScript error **inside the test's own mock handler**, not a route-matching
problem — and it may be a **stale artifact** (the current `personalized-feed.spec.ts` does
not obviously contain that bug). **Do not implement the assumed "route ordering" fix.**
Reproduce first (see #12) and fix the actual root cause.

---

## Recommended execution path

Phases are ordered to unblock a green, CI-gated test suite first, then correctness, then
polish, then features. Within a phase, items are independent unless noted.

| Phase | Theme | Issues | Why this order |
|-------|-------|--------|----------------|
| **0** | Quick wins / clear the noise | #11, #10, #17, #30, #31 | Trivial, remove warnings/friction before real work. |
| **1** | Green E2E + CI (critical path) | #12 → #1 → #15/#16 → #13 → #29 → #14 | A trustworthy, automated test gate. #12 first (reproduce!). |
| **2** | Backend correctness & security | #3, #7, #8 | Cheap, high-value hardening + schema integrity. |
| **3** | Performance | #9 / #24 | One batch endpoint kills the comment-reaction N+1. |
| **4** | UX polish | #22, #23, #27, #26 | Small, user-visible fixes. |
| **5** | Features (`NEEDS DESIGN`) | #2, #6, #18, #19, #20, #21, #25, #28, #32, #33, #34, (#4, #5 deferred) | Each needs its own design pass before coding. |

**Concrete first step:** open [`frontend.md`](./frontend.md) → issue **#12**, follow the
"Reproduce" steps, and capture the *live* failure before touching code.

---

## Repo orientation

Monorepo: **pnpm 11 + Turborepo**.

```
apps/web         Next.js 15 + React 19 + Tailwind v4 + TanStack Query   (frontend)
apps/api         NestJS 11 + Swagger + Passport-JWT + class-validator    (backend)
packages/database Prisma 6 + Postgres (schema, migrations, seed)
packages/types   shared TS types
packages/config  shared tsconfig / eslint
```

### Commands

```bash
pnpm install                 # bootstrap
pnpm build                   # turbo build (db:generate runs first)
pnpm typecheck               # tsc --noEmit across packages
pnpm lint                    # eslint across packages
pnpm test                    # backend Vitest only — 207 passing (see #29: does NOT run E2E)
pnpm --filter @playmorrow/api test     # backend unit/integration (SWC + Vitest)
pnpm test:e2e                # Playwright — requires a production build first (see below)
pnpm db:generate|migrate|push|studio|seed
```

### Running E2E (current, fragile — see #15/#16)

```bash
pnpm --filter @playmorrow/web build      # next build (3–5 min) — REQUIRED before e2e
pnpm test:e2e                            # playwright starts `next start -p 3099`
```

- Playwright config: `apps/web/playwright.config.ts`. Two projects: `desktop`, `mobile`
  (mobile is configured but **never run** — #13). Base URL `http://localhost:3099`.
- E2E mocks intercept the API at origin **`http://localhost:4000`** (see
  `apps/web/e2e/fixtures/mocks.ts`). The web app's API base is
  `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'`
  (`apps/web/lib/api/client.ts`). Note `NEXT_PUBLIC_*` is **inlined at build time**, so the
  `webServer.env` override in the Playwright config does not change an already-built bundle.

### Environment / infra facts

- **Docker is not installed on the dev machine.** Local Postgres options: hosted Neon /
  Supabase, or install Docker for `docker-compose.yml`. CI must use a Postgres **service
  container** (#14).
- `apps/api/.env` is gitignored; copy from `.env.example` (#30).
- No `.github/` workflows yet (#14). No `docs/` other than this handoff.

### Conventions to follow

- Backend: NestJS module-per-domain. DTOs use `class-validator` decorators; controllers
  thin, services hold logic. Mirror production bootstrap via
  `apps/api/src/test/create-test-app.ts` in integration tests.
- Frontend: TanStack Query hooks live in `apps/web/lib/api/hooks.ts`; the typed fetch
  wrapper is `apps/web/lib/api/client.ts`; auth state is `apps/web/lib/api/auth-context.tsx`.
- Prisma is the single source of truth for the data model
  (`packages/database/prisma/schema.prisma`). Schema changes require a migration.

---

## How to use this handoff

1. Read this file end-to-end.
2. Go to the area file for your issue, read the full entry (don't act on the title alone).
3. For `NEEDS DESIGN` items, write a short design note before coding (the email-features
   precedent: features can be deferred — confirm scope with the product owner).
4. Update the issue's **Status** line as you progress (`OPEN` → `IN PROGRESS` → `DONE (commit)`).
5. Keep the test suite green; don't open the next phase until the current one is CI-green.
