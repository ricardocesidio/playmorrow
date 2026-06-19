# Playmorrow

**Discover tomorrow's indie games today.**

Playmorrow is a curated social platform where indie studios showcase their games, share development logs, publish roadmaps, grow communities, and connect with players, press, streamers, and publishers. It is the *social discovery layer* for indie games — not a store. Steam is where people buy; itch.io is where people upload; Discord is where communities talk; **Playmorrow is where studios build their public presence.**

## The product

Playmorrow lets anyone browse an evolving catalogue of indie games in development, follow studios and games to receive live updates, read devlogs, comment and react, and discover upcoming titles before they ship.

For studios, Playmorrow provides a complete toolkit:

- **Studio profiles** — brand page with logo, banner, description, team, location, and website
- **Game profiles** — cover art, screenshots, trailers, tags, platform links, pricing, status, and roadmap
- **Devlogs** — rich-text or markdown development journals with cover images and threaded comments
- **Roadmaps** — visual timeline of planned, in-progress, and completed features
- **Press kits** — structured fact sheets with media assets for journalists and publishers
- **Image uploads** — cover art, banners, screenshots, and logos served via the API
- **Real-time notifications** — followers are notified of new devlogs, roadmap updates, and replies via SSE

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (React 19, TypeScript, Tailwind CSS v4) |
| Backend | NestJS 11 (TypeScript, class-validator, Passport) |
| ORM / DB | Prisma 6 + PostgreSQL 16 |
| Auth | JWT (argon2 hashing), refresh token rotation, OAuth 2.0 (Google, GitHub) |
| API | RESTful, auto-documented via Swagger/OpenAPI at `/docs` |
| Data fetching | TanStack Query v5 (React Query) |
| State | Server state via React Query; auth via React context + localStorage |
| Realtime | Server-Sent Events (SSE) for push notifications |
| Testing | Vitest (241+ backend tests), Playwright (62 E2E tests, 2 projects) |
| Component previews | Storybook 10 (9 stories covering all shared components) |
| Icons | Lucide React |
| Fonts | Space Grotesk (display), JetBrains Mono (technical), Inter (body) via next/font |
| Build | Turborepo + pnpm workspaces |

## Visual identity

The interface uses an **obsidian-black** background with **graphite** elevated surfaces, **cyan** for information and active states, **coral-red** for primary actions, and **violet/amber** for secondary statuses. Typography is geometric (Space Grotesk) with monospaced (JetBrains Mono) labels and telemetry text. Panels feature clipped corners, thin technical borders, and subtle circuit-line SVG decorations. No glassmorphism, no gradient blobs, no rounded cards.

## Routes

### Public pages

| Page | Route | Description |
|---|---|---|
| Home | `/` | Hero, latest games grid, live activity feed, stats |
| Browse games | `/games` | Infinite-scroll catalogue with search, tag filtering |
| Game detail | `/games/[slug]` | Cover, description, media gallery (lightbox), devlogs, roadmap, platform links, stats |
| Studios directory | `/studios` | Searchable directory of all studios |
| Studio detail | `/studios/[slug]` | Banner, logo, stats cards, team, games |
| Devlog detail | `/devlogs/[id]` | Body with rich text, comments, reactions |
| Live feed | `/feed` | Recent devlogs and roadmap updates from all studios |
| Search | `/search` | Global search across games, studios, and devlogs |
| User profile | `/users/[username]` | Avatar, bio, role badge, studio memberships |
| Sign in | `/login` | Email/password login with OAuth buttons |
| Create account | `/register` | Registration form |
| OAuth callback | `/oauth/callback` | Handles Google/GitHub OAuth redirects |

### Authenticated pages (dashboard)

| Page | Route |
|---|---|
| Dashboard | `/dashboard` |
| Create / Edit studio | `/studios/new` · `/dashboard/studios/[slug]` |
| Create / Edit game | `/dashboard/games/new` · `/dashboard/games/[slug]` |
| Create / Edit devlog | `/dashboard/devlogs/new` · `/dashboard/devlogs/[id]` |
| Manage roadmap | `/dashboard/roadmap` |
| Manage press kit | `/dashboard/games/[slug]/press-kit` |
| Personalized feed | `/dashboard/feed` |
| Notifications | `/dashboard/notifications` |
| Manage following | `/dashboard/following` |
| Moderation reports | `/dashboard/reports` |

### Community features

- Follow/unfollow studios and games
- Comment on devlogs (threaded replies, edit, delete)
- React to devlogs and comments (LIKE, LOVE, HYPE, INSIGHTFUL)
- OAuth sign-in with Google and GitHub
- Real-time notification badges via SSE stream
- Image uploads (local disk, 10 MB limit, image-only)
- Rate-limited endpoints (60 req/min global, tighter per-route limits)
- Moderation reports with review workflow

## Data model

```
users → studio_members → studios → games → game_media
                                    → devlogs → comments
                                             → reactions
                                    → roadmap_items
                                    → press_kits
                                    → platform_links
                                    → game_tags → tags
studios → follows
games → follows
users → notifications
users → moderation_reports
```

16 models in total. Full Prisma schema at [`packages/database/prisma/schema.prisma`](packages/database/prisma/schema.prisma).

## Monorepo layout

```
playmorrow/
├── apps/
│   ├── web/          Next.js 15 frontend (React 19, Tailwind v4, TanStack Query)
│   └── api/          NestJS 11 backend (Prisma, JWT, Swagger)
├── packages/
│   ├── database/     Prisma schema, migrations, seed, generated client
│   ├── types/        Shared TypeScript types and API contracts
│   └── config/       Shared ESLint, tsconfig, and Prettier presets
├── turbo.json        Turborepo pipeline configuration
└── package.json      Root workspace config (pnpm workspaces)
```

Tooling: **pnpm 11** workspaces + **Turborepo 2**.

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment (skips existing files)
pnpm setup:env
#   Edit the generated files and set at least:
#     - DATABASE_URL   (in .env and packages/database/.env)
#     - JWT_SECRET     (apps/api/.env) — required; API refuses to boot without it.
#   Optional (for OAuth):
#     - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
#     - GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET

# 3. Start Postgres (if using Docker)
docker compose up -d

# 4. Generate Prisma client + run migration
pnpm db:generate
pnpm db:migrate

# 5. Start development (runs web + API in parallel)
pnpm dev
```

| Service | URL |
|---|---|
| Web (Next.js) | http://localhost:3000 |
| API (NestJS) | http://localhost:4000 |
| API docs | http://localhost:4000/docs |
| Prisma Studio | `pnpm db:studio` |

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run all apps in watch mode (Turborepo) |
| `pnpm build` | Build all apps/packages |
| `pnpm lint` | Lint everything |
| `pnpm typecheck` | Type-check everything |
| `pnpm test` | Backend unit tests only (Vitest) — does not run E2E |
| `pnpm test:e2e` | Frontend E2E tests (Playwright, desktop + mobile, 62 tests) |
| `pnpm test:all` | Backend unit tests, then E2E |
| `pnpm test:e2e:dev` | E2E with `next dev` (hot reload, no production build) |
| `pnpm test:e2e:snapshots` | Update visual snapshot baselines |
| `pnpm storybook` | Storybook dev server (port 6006) |
| `pnpm storybook:build` | Build static Storybook to `storybook-static/` |
| `pnpm format` | Prettier write |
| `pnpm setup:env` | Copy `.env.example` → `.env` for all packages |
| `pnpm db:migrate` | Create/apply a Prisma migration |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:generate` | Regenerate Prisma Client |

### E2E testing details

```bash
# Install browsers (first time only)
pnpm exec playwright install chromium

# Run all projects (desktop + mobile)
pnpm --filter @playmorrow/web test:e2e

# Desktop only
pnpm --filter @playmorrow/web test:e2e --project=desktop

# With browser UI
pnpm --filter @playmorrow/web test:e2e:headed

# Dev mode (fast iteration, no production build)
pnpm --filter @playmorrow/web test:e2e:dev
```

Tests use **mocked API** (Playwright route interception) — no database or backend required. The production build is used by default (3–5 min). Dev mode (`PLAYWRIGHT_DEV=1`) serves via `next dev` for faster iteration.

### Ports

| Port | Process |
|---|---|
| 3000 | Web dev server (`pnpm dev`) |
| 3099 | Web server for E2E (Playwright) |
| 4000 | API (NestJS) |
| 6006 | Storybook |

## Architecture notes

- **Backend**: NestJS module-per-domain. Controllers are thin; services hold business logic. DTOs use `class-validator` decorators. Tests use an in-memory SQLite database via Prisma (or Postgres in CI).
- **Frontend**: Next.js 15 App Router with React 19. TanStack Query hooks are centralized in `lib/api/hooks.ts` (50+ hooks). The typed fetch wrapper is `lib/api/client.ts`. Auth state lives in `lib/api/auth-context.tsx`.
- **Auth flow**: JWT access token (15 min) + rotating refresh token (30 days, DB-backed, sha256-hashed). Silent refresh on 401. OAuth via Passport strategies (Google, GitHub) with account linking by verified email.
- **Real-time**: SSE endpoint (`GET /api/me/notifications/stream`) pushes unread counts via RxJS Subject. Frontend EventSource updates the Query cache. 60s polling kept as fallback.
- **Storage**: Image uploads use local disk (multer). Served via Express static at `/api/uploads/*`. Swap for S3/R2 when needed.
- **E2E strategy**: All API calls are intercepted by Playwright route handlers (`e2e/fixtures/mocks.ts`). No database or backend needed. The production Next.js server is started by Playwright's `webServer` config.
- **Mock mode** (frontend development): `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local` enables a dev-only mock client that returns deterministic data without a running backend.

## Prerequisites

- Node.js >= 22.13 (required by pnpm 11)
- pnpm >= 11
- PostgreSQL 16 (Docker or hosted via Neon/Supabase)
- Docker (optional, for local Postgres)

## Issue catalogue

All 34 known issues are catalogued in [`docs/handoff/`](docs/handoff/):
**31 DONE · 2 DEFERRED** (email verification, password reset):

- [`HANDOFF.md`](docs/handoff/HANDOFF.md) — master index, progress log, execution plan
- [`backend.md`](docs/handoff/backend.md) — issues #1–#11
- [`frontend.md`](docs/handoff/frontend.md) — issues #12–#29
- [`devx.md`](docs/handoff/devx.md) — issues #30–#34

## License and status

🚧 **v0.6 — public beta.** Feature-complete for MVP. All core CRUD and community features are implemented. Deferred features: email verification, password reset. No active sprint — project is in maintenance and handoff state.
