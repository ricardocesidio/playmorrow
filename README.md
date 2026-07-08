# Playmorrow

**Discover tomorrow's indie games today.**

Playmorrow is a curated social platform where indie studios showcase their games,
share development logs, publish roadmaps, grow communities, and connect with players,
press, streamers, and publishers.

---

## Table of Contents

- [For Studios](#for-studios)
- [For Players](#for-players)
- [Platform Features](#platform-features)
- [Visual Identity](#visual-identity)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Getting Started](#getting-started)
- [Development Scripts](#development-scripts)
- [Demo Data](#demo-data)
- [Architecture](#architecture)
- [Database](#database)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [License](#license)

---

## For Studios

Playmorrow gives indie studios a professional public presence — not just a store page.
Create a studio profile, publish devlogs, maintain a roadmap, share press kits,
and build a following with real-time engagement metrics and notifications.

**Studio management:** Multi-member teams with role-based access (Owner, Admin, Moderator).
Invite team members by email or search, manage permissions, transfer ownership,
and communicate via an internal team feed with automatic activity updates.

**Studio Dashboard:**
- Aggregated analytics (weekly deltas, views over time, follower growth)
- Real-time stats cards (followers, wishlists, views, comments)
- Game management (create, edit, delete games)
- Roadmap CRUD with drag-to-reorder
- Devlog editor with Markdown support
- Press kit management
- Team management with role control
- Activity feed

---

## For Players

Follow the games you care about. Get live updates when studios post devlogs, hit
milestones, or update their roadmap. Comment, react, save games to your private wishlist,
and be part of the development journey before the game ships.

**Player Dashboard:**
- Wishlist management
- Following feed (studios & games)
- Real-time notifications
- XP & Level progression system
- Achievement tracking
- Profile settings
- Game discovery feed

**Level & XP System:** Players earn XP by following studios/games, wishlisting titles,
posting comments, reacting to content, and daily logins. Higher levels unlock prestige
titles (Newcomer → Regular → Supporter → Veteran → Legend).

---

## Platform Features

### Studio Tools
- **Studio profiles** — brand page with logo, banner, description, team, location
- **Game profiles** — cover art, screenshots, trailers, tags, platform links, status, roadmap
- **Devlogs** — development journals with rich text and threaded comments
- **Roadmaps** — visual timeline of planned, in-progress, and completed features
- **Press kits** — structured fact sheets for journalists and publishers
- **Team management** — role-based access control (Owner, Admin, Moderator, Member), invitations, audit logging
- **Image upload** — PNG/JPG upload for screenshots, covers, logos, and banners (max 10 per game)
- **Currency selector** — 12 currencies (USD, EUR, GBP, JPY, BRL, CAD, AUD, CHF, CNY, INR, KRW, MXN)
- **YouTube trailer** — embed trailers with automatic thumbnail generation
- **Fullscreen lightbox** — portal-rendered screenshot viewer with keyboard navigation (← → Esc)
- **Request to Join** — players can request studio membership; owners approve/reject
- **Studio Dashboard** — aggregated analytics with real-time stats and activity feed

### Community Features
- Follow/unfollow studios and games
- Private game wishlist
- Comment on devlogs with threaded replies
- React to devlogs and comments (LIKE, LOVE, HYPE, INSIGHTFUL)
- OAuth sign-in with Google and GitHub
- Email/password authentication with session management
- Real-time notification badges (SSE streaming)
- Email verification and password recovery
- Rate-limited endpoints and moderation reporting
- Cookie consent (Essential, Analytics, Marketing preferences)
- Responsive design — mobile, tablet, and desktop

### Visual & UX
- Full cyberpunk design system — cyan, coral, violet, amber palette
- Hexagonal grid backgrounds with CRT scanlines
- Glitch typography effects on headings
- Holographic card depth with multi-layer shadows
- Animated border scanning effects
- Custom cursor glow (blue + red radial gradient)
- Signal dots, corner brackets, circuit decorations
- Clipped-corner panels and buttons
- Space Grotesk (headings) + JetBrains Mono (body & UI)
- Full dark mode (forced)

### Account Types

| Type | Purpose |
|---|---|
| **Player** | Discover games, follow studios, comment, wishlist, build feed |
| **Studio** | Publish games, devlogs, roadmaps, press kits, manage team |
| **Moderator** | Moderate content, review reports |
| **Admin** | Full platform administration |

Account type is selected during onboarding. A Player can later create a studio and become an Owner.

---

## Visual Identity

**Direction:** Obsidian-black surfaces, restrained glow, technical framing, geometric typography, cyan/coral/violet/amber accent palette.

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#02070b` | Page background |
| `--elevated` | `#071117` | Panel backgrounds |
| `--card` | `#09161d` | Card backgrounds |
| `--cyan` | `#3ee7ff` | Primary accent, glows |
| `--coral` | `#ff574d` | Danger, CTA, live indicators |
| `--violet` | `#a65cff` | Secondary accent, alpha status |
| `--amber` | `#e4a83b` | Warning, pre-alpha status |
| `--success` | `#70ff9b` | Success state |
| `--error` | `#ff574d` | Error state |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 (utility-first design system) |
| Components | Custom `HudPanel`, `HudButton`, `HudStatusRail`, shadcn/ui base |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL with Prisma ORM (6.19) |
| Auth | Session-based (cookies) with OAuth providers (Google, GitHub) |
| Realtime | Server-Sent Events for notification streaming |
| Icons | Lucide React |
| Fonts | Space Grotesk (display) + JetBrains Mono (body/mono) |
| Build | Turborepo + pnpm workspaces |
| Testing | Playwright (E2E frontend) + Jest (unit backend) + Storybook (UI) |
| State | TanStack Query (React Query) |
| Forms | Native form actions + server actions + controlled inputs |
| Deployment | Vercel (frontend) + Railway (API) |

---

## Monorepo Structure

```
playmorrow/
├── apps/
│   ├── web/               Next.js 15 frontend (App Router)
│   │   ├── app/            Pages, layouts, API routes, server actions
│   │   ├── components/     Shared UI components
│   │   │   ├── dashboard/  PlayerDashboard, StudioDashboard
│   │   │   ├── playmorrow/ HUD design system (panels, frames, logos)
│   │   │   └── ui/         shadcn/ui button
│   │   ├── lib/            API client, auth context, hooks, utilities
│   │   └── public/         Static assets (images, demos)
│   └── api/                NestJS backend
│       └── src/
│           ├── auth/       Authentication (session, JWT, OAuth)
│           ├── games/      Game CRUD + roadmaps
│           ├── studios/    Studio management + team
│           ├── devlogs/    Development logs
│           ├── comments/   Threaded comments
│           ├── reactions/  Content reactions
│           ├── feed/       Activity feed
│           ├── notifications/  SSE notifications
│           ├── upload/     File upload (PNG/JPG with validation)
│           └── users/      User profiles + settings
├── packages/
│   ├── database/           Prisma schema, migrations, seed data
│   ├── types/              Shared TypeScript types
│   └── config/             Shared config (ESLint, TypeScript)
├── docs/
│   └── superpowers/
│       ├── specs/          Design specifications
│       └── plans/          Implementation plans
├── turbo.json              Build pipeline
└── package.json            Workspace config
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 22.13
- **pnpm** >= 11
- **PostgreSQL** 16 (Docker or hosted like Neon)
- **Docker** (optional, for local Postgres)

### Setup

```bash
# Clone and install
git clone https://github.com/ricardocesidio/playmorrow
cd playmorrow
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Edit .env files with your database URL and secrets
# Required vars: DATABASE_URL, JWT_SECRET, SESSION_SECRET

# Start PostgreSQL (if using Docker)
docker compose up -d

# Run database migrations
cd packages/database
npx prisma migrate deploy
cd ../..

# Seed demo data (5 games, 5 studios, tags, etc.)
pnpm db:seed

# Start development servers
pnpm dev
```

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| API docs (Swagger) | http://localhost:4000/docs |

### Demo Login

After seeding, log in with:
- **Email:** `dev@playmorrow.example`
- **Password:** `Demo123!@`

This account owns all 5 demo studios and manages all 5 demo games.

### Mock Mode

Set `NEXT_PUBLIC_USE_MOCKS=true` in `apps/web/.env.local` to develop the frontend
without a running backend. Mock mode provides 5 games with full data (screenshots,
trailers, tags, platforms).

---

## Development Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run all apps in watch mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint everything (ESLint) |
| `pnpm typecheck` | Type-check everything (TypeScript) |
| `pnpm test` | Backend unit tests (Jest) |
| `pnpm test:e2e` | Frontend E2E tests (Playwright) |
| `pnpm db:generate` | Regenerate Prisma Client |
| `pnpm db:migrate` | Create and apply a Prisma migration |
| `pnpm db:seed` | Seed demo data (5 games, 5 studios) |
| `pnpm storybook` | Launch Storybook component library |
| `pnpm clean` | Remove build artifacts |

---

## Demo Data

The seed script populates the database with:

**5 Games:**
| Game | Studio | Status | Price |
|---|---|---|---|
| Neon Warden | Obsidian Signal | BETA | $19.99 |
| Starfall Tactics | Ironlight Studios | ALPHA | $24.99 |
| Mossbound | Wildbriar | PRE_ALPHA | $14.99 |
| Paper Relics | Second Story Games | PRE_ALPHA | $9.99 |
| Voidrunner | Voidrunner Dev | CONCEPT | Free |

Each game includes: screenshots, trailer, roadmap items, tags, platform links,
press kit, devlog, and demo comments.

**5 Studios** with full profiles (logo, banner, description, location, verified status,
followers count, team members).

**19 curated tags** across genres, settings, features, and moods.

---

## Architecture

```
Browser (localhost:3000)
    │
    ▼
Next.js App Router
    │  /api/* → rewrite proxy → API
    │  /auth/* → server-side API routes
    │
    ▼
NestJS API (localhost:4000)
    │
    ▼
PostgreSQL (Prisma ORM)
```

**API Design:** RESTful with session-based authentication. File uploads use
multipart/form-data with magic byte validation. Notifications use Server-Sent Events.
All mutations return updated state. Read operations support pagination and filtering.

---

## Database

**PostgreSQL 16** with Prisma ORM for type-safe queries and migrations.

Key tables: `User`, `Studio`, `Game`, `Devlog`, `RoadmapItem`, `Comment`, `Reaction`,
`Follow`, `WishlistItem`, `Notification`, `Invitation`, `StudioMember`, `AuditLog`,
`PlayerXpEvent`, `Achievement`, `Report`, `GameMedia`, `PlatformLink`, `PressKit`,
`CookiePreference`.

23 migrations tracking schema evolution from initial setup through notifications,
OAuth, wishlists, comments, onboarding, studio roles, XP, push subscriptions, and indexes.

---

## Authentication

- **Session-based** with httpOnly cookies (`playmorrow_session`)
- Cookie attributes: `HttpOnly`, `Secure` (production), `SameSite=Lax` (dev)
- **OAuth providers:** Google, GitHub
- **Email verification:** 6-digit codes via Resend
- **Password recovery:** Email-based reset flow
- **CSRF protection:** Rate-limited endpoints with IP-based throttling
- **Session management:** List active sessions, logout individual or all

---

## Deployment

### Production Stack
- **Frontend:** [Vercel](https://vercel.com) — Next.js with edge functions
- **API:** [Railway](https://railway.app) — NestJS with auto-deploy from GitHub
- **Database:** [Neon](https://neon.tech) — Serverless PostgreSQL (free tier)

### Required Environment Variables

**API (Railway):**
```
NODE_ENV=production
PORT=4000
WEB_ORIGIN=https://playmorrow.vercel.app
DATABASE_URL=postgresql://...
JWT_SECRET=<random>
SESSION_SECRET=<random>
UPLOADS_DIR=/var/data/uploads
```

**Frontend (Vercel):**
```
API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://playmorrow.vercel.app
```

### Local Development
Both servers run with hot reload. The Next.js rewrite proxy forwards `/api/*` to the
NestJS API, keeping cookies same-origin.

---

## License

**All Rights Reserved.** Playmorrow is proprietary software. Unauthorized copying,
modification, distribution, or use of this software is strictly prohibited.
See [LICENSE](LICENSE) for details.

---

*Playmorrow — Discover tomorrow's indie games today.*
