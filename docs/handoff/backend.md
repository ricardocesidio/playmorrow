# Backend issues (1–11)

Catalogue for `apps/api` (NestJS) and `packages/database` (Prisma). See
[`HANDOFF.md`](./HANDOFF.md) for repo orientation and execution order.

Legend — **Type**: Bug / Limitation / Feature / DX · **Effort**: S (≤½d) / M (1–2d) / L (≥3d or design).

---

## 1. ValidationPipe not enforced in E2E (whitelist disabled in tests)

- **Type:** Bug · **Severity:** High · **Effort:** M · **Status:** DONE — the "SWC can't
  emit metadata" claim was confirmed stale. Re-enabled `whitelist: true` +
  `forbidNonWhitelisted: true` in `create-test-app.ts` (now mirrors prod); full backend
  suite green **223/223**. Added a regression test in `reactions.controller.spec.ts`
  (unknown body prop → 400) and verified it fails under the old `whitelist: false` config.
  Rewrote the harness doc comment to reflect reality. Closes #31.
- **Files:** `apps/api/src/main.ts`, `apps/api/src/test/create-test-app.ts`,
  `apps/api/vitest.config.ts`
- **Analysis:** Production (`main.ts`) runs `ValidationPipe({ whitelist: true,
  forbidNonWhitelisted: true, transform: true })`. The shared test harness
  (`create-test-app.ts`) sets `whitelist: false / forbidNonWhitelisted: false`, with a long
  comment blaming SWC for not emitting class-validator metadata. **But** `vitest.config.ts`
  already enables `transform.decoratorMetadata: true` and `legacyDecorator: true` — so the
  claimed limitation may be stale or misconfigured. Net effect: tests do not exercise the
  same validation behavior as prod (e.g. extra/unknown body props are not rejected), and the
  original list reports an invalid reaction type returning **500 instead of 400** in tests.
- **Suggested fix:** (1) Reproduce the failure: flip `whitelist`/`forbidNonWhitelisted` back
  to `true` in `create-test-app.ts` and run `pnpm --filter @playmorrow/api test`. (2) If DTOs
  come back empty, the metadata is genuinely missing — confirm `reflect-metadata` is imported
  in the test setup and that `@IsString()` etc. carry `@Type()` where needed; consider
  switching the Vitest transform to `@swc/core` with explicit
  `jsc.parser.decorators + transform.decoratorMetadata` (already present) or fall back to a
  `tsc`-based test build for the affected suites. (3) Add an integration test asserting a
  bogus `type`/unknown prop → **400**. Update the harness comment to reflect reality.
- **Cross-refs:** #31 (same root, documented as a DX gap).

## 2. No refresh tokens

- **Type:** Feature · **Severity:** Medium · **Effort:** L · `NEEDS DESIGN` · **Status:** OPEN
- **Files:** `apps/api/src/auth/*` (`auth.service.ts`, `auth.controller.ts`,
  `strategies/jwt.strategy.ts`), `apps/web/lib/api/auth-context.tsx`
- **Analysis:** Single JWT, 7-day expiry, no refresh flow. Expiry = forced logout. `User`
  has no token/session table.
- **Suggested approach:** Short-lived access token (~15m) + rotating refresh token. Decide
  storage (httpOnly cookie vs. DB-backed refresh-token table with rotation + revocation).
  Add `POST /auth/refresh`, `POST /auth/logout`. Frontend: silent refresh on 401, update
  `auth-context`. **Design note required** (cookie vs. localStorage has CORS/security
  implications — current setup is `Authorization: Bearer` from localStorage).

## 3. No rate limiting

- **Type:** Limitation · **Severity:** High · **Effort:** S–M · **Status:** DONE — added
  `@nestjs/throttler`. Global `ThrottlerModule` (60 req/min/IP) + `ThrottlerGuard` as
  `APP_GUARD` in `AppModule`. Tighter `@Throttle` overrides: login 10/min, register 5/min,
  comment create 20/min, reaction create 30/min. Health probe is `@SkipThrottle()`. New spec
  asserts the login limit → **429**. In-memory store (fine for single instance; swap for Redis
  if multi-instance later). Note: existing per-module integration tests don't import
  `AppModule`, so they're unthrottled and unaffected.
- **Files:** `apps/api/src/app.module.ts`, auth/comments/reactions controllers
- **Analysis:** No throttling anywhere. Auth endpoints (brute-force), comments/reactions
  (spam) are exposed.
- **Suggested fix:** Add `@nestjs/throttler`. Global `ThrottlerModule` default (e.g.
  60 req/min) + `ThrottlerGuard`; tighter `@Throttle()` overrides on `POST /auth/login`,
  `/auth/register`, comment create, reaction create. Add an integration test hitting the
  limit → **429**. (Consider Redis storage later for multi-instance; in-memory is fine for v1.)

## 4. No email verification — DEFERRED

- **Type:** Feature · **Severity:** Medium · **Effort:** L · **Status:** DEFERRED (product owner)
- **Files:** `apps/api/src/auth/*`, `User.isVerified` (already in schema)
- **Analysis:** Users are active immediately; `User.isVerified` exists but is unused for
  gating. Deferred because it requires an email transport (no provider chosen).
- **If revived:** needs the email-transport decision first (Resend / SMTP / dev-stub), a
  verification-token store, `POST /auth/verify-email` + resend endpoint, and a gate on
  sensitive actions. Pair with #5.

## 5. No password reset — DEFERRED

- **Type:** Feature · **Severity:** Medium · **Effort:** M–L · **Status:** DEFERRED (product owner)
- **Files:** `apps/api/src/auth/*`
- **Analysis:** No `POST /auth/forgot-password` or `POST /auth/reset-password`. Deferred with
  #4 (same email-transport dependency).
- **If revived:** reset-token store with expiry + single-use, the two endpoints, argon2 rehash
  on reset, rate-limit the request endpoint (ties to #3).

## 6. No OAuth

- **Type:** Feature · **Severity:** Low–Medium · **Effort:** L · `NEEDS DESIGN` · **Status:** OPEN
- **Files:** `apps/api/src/auth/*`, `User.passwordHash` is already nullable ("Null for
  OAuth-only accounts")
- **Analysis:** Email/password only. Schema already anticipates OAuth (nullable
  `passwordHash`).
- **Suggested approach:** `passport` strategies for chosen provider(s) (Google / GitHub /
  Discord — **provider list undecided**), account-linking rules (match by verified email),
  callback routes, and frontend buttons. **Design note required** (which providers; link vs.
  separate accounts).

## 7. Report `reason` is a free string, not an enum

- **Type:** Bug · **Severity:** Medium · **Effort:** S · **Status:** DONE — added Prisma
  `enum ReportReason` and changed `ModerationReport.reason` to it. Migration converts the
  column in place with a `USING` cast (preserves existing rows; Prisma's default drop/recreate
  was hand-edited out). `VALID_REPORT_REASONS` is now guarded by a compile-time
  `AssertExact` check against the enum (proven to fail the build on drift), so DB and DTO are
  a single source of truth.
- **Files:** `packages/database/prisma/schema.prisma` (`ModerationReport.reason`),
  `apps/api/src/reports/dto/create-report.dto.ts` (`VALID_REPORT_REASONS`),
  `apps/api/src/reports/reports.service.ts`
- **Analysis:** DTO already validates `reason` against `VALID_REPORT_REASONS` via `@IsIn`, but
  the DB column is `String`, so anything written outside the API (or if validation regresses)
  is accepted. The constant and the DB are not a single source of truth.
- **Suggested fix:** Add a Prisma `enum ReportReason { SPAM HARASSMENT HATE SEXUAL_CONTENT
  VIOLENCE COPYRIGHT MISLEADING OTHER }`, change `ModerationReport.reason` to it, migrate
  (`pnpm db:migrate`), and have the DTO reference the enum. Keep `VALID_REPORT_REASONS` in
  sync or derive it from the generated enum. Backfill/migrate existing rows.

## 8. No `resolutionNote` on reports

- **Type:** Limitation · **Severity:** Low · **Effort:** S · **Status:** DONE — added
  `resolutionNote String?` to `ModerationReport` (same migration as #7). `UpdateReportDto`
  accepts an optional `resolutionNote` (≤2000 chars); the service persists it on resolve/
  dismiss and clears it on reopen (status → OPEN). It's returned in `findAll`/detail/update
  responses. Two integration tests added (persist + clear-on-reopen).
- **Files:** `packages/database/prisma/schema.prisma` (`ModerationReport`),
  `apps/api/src/reports/dto/update-report.dto.ts`, `reports.service.ts`
- **Analysis:** `ModerationReport` has `status`, `resolvedById`, `resolvedAt`, timestamps —
  but no field for *why* a report was resolved/dismissed.
- **Suggested fix:** Add `resolutionNote String?` to the model + migration. Accept it on the
  resolve/update endpoint (extend `UpdateReportDto`), persist it, and return it in
  `findAll`/detail responses. Add a test.

## 9. Devlog/comment reactions lack `useQuery` dedup (N+1) — backend half

- **Type:** Bug · **Severity:** Medium · **Effort:** M · **Status:** DONE — added batch endpoint
  `GET /api/devlogs/:devlogId/comments/reactions` (`OptionalJwtAuthGuard`). The service
  resolves counts + viewer reactions for *all* non-deleted comments on a devlog in **two
  queries** (`groupBy` on `[commentId, type]` + a `findMany` for the viewer), returning a map
  keyed by comment id — independent of comment count. Three integration tests added. Frontend
  consumes it in #24.
- **Files:** `apps/api/src/reactions/reactions.controller.ts`,
  `apps/api/src/reactions/reactions.service.ts` (frontend half: #24)
- **Analysis:** Reaction counts are only available per-entity via
  `GET /api/comments/:id/reactions` and `GET /api/devlogs/:id/reactions`. A devlog thread with
  N comments => N requests (the frontend fans these out — see #24).
- **Suggested fix:** Add a **batch endpoint**, e.g.
  `GET /api/devlogs/:devlogId/comments/reactions` (or accept `?commentIds=` / return reactions
  embedded in the comments list) that returns counts + viewer reactions for all comments in
  one query (`groupBy` on `commentId`). Coordinate the response shape with #24 so the
  frontend can key a single `useQuery` per devlog.

## 10. Prisma v7 deprecation: seed config in `package.json`

- **Type:** DX · **Severity:** Low · **Effort:** S · **Status:** DONE (`cf21a50`) — added
  `packages/database/prisma.config.ts` (`migrations.seed`), removed the `prisma` key from
  `package.json`. A config file disables Prisma's auto `.env` loading, so it's restored via
  Node's `process.loadEnvFile()`. Verified: `prisma validate` loads the config, finds
  `DATABASE_URL`, no deprecation warning. (Live seeding needs a DB — not available locally.)
- **Files:** `packages/database/package.json` (`"prisma": { "seed": ... }`),
  new `packages/database/prisma.config.ts`
- **Analysis:** `package.json#prisma.seed` is deprecated; Prisma 7 wants `prisma.config.ts`.
  Currently `"prisma": { "seed": "tsx prisma/seed.ts" }`.
- **Suggested fix:** Create `packages/database/prisma.config.ts` exporting the config
  (`migrations`/`seed`) per Prisma's current docs, remove the `prisma` key from
  `package.json`, verify `pnpm db:seed` still works.

## 11. Turbo: "no output files found for task @playmorrow/api#test"

- **Type:** DX · **Severity:** Low · **Effort:** S · **Status:** DONE (`cf21a50`) — set the
  `test` task `outputs: []` in `turbo.json` (no coverage is produced). Confirmed the
  "no output files found" warning is gone on a full `pnpm test` run.
- **Files:** `turbo.json`
- **Analysis:** `tasks.test.outputs` is `["coverage/**"]`, but the api test run produces no
  `coverage/` dir (no coverage configured), so Turbo warns about missing outputs.
- **Suggested fix:** Either enable coverage for the api Vitest run (so `coverage/**` exists) or
  give the `test` task per-package outputs / an empty `outputs: []` where appropriate. Simplest:
  add `coverage.enabled` to `apps/api/vitest.config.ts`, or remove the stale `outputs` if
  coverage isn't wanted. Re-run `pnpm test` and confirm the warning is gone.
