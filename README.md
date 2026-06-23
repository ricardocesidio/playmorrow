# Playmorrow

**Discover tomorrow's indie games today.**

Playmorrow is a curated social platform where indie studios showcase their games,
share development logs, publish roadmaps, grow communities, and connect with players,
press, streamers, and publishers.

### For studios

Playmorrow gives indie studios a professional public presence — not just a store page.
Create a studio profile, publish devlogs with rich text and images, maintain a roadmap,
share press kits, and build a following. Every studio gets analytics-ready engagement
metrics and real-time notifications when followers interact.

### For players

Follow the games you care about. Get live updates when studios post devlogs, hit
milestones, or update their roadmap. Comment, react, save games to your private wishlist,
and be part of the development journey before the game ships.

### The market gap

- **Steam** is where people buy
- **itch.io** is where people upload
- **Discord** is where communities talk
- **Playmorrow** is where studios build their public presence and grow their audience

- **Studio profiles** — brand page with logo, banner, description, team, location, and website
- **Game profiles** — cover art, screenshots, trailers, tags, platform links, pricing, status, and roadmap
- **Devlogs** — rich-text or markdown development journals with cover images and threaded comments
- **Roadmaps** — visual timeline of planned, in-progress, and completed features
- **Press kits** — structured fact sheets with media assets for journalists and publishers
- **Image uploads** — cover art, banners, screenshots, and logos served via the API
- **Real-time notifications** — followers are notified of new devlogs, roadmap updates, and replies via SSE
- **Private wishlist** — save games you're interested in (only you can see your list)

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (React 19, TypeScript, Tailwind CSS v4) |
| Backend | NestJS 11 (TypeScript, class-validator, Passport) |
| ORM / DB | Prisma 6 + PostgreSQL 16 (Neon serverless in production) |
| Auth | Opaque session cookies (SHA-256 hashed, httpOnly, SameSite=Lax) + JWT (legacy) |
| API | RESTful, auto-documented via Swagger/OpenAPI at `/docs` |
| Data fetching | TanStack Query v5 (React Query) |
| State | Server state via React Query; auth via React context + session cookies |
| Realtime | Server-Sent Events (SSE) for push notifications (no token in URL) |
| Testing | Vitest (174+ backend tests, 14 suites), Playwright (62 E2E tests, 2 projects) |
| Component previews | Storybook 10 (9 stories covering all shared components) |
| Icons | Lucide React |
| Fonts | Space Grotesk (display), JetBrains Mono (technical), Inter (body) via next/font |
| Build | Turborepo + pnpm workspaces |
| Deployment | Vercel (frontend) + Render (API) + Neon (database) |

## Visual identity

The interface uses an **obsidian-black** background with **graphite** elevated surfaces, **cyan** for information and active states, **coral-red** for primary actions, and **violet/amber** for secondary statuses. Typography is geometric (Space Grotesk) with monospaced (JetBrains Mono) labels and telemetry text. Panels feature clipped corners, thin technical borders, and subtle circuit-line SVG decorations. No glassmorphism, no gradient blobs, no rounded cards.

## Security

- **Session-based auth**: Opaque server-side sessions stored in DB (SHA-256 hashed tokens). No JWTs in localStorage — eliminates XSS token theft.
- **httpOnly/Secure/SameSite=Lax cookies**: Session ID is only readable by the server. CSRF protection via SameSite policy.
- **Session revocation**: Server can revoke individual sessions or all sessions for a user.
- **Email verification**: Verification tokens with expiry before accounts are fully activated.
- **Password reset**: Time-limited reset tokens with secure one-time use.
- **Account lockout**: 5 failed attempts triggers 15-minute lockout.
- **Password policy**: Min 8 chars + special character required. Common password blocklist.
- **Rate limiting**: 60 req/min global. Tighter limits on auth (5/min), upload (5/min), search (30/min), etc.
- **Content Security Policy**: Helmet-configured CSP with `'self'` restrictions. `style-src 'unsafe-inline'` for Next.js compatibility.
- **Upload validation**: MIME type check + magic byte signature verification (no extension-only checks).
- **OAuth**: Token exchange handled server-side via session cookies (no tokens in URL redirects).
- **CORS**: Whitelisted origin configured via `WEB_ORIGIN` env var.

## Routes

### Public pages

| Page | Route | Description |
|---|---|---|
| Home | `/` | Hero, latest games grid, live activity feed, stats |
| Browse games | `/games` | Infinite-scroll catalogue with genre/platform/release/sort filters |
| Game detail | `/games/[slug]` | Cover, description, media gallery (lightbox), devlogs, roadmap, platform links, stats |
| Studios directory | `/studios` | Searchable directory of all studios |
| Studio detail | `/studios/[slug]` | Banner, logo, stats cards, team, games |
| Devlog detail | `/devlogs/[id]` | Body with rich text, comments, reactions |
| Live feed | `/feed` | Recent devlogs and roadmap updates from all studios |
| Search | `/search` | Global search across games, studios, and devlogs |
| User profile | `/users/[username]` | Avatar, bio, role badge, studio memberships |
| Sign in | `/login` | Email/password login with OAuth buttons |
| Create account | `/register` | Player or Studio account type selection |
| Forgot password | `/forgot-password` | Request password reset email |
| Reset password | `/reset-password` | Set new password with reset token |
| Verify email | `/verify-email` | Email verification after registration |
| OAuth callback | `/oauth/callback` | Handles Google/GitHub OAuth redirects |

### Authenticated pages (dashboard)

| Page | Route |
|---|---|
| Dashboard | `/dashboard` (personalized copy by account type) |
| Onboarding welcome | `/welcome` |
| Create / Edit studio | `/studios/new` · `/dashboard/studios/[slug]` |
| Create / Edit game | `/dashboard/games/new` · `/dashboard/games/[slug]` |
| Create / Edit devlog | `/dashboard/devlogs/new` · `/dashboard/devlogs/[id]` |
| Manage roadmap | `/dashboard/roadmap` |
| Manage press kit | `/dashboard/games/[slug]/press-kit` |
| Personalized feed | `/dashboard/feed` |
| Notifications | `/dashboard/notifications` |
| Manage following | `/dashboard/following` |
| My wishlist | `/dashboard/wishlist` |
| Moderation reports | `/dashboard/reports` (admin) |
| Profile edit | `/dashboard/profile` |
| Account deletion | `/dashboard/delete-account` |

### Community features

- Follow/unfollow studios and games
- Private game wishlist (only you can see your saved games)
- Comment on devlogs (threaded replies, edit, delete)
- React to devlogs and comments (LIKE, LOVE, HYPE, INSIGHTFUL)
- OAuth sign-in with Google and GitHub
- Real-time notification badges via SSE stream
- Image uploads (local disk, 10 MB limit, magic byte validation)
- Rate-limited endpoints (60 req/min global, tighter per-route limits)
- Moderation reports with review/resolve/dismiss workflow

### Account types

| Type | For | Features |
|---|---|---|
| **Player** | Normal users | Follow, comment, react, wishlist games, build feed |
| **Studio / Indie Creator** | Indie devs, studios, publishers | Create studio profile, publish games, devlogs, roadmaps, press kits |

Account type is **onboarding intent only** — it does not grant permissions. All authorization is enforced server-side via studio membership roles. A Player can create a studio and become an Owner.

## Data model

```
users → session_tokens
      → studio_members → studios → games → game_media
                                       → devlogs → comments
                                                → reactions
                                       → roadmap_items
                                       → press_kits
                                       → platform_links
                                       → wishlist_items
                                       → game_tags → tags
      → verification_tokens
      → password_reset_tokens
      → follows (studios + games)
      → notifications
      → moderation_reports
```

19 models in total. Full Prisma schema at [`packages/database/prisma/schema.prisma`](packages/database/prisma/schema.prisma).

## Monorepo layout

```
playmorrow/
├── apps/
│   ├── web/          Next.js 15 frontend (React 19, Tailwind v4, TanStack Query)
│   └── api/          NestJS 11 backend (Prisma, session auth, Swagger)
├── packages/
│   ├── database/     Prisma schema, migrations, seed, generated client
│   ├── types/        Shared TypeScript types and API contracts
│   └── config/       Shared ESLint, tsconfig, and Prettier presets
├── turbo.json        Turborepo pipeline configuration
├── vercel.json       Vercel deployment config (web app)
├── render.yaml       Render deployment config (API)
├── railway.json      Railway deployment config (Dockerfile fallback)
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
#     - SESSION_SECRET (apps/api/.env) — required for session cookies.
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

### Mock mode (frontend-only development)

Set `NEXT_PUBLIC_USE_MOCKS=true` in `apps/web/.env.local` to use deterministic mock data
without a running backend.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run all apps in watch mode (Turborepo) |
| `pnpm build` | Build all apps/packages |
| `pnpm lint` | Lint everything |
| `pnpm typecheck` | Type-check everything |
| `pnpm test` | Backend unit tests only (Vitest) |
| `pnpm test:e2e` | Frontend E2E tests (Playwright, desktop + mobile, 62 tests) |
| `pnpm test:all` | Backend unit tests, then E2E |
| `pnpm test:e2e:dev` | E2E with `next dev` (hot reload, no production build) |
| `pnpm test:e2e:snapshots` | Update visual snapshot baselines |
| `pnpm storybook` | Storybook dev server (port 6006) |
| `pnpm storybook:build` | Build static Storybook to `storybook-static/` |
| `pnpm format` | Prettier write |
| `pnpm setup:env` | Copy `.env.example` → `.env` for all packages |
| `pnpm db:migrate` | Create/apply a Prisma migration |
| `pnpm db:deploy` | Apply pending migrations to production |
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

- **Backend**: NestJS module-per-domain. Controllers are thin; services hold business logic. DTOs use `class-validator` decorators. Module imports are explicit (AuthModule/SessionModule for guards). SessionModule is global for SessionService DI.
- **Frontend**: Next.js 15 App Router with React 19. TanStack Query hooks are centralized in `lib/api/hooks.ts` (50+ hooks). The typed fetch wrapper is `lib/api/client.ts`. Auth state lives in `lib/api/auth-context.tsx` (session-cookie-based).
- **Auth flow**: Opaque session cookies (SHA-256 hashed tokens, httpOnly/Secure/SameSite=Lax). Login creates a session record and sets the cookie. SessionAuthGuard resolves the session and injects the user. No JWTs in localStorage.
- **Email verification**: Users register with `isVerified: false`. A VerificationToken is created. The verify-email endpoint marks the user as verified.
- **Password reset**: Forgot-password creates a time-limited PasswordResetToken. Reset-password consumes it and revokes all sessions.
- **Account lockout**: 5 consecutive failed login attempts on an email locks the account for 15 minutes.
- **Real-time**: SSE endpoint (`GET /api/me/notifications/stream`) pushes unread counts via RxJS Subject. Frontend EventSource updates the Query cache. 60s polling kept as fallback. Token is NOT passed in the URL — uses `withCredentials: true`.
- **Storage**: Image uploads use local disk (multer). Served via Express static at `/api/uploads/*`. Configurable via `UPLOADS_DIR` env var. Magic byte validation prevents MIME mismatch.
- **E2E strategy**: All API calls are intercepted by Playwright route handlers (`e2e/fixtures/mocks.ts`). No database or backend needed. The production Next.js server is started by Playwright's `webServer` config.
- **Mock mode** (frontend development): `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local` enables a dev-only mock client that returns deterministic data without a running backend.

## Deployment

### Production URLs

| Service | URL |
|---|---|
| Frontend | https://playmorrow.vercel.app |
| API | https://playmorrow-api.onrender.com |
| Database | Neon PostgreSQL (eu-west-2) |

### Frontend (Vercel)

- Project configured via root `vercel.json` with `rootDirectory: apps/web`
- Auto-deploys from `main` branch via GitHub integration
- Build: `turbo run build --filter=@playmorrow/web...`
- Node.js 24 (Vercel default)
- Environment variables set via Vercel dashboard:
  - `NEXT_PUBLIC_API_URL` — API base URL (Render)
  - `NEXT_PUBLIC_SITE_URL` — canonical site URL
  - `NEXT_PUBLIC_USE_MOCKS` — `false` in production

### API (Render)

- Web Service configured via `render.yaml` with Node 22
- Build: `pnpm exec turbo run build --filter=@playmorrow/api^...`
- Start: `node apps/api/dist/main.js`
- Healthcheck: `/health`
- Environment variables set via Render dashboard:
  - `DATABASE_URL` — Neon connection string
  - `JWT_SECRET`, `SESSION_SECRET` — strong random secrets
  - `WEB_ORIGIN` — frontend URL (CORS origin)
  - `NODE_ENV` — `production`
  - `UPLOADS_DIR` — `/var/data/uploads`

### Database (Neon)

- Serverless PostgreSQL (eu-west-2)
- Migrations applied via `pnpm db:deploy` with production `DATABASE_URL`
- 9 migrations covering all 19 models

## Prerequisites

- Node.js >= 22.13 (required by pnpm 11)
- pnpm >= 11
- PostgreSQL 16 (Docker or hosted via Neon/Supabase)
- Docker (optional, for local Postgres)

## Issue catalogue

All known issues are catalogued in [`docs/handoff/`](docs/handoff/):

- [`HANDOFF.md`](docs/handoff/HANDOFF.md) — master index, progress log, execution plan
- [`backend.md`](docs/handoff/backend.md) — backend issues
- [`frontend.md`](docs/handoff/frontend.md) — frontend issues
- [`devx.md`](docs/handoff/devx.md) — developer experience issues

## License

**All Rights Reserved.** Playmorrow is proprietary software. See [LICENSE](LICENSE) for details.

---

*Playmorrow — Discover tomorrow's indie games today.*
