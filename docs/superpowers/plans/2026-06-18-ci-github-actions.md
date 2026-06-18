# CI via GitHub Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions workflow that runs lint, type-check, backend tests (against a real Postgres), and Playwright E2E (desktop + mobile) on every push and PR to `main`.

**Architecture:** One workflow file, `.github/workflows/ci.yml`, with three parallel jobs — `quality` (lint+typecheck), `backend` (Vitest against a `postgres:16` service container after `prisma migrate deploy`), and `e2e` (build web, install Chromium, run both Playwright projects, upload report on failure). Shared setup (Node 20, pnpm 11, frozen install) repeats per job.

**Tech Stack:** GitHub Actions, pnpm 11 + Turborepo, Node 20, Prisma 6 + Postgres 16, Vitest, Playwright 1.61.

## Global Constraints

- Node version: **20**. pnpm version: **11** (matches `packageManager: pnpm@11.1.3`).
- Postgres image: **postgres:16**. Test DB name: `playmorrow_test`, user/pass `postgres`/`postgres`.
- `DATABASE_URL` for backend job: `postgresql://postgres:postgres@localhost:5432/playmorrow_test?schema=public`.
- `JWT_SECRET` MUST be set in the backend job — integration tests instantiate the real `JwtModule` which `getOrThrow`s it.
- `NEXT_PUBLIC_API_URL=http://localhost:4000/api` for the web build — it is inlined at build time and MUST match the origin the Playwright mocks intercept.
- Install always uses `--frozen-lockfile`.
- Do **not** configure branch protection on `main` in this plan — that is a repo-admin GitHub setting, documented only.
- The backend suite has never been verified green against a real Postgres locally; the first CI run is its verification. Fix forward if red.

---

### Task 1: Create the CI workflow file

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: existing root scripts `lint`, `typecheck` (turbo); `@playmorrow/database` script `db:deploy` (`prisma migrate deploy`); `@playmorrow/api` script `test` (`vitest run`); `@playmorrow/web` script `test:e2e` (`playwright test`). Turbo `build` task with `dependsOn: ["^build", "db:generate"]`.
- Produces: a workflow named `CI` triggered on push (all branches) and PRs to `main`.

- [ ] **Step 1: Write the workflow file**

Create `.github/workflows/ci.yml` with exactly this content:

```yaml
name: CI

on:
  push:
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  backend:
    name: Backend tests (Postgres)
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: playmorrow_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/playmorrow_test?schema=public
      JWT_SECRET: test-secret
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Build api + workspace deps (generates Prisma client)
        run: pnpm exec turbo run build --filter=@playmorrow/api...
      - name: Apply migrations
        run: pnpm --filter @playmorrow/database db:deploy
      - name: Run backend tests
        run: pnpm --filter @playmorrow/api test

  e2e:
    name: E2E (Playwright desktop + mobile)
    runs-on: ubuntu-latest
    env:
      NEXT_PUBLIC_API_URL: http://localhost:4000/api
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Build web + workspace deps
        run: pnpm exec turbo run build --filter=@playmorrow/web...
      - name: Install Playwright browser
        run: pnpm --filter @playmorrow/web exec playwright install --with-deps chromium
      - name: Run E2E (desktop + mobile)
        run: pnpm --filter @playmorrow/web test:e2e
      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: |
            apps/web/playwright-report/
            apps/web/test-results/
          retention-days: 7
```

- [ ] **Step 2: Validate the YAML parses**

Run (macOS ships Ruby with a YAML parser):

```bash
ruby -ryaml -e "YAML.load_file('.github/workflows/ci.yml'); puts 'YAML OK'"
```

Expected: prints `YAML OK` with no exception. If it raises, fix indentation/syntax and re-run.

- [ ] **Step 3: Sanity-check the build filters locally (optional but recommended)**

These are the two commands CI relies on for building workspace deps. Verify they resolve and complete:

```bash
pnpm exec turbo run build --filter=@playmorrow/web... 2>&1 | tail -5
```

Expected: turbo builds `@playmorrow/types` (and config) then `@playmorrow/web`, ending `Tasks: N successful`. (The backend filter `@playmorrow/api...` is exercised for real in CI; running it locally needs no DB for the build step itself.)

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow (lint, typecheck, backend+postgres, e2e)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Trigger CI, triage the first run, mark #14 done

**Files:**
- Modify: `docs/handoff/frontend.md` (mark #14 DONE), `docs/handoff/HANDOFF.md` (progress log)

**Interfaces:**
- Consumes: the workflow from Task 1; the `gh` CLI authenticated to `github.com/ricardocesidio/playmorrow`.
- Produces: a green (or triaged) CI run; #14 marked DONE with the workflow run URL/commit.

- [ ] **Step 1: Push the branch to trigger CI**

```bash
git push -u origin fix/handoff-phase-0
```

Expected: push succeeds; GitHub starts the `CI` workflow for the branch.

- [ ] **Step 2: Watch the run**

```bash
gh run list --branch fix/handoff-phase-0 --limit 1
gh run watch $(gh run list --branch fix/handoff-phase-0 --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

Expected: streams job progress. `--exit-status` returns non-zero if any job fails.

- [ ] **Step 3: Triage failures (expected: focus on `backend`)**

`quality` and `e2e` are known-green locally and should pass. If `backend` fails:

```bash
gh run view $(gh run list --branch fix/handoff-phase-0 --limit 1 --json databaseId --jq '.[0].databaseId') --log-failed | tail -120
```

Diagnose under systematic-debugging (do not guess). Likely classes:
- Migration/connection: confirm `DATABASE_URL`, service health, `prisma migrate deploy` output.
- Test isolation: integration specs self-clean via `deleteMany` scoped by a per-spec suffix; parallel Vitest workers sharing one DB can collide — if so, consider `--filter @playmorrow/api test -- --no-file-parallelism` (set in the workflow `run`).
Fix forward, commit, and re-push; repeat until green.

- [ ] **Step 4: Mark #14 DONE in the handoff**

In `docs/handoff/frontend.md`, change the #14 Status line from `OPEN` to:

```
- **Type:** DX/Infra · **Severity:** High · **Effort:** M · **Status:** DONE (`<workflow-commit>`).
  `.github/workflows/ci.yml` runs quality (lint+typecheck), backend (Vitest vs postgres:16
  service + migrate deploy), and e2e (build + Playwright desktop+mobile, report artifact on
  failure) on push + PR to main. First green run: <run URL>. Branch protection on main is a
  repo-admin setting (not set here).
```

Add a row to the `HANDOFF.md` progress log:

```
| 2026-06-18 | 1 | #14 done | `<commit>` | GitHub Actions CI: quality + backend(postgres) + e2e(desktop+mobile). |
```

- [ ] **Step 5: Commit the handoff update**

```bash
git add docs/handoff/
git commit -m "docs(handoff): mark #14 DONE — GitHub Actions CI

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push
```

---

## Self-Review

**Spec coverage:** triggers ✓ (Task 1 Step 1), shared setup ✓, quality job ✓, backend job + postgres service + env + migrate deploy ✓, e2e job + build + browser install + both projects + artifact ✓, out-of-scope branch protection documented ✓ (Task 2 Step 4), success criteria validated via Task 2 ✓.

**Placeholder scan:** `<workflow-commit>`/`<run URL>` in Task 2 Step 4 are values produced at run time (the commit hash and CI URL), not unfilled design decisions — acceptable.

**Type/command consistency:** root scripts `lint`/`typecheck`, `@playmorrow/database db:deploy`, `@playmorrow/api test`, `@playmorrow/web test:e2e` all exist (verified during brainstorming). Build uses `turbo run build --filter=<pkg>...` to include workspace deps.
