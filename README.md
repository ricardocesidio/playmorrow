# Playmorrow

**Discover tomorrow's indie games today.**

Playmorrow is a curated social platform where indie studios showcase their games,
share development logs, publish roadmaps, grow communities, and connect with players,
press, streamers, and publishers.

---

## Table of Contents

- [Project Status](#project-status)
- [Quick Start](#quick-start)
- [Demo Data](#demo-data)
- [Feature Overview](#feature-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database](#database)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [License](#license)

---

## Project Status

**Production registration 500 — FIXED (Session 13, 2026-07-10)**
Registration now works in production. Root cause was missing `RESEND_API_KEY` + old throwing code. Fixed by setting env var + `deploymentRedeploy` via Railway API.

**Next major effort:** Full project polish across 6 phases. See `docs/handoff/session-13.md` for the complete audit and Claude AI super prompt.

For the complete, verified feature inventory, known issues, and deployment configuration, see [`STATUS.md`](STATUS.md).

For the prioritized roadmap with hour estimates, see [`ROADMAP.md`](ROADMAP.md).

---

## The Plan Ahead

The project is being taken to professional/production-ready level across 6 phases:

| Phase | Focus | Est. Time |
|-------|-------|-----------|
| P1 | Foundation Fixes (login redirect, dead links, auth guards, "Join as studio" fix) | 1-2 days |
| P2 | Devlog → Notícias (blog system with 5/page pagination) | 2-3 days |
| P3 | Dashboard Restructure (player/studio separation, fix navigation) | 2-3 days |
| P4 | Model Games & Page Polish (5 showcase games, homepage, game pages) | 2-3 days |
| P5 | Security Hardening (OAuth state, CSRF expiry, CSP, DOMPurify, middleware) | 2-3 days |
| P6 | Production Readiness (Railway cache, legal pages, Sentry, CI gating) | 2-3 days |

See [`docs/handoff/session-13.md`](docs/handoff/session-13.md) for the complete audit and the Claude AI super prompt to execute these phases.

#4 Deeper GDPR: enhanced user deletion with explicit report anonymization + added GET /users/me/export data export stub (in users.controller + service). See PRODUCTION.md.

**Current verified state:** See [`STATUS.md`](STATUS.md) for the complete, evidence-backed feature inventory, open issues, test status, and production configuration. All claims in STATUS.md are tied to specific commands or artifacts.

638+ commits across 12 development sessions. Full implementation report in [`AGENTS.md`](AGENTS.md). Professionalization audit and gaps documented in [`docs/handoff/session-12.md`](docs/handoff/session-12.md).

---

## Quick Start

**One command (recommended):**

```bash
git clone https://github.com/ricardocesidio/playmorrow
cd playmorrow
pnpm install

# One command starts BOTH frontend + backend with turbo (parallel, persistent)
pnpm dev
```

Then open http://localhost:3000.

**Alternative (separate terminals if you prefer):**

```bash
# Terminal 1 - API
pnpm dev:api     # or: pnpm --filter @playmorrow/api dev

# Terminal 2 - Web
pnpm dev:web     # or: pnpm --filter @playmorrow/web dev
```

**Database (rarely needed in dev):**

```bash
pnpm db:push
```

**Demo login:** `dev@playmorrow.example` / `Demo123!@` (or register your own).

**Note:** First `pnpm dev` can take 20-40s (Turbopack + Nest watch + Prisma + Neon cold start). Subsequent starts are much faster. Use `pnpm dev` from the repo root.

---

## Demo Data

### 5 Games with full profiles

| Game | Studio | Status | Price | Screenshots |
|---|---|---|---|---|
| Neon Warden | Obsidian Signal | BETA | $19.99 | 4 |
| Starfall Tactics | Ironlight Studios | ALPHA | $24.99 | 4 |
| Mossbound | Wildbriar | PRE_ALPHA | $14.99 | 4 |
| Paper Relics | Second Story Games | PRE_ALPHA | $9.99 | 4 |
| Voidrunner | Voidrunner Dev | CONCEPT | Free | 4 |

Each game includes: 4 screenshots, 4 roadmap items, platform links (Steam/Epic/GOG/Itch),
8 devlogs (3 Neon Warden, 2 Starfall, 2 Mossbound, 1 Paper Relics, 1 Voidrunner),
auto-generated community comments, 19 curated tags.

### 5 Studios with team members
### Demo user: 1250 XP, level 4, 7 XP events
### Leaderboard populated with real data

---

## Feature Overview

This is a **summary** only. See [`STATUS.md`](STATUS.md) for the full verified feature inventory.

### Core Platform
- Session-based auth with email/password + OAuth (Google, GitHub)
- Studio and game profiles with media, tags, platforms
- Rich devlog editor with Markdown, screenshots, scheduling
- Feed engine with 8 event types
- Threaded comments with reactions
- Follow/unfollow studios and games
- Game wishlist (private)
- Roadmap management with visual timeline
- Press kit management with .md download
- Full-text search across games, studios, devlogs

### Design System
- Full cyberpunk HUD — cyan, coral, violet, amber accents
- Animated borders, CRT scanlines, glitch typography
- Custom components: HudPanel, TechPanel, CircuitFrame, StatusBadge

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Components | Custom HUD components, `@uiw/react-md-editor`, lucide-react |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL (Neon pooler) + Prisma ORM |
| Auth | Session-based (httpOnly cookies) + OAuth |
| State | TanStack Query (React Query) |
| Security | DOMPurify (XSS), helmet, class-validator, ThrottlerModule |
| Build | pnpm workspaces |
| Testing | Playwright (E2E) + Vitest (API unit) |
| Deployment | Vercel (frontend) + Railway (API) |

---

## Architecture

```
Browser (playmorrow.vercel.app)
    │
    ▼
Next.js App Router
    │  /api/* → rewrite proxy → NestJS API (Railway)
    │  /auth/* → server-side API routes
    │
    ▼
NestJS API (Railway)
    │
    ▼
PostgreSQL via Neon pooler (Prisma ORM)
```

**API Design:** RESTful with session-based auth. All mutations return updated state.
Read operations support pagination. File uploads use multipart/form-data with
MIME type, magic byte, size, and dimension validation.

---

## Database

**PostgreSQL 16** via Neon with Prisma ORM.

Key tables: `users`, `studios`, `games`, `devlogs`, `devlog_screenshots`, `devlog_likes`,
`feed_events`, `roadmap_items`, `comments`, `reactions`, `follows`, `wishlist_items`,
`notifications`, `press_kits`, `game_media`, `platform_links`, `studio_members`,
`studio_invitations`, `audit_logs`, `player_xp_events`, `studio_xp_events`, `achievements`.

See [`STATUS.md`](STATUS.md) for the complete schema inventory.

---

## Authentication

- **Session-based** — httpOnly cookies (`playmorrow_session`), `SameSite=Lax` dev / `SameSite=None` prod
- **OAuth providers** — Google, GitHub
- **Email verification** — 6-digit codes via Resend
- **Password recovery** — Email-based reset flow
- **CSRF protection** — Global HMAC-based, applied to all mutation endpoints
- **RBAC** — Studio roles (Owner/Admin/Moderator) enforced server-side with seat limits

---

## Deployment

### Production
| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Next.js with edge functions |
| API | Railway | NestJS auto-deploy from GitHub |
| Database | Neon | Serverless PostgreSQL |

### Required Env Vars
See [`STATUS.md`](STATUS.md) → Production Deployment for exact values and configuration.

Local dev uses Next.js rewrites to proxy `/api/*` to NestJS, keeping cookies same-origin.

---

## License

**All Rights Reserved.** Playmorrow is proprietary software. See [LICENSE](LICENSE).

---

*Playmorrow — Discover tomorrow's indie games today.*
