# Contributing to Playmorrow

## Getting Started

1. Fork and clone the repo.
2. Run `pnpm install` then `pnpm dev`.
3. Copy `.env.example` to `.env` in `apps/api` and `apps/web`, and fill in the
   development variables.

## Project Structure

```
apps/
  api/      — NestJS backend (port 4000, 58 modules)
  web/      — Next.js frontend (port 3000, App Router)
packages/
  database/ — Prisma schema + migrations + client
  types/    — Shared TypeScript types
  sdk/      — API client SDK
```

## Development Workflow

- Create a branch from `main` for each feature/fix.
- Run `pnpm lint` and `pnpm typecheck` before pushing.
- Write tests for new API endpoints (vitest, supertest).
- Open a PR to `main`. CI runs lint, typecheck, build, backend tests, and
  Playwright E2E (desktop + mobile). All checks must pass before merge.

## Running Tests

The API test suite **never runs against the development or production
database** — a safety guard in `apps/api/vitest.setup.ts` refuses to start if
`DATABASE_URL` points at any Neon host. Tests require an isolated database.

```bash
# Start a local Postgres 16 + pgvector test container (requires Docker)
pnpm --filter @playmorrow/api test:db:up

# Run tests against the isolated DB
pnpm --filter @playmorrow/api test:with-db

# Stop the test DB when done
pnpm --filter @playmorrow/api test:db:down
```

Or point `TEST_DATABASE_URL` at any isolated Postgres (e.g. a Neon branch):

```bash
TEST_DATABASE_URL=postgresql://... pnpm --filter @playmorrow/api test
```

CI provisions its own ephemeral Postgres 16 + pgvector container and applies
all migrations before running the suite. The test database must support the
pgvector extension (the recommendation-engine migration requires it).

The E2E suite runs against a production build with a hermetic API mock layer:

```bash
pnpm --filter @playmorrow/web test:e2e
```

## Code Conventions

- Use Tailwind CSS v4 for styling.
- Markdown rendering must be sanitized with DOMPurify.
- All mutations must include a CSRF token (`X-CSRF-Token` header) — the shared
  API client handles this automatically.
- Do not bypass `SessionAuthGuard`/`RolesGuard`/`assertStudioAccess()` in new
  endpoints; authorization is enforced server-side only.

## Deploying

1. **Frontend:** push to `main` → Vercel auto-deploys.
2. **Backend:** `flyctl deploy` from the repo root (runs `prisma migrate
   deploy` as the release command).
3. **Previews:** Vercel preview deployments are created for PR branches.

## Commit Style

Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
`security:`.

A pre-push hook runs `pnpm verify` (lint + typecheck + build) and a pre-commit
hook runs Gitleaks secret scanning — commits containing secrets are rejected.
