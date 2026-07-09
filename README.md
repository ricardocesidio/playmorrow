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

**Devlog System V2 PRD — Fully Implemented (July 2026)**

**Current production status:** See [`PRODUCTION.md`](PRODUCTION.md) for the full qualification checklist, required env vars, and browser smoke test steps. Known gaps (registration was 500ing due to missing secrets, etc.) are tracked there.

See [`STATUS.md`](STATUS.md) for the complete, verified feature inventory, known issues, and deployment configuration.

**Security model overview:** [`docs/security/model.md`](docs/security/model.md)

Ongoing elite architecture audit cleanups — restarted full pass from Critical start: enhanced register (full try/catch + pino logging to prevent/hunt 500s), strengthened early secret validation in main.ts (recommended vars + logging), updated PRODUCTION.md with branch protection steps + smoke test guidance. Cleanup polish: cleaned stale comments around studio-chat in app.module. Security: added TODO note for per-user rate limiting in throttler config. Performance: added Server Components TODOs in public pages (games list, home). UX (B4/B5/B6/B7): added a11y/skeleton polish to game comments, user profile, notifications; improved MD editor keyboard/focus; polished games filters with ARIA/keyboard support; a11y+focus on leaderboard tabs and feed rows. D (Docs): cleaned historical notes in HANDOFF.md; updated PRODUCTION.md with B notes. F (Cleanup): removed commented-out Redis from docker-compose.yml (unused, per audit). Plus prior: Sentry full, pino + contextual loggers (main, services incl. email/health, follows), upload abstraction for S3/R2, more skeletons, counter centralization, a11y, coverage, dead code removal, etc. Build green. See handoff docs for details.

607+ commits across 11 development sessions. Full implementation report in [`AGENTS.md`](AGENTS.md).

---

## Quick Start

```bash
git clone https://github.com/ricardocesidio/playmorrow
cd playmorrow
pnpm install

# Backend (port 4000)
cd apps/api && npx nest start

# Frontend (port 3000)
cd apps/web && npx next dev -p 3000

# Database (if schema changes)
cd packages/database && DATABASE_URL="postgresql://..." npx prisma db push
```

**Demo login:** `dev@playmorrow.example` / `Demo123!@`

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
