# Playmorrow

**Discover tomorrow's indie games today.**

Playmorrow is a curated social platform where indie studios showcase their games,
share development logs, publish roadmaps, grow communities, and connect with players,
press, streamers, and publishers.

## For studios

Playmorrow gives indie studios a professional public presence — not just a store page.
Create a studio profile, publish devlogs, maintain a roadmap, share press kits,
and build a following with real-time engagement metrics and notifications.

**Studio management:** Multi-member teams with role-based access (Owner, Admin, Moderator).
Invite team members by email or search, manage permissions, transfer ownership,
and communicate via an internal team feed with automatic activity updates.

## For players

Follow the games you care about. Get live updates when studios post devlogs, hit
milestones, or update their roadmap. Comment, react, save games to your private wishlist,
and be part of the development journey before the game ships.

## Platform features

### Studio tools
- **Studio profiles** — brand page with logo, banner, description, team, location
- **Game profiles** — cover art, screenshots, trailers, tags, platform links, status, roadmap
- **Devlogs** — development journals with rich text and threaded comments
- **Roadmaps** — visual timeline of planned, in-progress, and completed features
- **Press kits** — structured fact sheets for journalists and publishers
- **Team management** — role-based access control (Owner, Admin, Moderator, Member), invitations, audit logging
- **Team feed** — internal chat with automatic activity updates
- **Level & XP system** — gamified studio progression based on engagement
- **Studio Dashboard** — aggregated analytics (weekly deltas, views over time, follower growth), real-time stats cards, activity feed

### Community features
- Follow/unfollow studios and games
- Private game wishlist
- Comment on devlogs with threaded replies
- React to devlogs and comments (multiple reaction types)
- OAuth sign-in with Google and GitHub
- Real-time notification badges (SSE)
- Email verification and password recovery
- Email change with 2-change limit
- Rate-limited endpoints and moderation reporting
- Player dashboard with XP tracking, level-up toasts, achievements, and activity feed

### Account types

| Type | Role | Purpose |
|---|---|---|---|
| **Player** | `PLAYER` | Discover games, follow studios, comment, wishlist, build feed |
| **Studio** | `PUBLISHER` | Publish games, devlogs, roadmaps, press kits, manage team |
| **Moderator** | `MODERATOR` | Moderate content, review reports |
| **Admin** | `ADMIN` | Full platform administration |

Account type is selected during onboarding. A Player can later create a studio and become an Owner.

## Visual identity

Obsidian-black backgrounds, graphite elevated surfaces, cyan for interactive states,
coral-red for actions, and geometric typography with monospaced technical labels.
Clipped corners, thin technical borders, and subtle grid overlays define the aesthetic.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + React + TypeScript + Tailwind CSS |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL with Prisma ORM |
| Auth | Session-based with OAuth providers |
| Realtime | Server-Sent Events |
| Icons | Lucide React |
| Fonts | Space Grotesk, JetBrains Mono, Inter |
| Build | Turborepo + pnpm workspaces |
| Deployment | Vercel (frontend) + Render (API) |

## Monorepo structure

```
playmorrow/
├── apps/
│   ├── web/          Next.js frontend
│   └── api/          NestJS backend
├── packages/
│   ├── database/     Schema, migrations, seed data
│   └── types/        Shared TypeScript types
├── turbo.json        Build pipeline
└── package.json      Workspace config
```

## Getting started

```bash
# Install dependencies
pnpm install

# Set up environment (edit generated files)
pnpm setup:env

# Start Postgres (Docker)
docker compose up -d

# Generate Prisma client + migrate
pnpm db:generate
pnpm db:migrate

# Start development (web + API in parallel)
pnpm dev
```

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| API docs | http://localhost:4000/docs |

### Mock mode

Set `NEXT_PUBLIC_USE_MOCKS=true` in `apps/web/.env.local` to develop the frontend
without a running backend.

## Development scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run all apps in watch mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint everything |
| `pnpm typecheck` | Type-check everything |
| `pnpm test` | Backend unit tests |
| `pnpm test:e2e` | Frontend E2E tests (Playwright) |
| `pnpm db:migrate` | Create/apply a Prisma migration |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:generate` | Regenerate Prisma Client |

## Prerequisites

- Node.js >= 22.13
- pnpm >= 11
- PostgreSQL 16 (Docker or hosted)
- Docker (optional, for local Postgres)

## License

**All Rights Reserved.** Playmorrow is proprietary software. Unauthorized copying,
modification, distribution, or use of this software is strictly prohibited.
See [LICENSE](LICENSE) for details.

---

*Playmorrow — Discover tomorrow's indie games today.*
