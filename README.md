# Playmorrow

**Discover tomorrow's indie games today.**

Playmorrow is a curated social platform where indie studios showcase their games,
share devlogs, publish roadmaps, grow communities, and connect with players, press,
streamers, and publishers. It is the _social discovery layer_ for indie games —
not a store. Steam is where people buy; itch.io is where people upload; Discord is
where communities talk; **Playmorrow is where studios build their public presence.**

---

## Monorepo layout

```
playmorrow/
  apps/
    web/        Next.js 15 frontend (React 19, TS, Tailwind v4, shadcn/ui)
    api/        NestJS 11 backend (TS, Prisma, Swagger/OpenAPI)
  packages/
    database/   Prisma schema, migrations, generated client
    types/      shared TypeScript types / API contracts
    config/     shared tsconfig, eslint, prettier presets
```

Tooling: **pnpm** workspaces + **Turborepo**.

## Tech stack

| Layer       | Choice                                                        |
| ----------- | ------------------------------------------------------------- |
| Frontend    | Next.js 15 + React 19 + TypeScript                           |
| Styling     | Tailwind CSS v4 + shadcn/ui                                   |
| Data (FE)   | TanStack Query v5                                              |
| Backend     | NestJS 11 + TypeScript                                        |
| ORM / DB    | Prisma 6 + PostgreSQL                                         |
| Auth        | JWT (argon2 password hashing)                                 |
| API docs    | OpenAPI (Swagger) at `/docs`                                  |
| Testing     | Vitest (unit, 207+ tests), Playwright (E2E, 31 tests)         |

## Prerequisites

- Node `>=20`
- pnpm `>=11`
- A Postgres database — either:
  - **Docker** (recommended for local): `docker compose up -d` (see `docker-compose.yml`)
  - **or hosted**: a [Neon](https://neon.tech) / [Supabase](https://supabase.com) connection string

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment (skips existing files)
pnpm setup:env
#   Edit the generated files and set at least:
#     - DATABASE_URL   (in .env and packages/database/.env)
#                       Docker default works out of the box.
#     - JWT_SECRET     (apps/api/.env) — required; API refuses to boot without it.

# 3. Start Postgres (if using Docker)
docker compose up -d

# 4. Generate Prisma client + run migration
pnpm db:generate
pnpm db:migrate

# 5. Start development (Turborepo runs web + api together)
pnpm dev
```

| Service        | URL                            |
| -------------- | ------------------------------ |
| Web (Next.js)  | http://localhost:3000          |
| API (NestJS)   | http://localhost:4000          |
| API docs       | http://localhost:4000/docs     |
| Prisma Studio  | `pnpm db:studio`               |

## Common scripts (root)

| Command             | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `pnpm setup:env`    | Copy `.env.example` → `.env` for all packages          |
| `pnpm dev`          | Run all apps in watch mode (Turborepo)                 |
| `pnpm build`        | Build all apps/packages                                |
| `pnpm lint`         | Lint everything                                        |
| `pnpm typecheck`    | Type-check everything                                  |
| `pnpm test`         | Backend unit tests only (Vitest) — does **not** run E2E |
| `pnpm test:e2e`     | Frontend E2E tests (Playwright, desktop + mobile)      |
| `pnpm test:all`     | Backend unit tests, then E2E (kept separate; E2E needs a build) |
| `pnpm format`       | Prettier write                                         |
| `pnpm db:migrate`   | Create/apply a Prisma migration                        |
| `pnpm db:seed`      | Seed demo data (studio + game + devlog)                |
| `pnpm db:studio`    | Open Prisma Studio                                     |

## Frontend E2E tests

```bash
# Install browsers (first time only)
pnpm exec playwright install chromium

# Run all projects (desktop + mobile)
pnpm --filter @playmorrow/web test:e2e

# Desktop only
pnpm --filter @playmorrow/web test:e2e --project=desktop

# With browser UI
pnpm --filter @playmorrow/web test:e2e:headed

# Dev mode — serves with `next dev` (hot reload, no production build) for fast
# iteration while writing a UI fix and its test. CI uses the production build.
pnpm --filter @playmorrow/web test:e2e:dev
```

The default run builds and serves the app with `next start` (the production
build, 3–5 min). `test:e2e:dev` (`PLAYWRIGHT_DEV=1`) skips the build and serves
with `next dev` instead — much faster to iterate, though behaviour can differ
slightly from the shipped build. Note `NEXT_PUBLIC_*` env is inlined at build
time, so the Playwright `webServer.env` override only takes effect in dev mode.

Tests use **mocked API** — no database or backend required.

> `pnpm test` runs backend Vitest only; E2E is a separate command (it needs a
> production build). Use `pnpm test:all` to run both, as CI does.

### Ports

| Port | Process                          |
| ---- | -------------------------------- |
| 3000 | Web dev server (`pnpm dev`)      |
| 3099 | Web server for E2E (Playwright)  |
| 4000 | API (NestJS)                     |

Playwright owns the 3099 server for the duration of a run. If a previous run
left a process wedged on the port, clear it with
`pnpm --filter @playmorrow/web clean-port` (override the port via `PLAYWRIGHT_PORT`).

## Features

### Public

| Page | Route |
| ---- | ----- |
| Home (feed preview + latest games) | `/` |
| Explore games (search, pagination) | `/games` |
| Game detail (devlogs, roadmap, media, press kit) | `/games/[slug]` |
| Studio detail (members, games, followers) | `/studios/[slug]` |
| Devlog detail (body, comments, reactions) | `/devlogs/[id]` |
| Public feed | `/feed/public` |

### Authenticated

| Page | Route |
| ---- | ----- |
| Login / Register | `/login` · `/register` |
| Dashboard | `/dashboard` |
| Create / Edit studio | `/studios/new` · `/dashboard/studios/[slug]` |
| Create / Edit game | `/dashboard/games/new` · `/dashboard/games/[slug]` |
| Write / Edit devlog | `/dashboard/devlogs/new` · `/dashboard/devlogs/[id]` |
| Manage roadmap | `/dashboard/roadmap` |
| Manage press kit | `/dashboard/games/[slug]/press-kit` |
| Personalized feed | `/dashboard/feed` |
| Notifications | `/dashboard/notifications` |

### Follow, comment, react

- Follow/unfollow studios and games
- Comment on devlogs (including threaded replies)
- Edit/delete own comments
- React to devlogs and comments (LIKE, LOVE, HYPE, INSIGHTFUL)

## Data model

`users` · `studios` · `studio_members` · `games` · `game_media` · `devlogs` ·
`roadmap_items` · `press_kits` · `follows` · `comments` · `reactions` · `tags` ·
`game_tags` · `platform_links` · `moderation_reports` · `notifications`

See [`packages/database/prisma/schema.prisma`](packages/database/prisma/schema.prisma).

## Known issues

All 34 known issues are catalogued in [`docs/handoff/`](docs/handoff/):

- [`HANDOFF.md`](docs/handoff/HANDOFF.md) — master index + progress log
- [`backend.md`](docs/handoff/backend.md) — #1–#11
- [`frontend.md`](docs/handoff/frontend.md) — #12–#29
- [`devx.md`](docs/handoff/devx.md) — #30–#34

## Status

🚧 **v0.3 — public beta.** All core CRUD + community features are implemented:
auth, studios, games, devlogs, roadmap, press kits, follows, comments, reactions,
notifications, personalized feed, and E2E test suite. Remaining work focuses on
hardening, CI, and optional features (search, realtime, uploads).
