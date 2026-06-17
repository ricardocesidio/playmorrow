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
| Frontend    | Next.js + React + TypeScript                                  |
| Styling     | Tailwind CSS v4 + shadcn/ui                                   |
| Data (FE)   | TanStack Query, React Hook Form + Zod _(added per feature)_   |
| Backend     | NestJS + TypeScript                                           |
| ORM / DB    | Prisma + PostgreSQL                                           |
| Auth        | JWT/session (roles: player, studio member/admin, mod, pub)    |
| API docs    | OpenAPI (Swagger) at `/docs`                                  |
| Testing     | Vitest (unit), Playwright (E2E)                               |
| Later       | Meilisearch/Typesense (search), Redis + BullMQ (jobs)         |

## Prerequisites

- Node `>=20` (you have v24)
- pnpm `>=11`
- A Postgres database — either:
  - **Docker** (recommended for local): `docker compose up -d` (see `docker-compose.yml`)
  - **or hosted**: a [Neon](https://neon.tech) / [Supabase](https://supabase.com) connection string

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
#   -> set DATABASE_URL (Docker default works out of the box)

# 3. Start Postgres (if using Docker)
docker compose up -d

# 4. Generate Prisma client + run the first migration
pnpm db:generate
pnpm db:migrate        # creates tables from packages/database/prisma/schema.prisma

# 5. Run everything in dev (Turborepo runs web + api together)
pnpm dev
```

| Service        | URL                            |
| -------------- | ------------------------------ |
| Web (Next.js)  | http://localhost:3000          |
| API (NestJS)   | http://localhost:4000          |
| API docs       | http://localhost:4000/docs     |
| Prisma Studio  | `pnpm db:studio`               |

## Common scripts (root)

| Command             | Description                                   |
| ------------------- | --------------------------------------------- |
| `pnpm dev`          | Run all apps in watch mode (Turborepo)        |
| `pnpm build`        | Build all apps/packages                       |
| `pnpm lint`         | Lint everything                               |
| `pnpm typecheck`    | Type-check everything                         |
| `pnpm test`         | Run unit tests                                |
| `pnpm format`       | Prettier write                                |
| `pnpm db:migrate`   | Create/apply a Prisma migration               |
| `pnpm db:studio`    | Open Prisma Studio                            |

## Data model (V1)

`users` · `studios` · `studio_members` · `games` · `game_media` · `devlogs` ·
`roadmap_items` · `press_kits` · `follows` · `comments` · `reactions` · `tags` ·
`game_tags` · `platform_links` · `moderation_reports`

See [`packages/database/prisma/schema.prisma`](packages/database/prisma/schema.prisma).

## Status

🚧 **v0.1 — foundation scaffold.** Monorepo, schema, and app skeletons are in place.
Feature work (auth, studio/game pages, devlogs, explore, moderation) comes next.
