# Contributing to Playmorrow

## Getting Started

1. Fork and clone the repo.
2. Run `pnpm install` then `pnpm dev`.
3. Copy `.env.example` to `.env` in `apps/api` and fill in secrets.

## Project Structure

```
apps/
  api/      — NestJS backend (port 4000)
  web/      — Next.js frontend (port 3000)
packages/
  database/ — Prisma schema + client
```

## Development Workflow

- Create a branch from `main` for each feature/fix.
- Run `pnpm lint` and `pnpm typecheck` before pushing.
- Write tests for new API endpoints (vitest, supertest).
- Open a PR to `main`. CI runs lint, typecheck, backend tests, and E2E.

## Running Tests

Tests use the dev database by default. For isolation:

```bash
# Start a local Postgres test DB (requires Docker)
pnpm --filter @playmorrow/api test:db:up

# Run tests against the isolated DB
pnpm --filter @playmorrow/api test:with-db

# Stop the test DB when done
pnpm --filter @playmorrow/api test:db:down
```

CI automatically provisions a Postgres service for tests. To use a different test DB (e.g. Neon branch), set `TEST_DATABASE_URL`:

```bash
TEST_DATABASE_URL=postgresql://... pnpm --filter @playmorrow/api test
```

## Code Conventions

- **No comments in code** — let the code speak.
- Use Tailwind CSS v4 for all styling.
- Markdown rendering must be sanitized with DOMPurify.
- All mutations must include a CSRF token (`X-CSRF-Token` header).

## Staging Environment

A Railway staging environment exists (`railway environment staging`). To use it:

1. **Get a separate Neon DB** — Create a new branch in Neon dashboard, copy its connection string
2. **Set the DB** — `railway environment staging` → `railway variables --set DATABASE_URL=<staging-neon-url>`
3. **Deploy** — Push to `staging` branch on GitHub; Railway auto-deploys

Vercel preview deployments work automatically for any PR branch.

## Commit Style

Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
