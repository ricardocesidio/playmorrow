# CI via GitHub Actions — Design (handoff #14)

- **Date:** 2026-06-18
- **Issue:** #14 (No CI integration) — see `docs/handoff/frontend.md`
- **Status:** Approved design, ready for implementation plan
- **Prereq met:** #12 + #13 done — desktop & mobile Playwright suites are green and
  deterministic (`--repeat-each=2` → 62/62 each). The handoff says wire CI only after the
  E2E suite is green; that condition now holds.

## Goal

A single GitHub Actions workflow that runs lint, type-check, backend tests (against a real
Postgres), and Playwright E2E (desktop + mobile) on every push and on PRs to `main`, so the
suite is automatically gated rather than manual.

## Triggers

```yaml
on:
  push:                      # every branch — the current feature branch gets CI on push
  pull_request:
    branches: [main]
concurrency:                 # cancel superseded runs for the same ref
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

## Shared setup (every job)

- `runs-on: ubuntu-latest`
- `pnpm/action-setup@v4` with `version: 11` (matches `packageManager: pnpm@11.1.3`)
- `actions/setup-node@v4` with `node-version: 22` and `cache: pnpm`
  (Node 22, not 20 — pnpm 11.1.3 requires Node ≥ 22.13; corrected during implementation)
- `pnpm install --frozen-lockfile`

## Jobs (run in parallel)

### 1. `quality`
- `pnpm lint`
- `pnpm typecheck`
- Turbo runs `db:generate` as a dependency of `typecheck`/`lint`, so the generated Prisma
  client is available; no extra step needed.

### 2. `backend`
- **Service container:**
  ```yaml
  services:
    postgres:
      image: postgres:16
      env: { POSTGRES_USER: postgres, POSTGRES_PASSWORD: postgres, POSTGRES_DB: playmorrow_test }
      ports: ['5432:5432']
      options: >-
        --health-cmd "pg_isready -U postgres" --health-interval 10s
        --health-timeout 5s --health-retries 5
  ```
- **Env:**
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/playmorrow_test?schema=public`
  - `JWT_SECRET=test-secret` — the integration tests instantiate the real `JwtModule`, which
    `getOrThrow`s `JWT_SECRET`.
- **Steps:** `pnpm db:generate` → `pnpm --filter @playmorrow/database db:deploy`
  (`prisma migrate deploy`) → `pnpm --filter @playmorrow/api test` (`vitest run`).
- **Note:** `packages/database/prisma.config.ts` falls back to the ambient environment when no
  `.env` file exists (its `process.loadEnvFile()` is wrapped in try/catch), so CI's
  `DATABASE_URL` is used directly.
- **Risk acknowledged:** the backend suite has not been verified green against a real Postgres
  on the dev machine (no local DB). This job's first run is the verification; if red, fix
  forward. The tests are written for a live DB (self-clean via `deleteMany` scoped by a
  per-spec suffix), consistent with the handoff's "207 passing" claim.

### 3. `e2e`
- No database (the web app's API is fully mocked by Playwright).
- **Steps:**
  - `pnpm --filter @playmorrow/web build` with `NEXT_PUBLIC_API_URL=http://localhost:4000/api`
    (build-time inlined; must match the origin the mocks intercept).
  - `pnpm --filter @playmorrow/web exec playwright install --with-deps chromium`
    (both desktop and the Pixel 7 mobile project use Chromium).
  - `pnpm --filter @playmorrow/web test:e2e` — runs **both** projects. Actions sets
    `CI=true`, so `playwright.config.ts` uses `workers: 1`, `retries: 1`, `forbidOnly: true`,
    and `reuseExistingServer: false` (fresh `next start`).
- **Artifacts (on failure):** upload `apps/web/playwright-report/` and
  `apps/web/test-results/` via `actions/upload-artifact@v4` with `if: failure()`.

## Out of scope (v1)

- **Branch protection on `main`** (require these checks before merge) — a repo-admin setting,
  not something the workflow file controls. Documented here; the repo owner enables it in
  GitHub settings once the workflow is green.
- **Extra caching** beyond the pnpm store (e.g., Next `.next/cache`, Playwright browser cache)
  — can be added later if CI time warrants; kept minimal for a correct first version.

## Success criteria

- Workflow file present at `.github/workflows/ci.yml`, valid YAML, parses in Actions.
- On push of the working branch: `quality` and `e2e` jobs pass; `backend` job runs against
  Postgres (its result is the verification of the backend-vs-Postgres gate).
- E2E runs both desktop and mobile projects; failures upload a report artifact.
