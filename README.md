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
- [Platform Features](#platform-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database](#database)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Known Issues](#known-issues)
- [What's Next](#whats-next)
- [License](#license)

---

## Project Status

**Devlog System V2 PRD — Fully Implemented (July 2026)**

| System | Status |
|---|---|
| Devlog CRUD + screenshots gallery | ✅ 0-10 screenshots, API enforcement |
| Rich editor (Markdown toolbar) | ✅ `@uiw/react-md-editor` v4.1.1 |
| Preview toggle (Edit/Preview/Split) | ✅ Sanitized, matches production |
| Status workflow (Draft/Published/Scheduled) | ✅ |
| Author attribution (avatar, role badge, dates) | ✅ |
| Feed Engine | ✅ 7 event types wired |
| Auto CommunityPost on publish | ✅ |
| RBAC seat limits (2/3/10) | ✅ Server-side 409 |
| Likes unique at DB level | ✅ `@@unique` constraint |
| Latest Games paginated 9/page | ✅ Load More |
| Game page layout (devlog full, roadmap sidebar) | ✅ |
| Cache revalidation | ✅ `revalidatePath` on all mutations |
| XSS sanitization | ✅ DOMPurify on all rendered Markdown |
| Image upload validation | ✅ Type, magic bytes, size (20MB), dimensions (4096px) |
| Skeleton loading states | ✅ Feed, homepage, game page |
| SEO metadata | ✅ OpenGraph on game/studio/devlog pages |
| PWA manifest + service worker | ✅ |

**30 commits in this implementation cycle.** Full implementation report in `AGENTS.md`.

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

## Platform Features

### Devlog System V2
- **Rich editor** — Bold, Italic, Heading, List, Code, Quote, Image, Video embed
- **Preview toggle** — Edit / Preview / Split modes
- **Status workflow** — Draft → Publish → Schedule
- **Screenshots gallery** — 0-10 per devlog, validated server-side
- **Author badges** — Owner / Admin / Moderator role indicators
- **Feed Engine** — DEVLOG_PUBLISHED, GAME_STATUS_CHANGED, ROADMAP_UPDATED, STUDIO_CREATED, PRESS_KIT_UPDATED, ROLE_CHANGED
- **Community sync** — Auto-creates CommunityPost when devlog publishes
- **Cache revalidation** — `revalidatePath` on feed, homepage, game pages

### Studio Tools
- Studio profiles with logo, banner, description, team, location
- Game profiles with cover art, screenshots, trailers, tags, platforms
- Devlog editor with Markdown, tags, screenshots, scheduling
- Roadmap management with visual timeline
- Press kit management with .md download
- Team management with RBAC (Owner/Admin/Moderator) and seat limits
- Image upload with validation (type, size, dimensions, magic bytes)
- YouTube trailer embeds with thumbnail generation
- Fullscreen screenshot lightbox with keyboard nav (← → Esc)
- Request to Join with approve/reject workflow
- Studio Dashboard with analytics, activity feed

### Community
- Follow/unfollow studios and games
- Game wishlist (private)
- Comment on devlogs with threaded replies
- React to devlogs and comments (LIKE, LOVE, HYPE, INSIGHTFUL)
- OAuth sign-in (Google, GitHub) + email/password
- Real-time notification badges (SSE streaming)
- Email verification and password recovery
- Rate-limited endpoints and moderation reporting
- Cookie consent (Essential, Analytics, Marketing)

### Visual Design
- Full cyberpunk design system — cyan (#3ee7ff), coral (#ff574d), violet (#a65cff), amber (#e4a83b)
- Obsidian-black backgrounds (#020609) with hexagonal grid overlays
- CRT scanlines, glitch typography, holographic card depth
- Animated border scanning effects, custom cursor glow
- Signal dots, corner brackets, circuit decorations
- Clipped-corner panels and buttons (HudPanel, TechPanel, CircuitFrame)
- Space Grotesk (headings) + JetBrains Mono (body/UI)

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
| Security | DOMPurify (XSS), helmet, class-validator, rate limiting |
| Build | pnpm workspaces |
| Testing | Playwright (E2E) + Vitest (API unit) |
| Deployment | Vercel (frontend) + Railway (API) |

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

**Recent additions (Devlog V2):** `DevlogStatus` enum, `FeedEventType` enum,
`feed_events` table, `devlog_likes` table, `devlog_screenshots` table,
new columns on `devlogs` (subtitle, readingTimeMin, status, scheduledFor, editedAt, category, tags).

---

## Authentication

- **Session-based** — httpOnly cookies (`playmorrow_session`), `SameSite=Lax`
- **OAuth providers** — Google, GitHub
- **Email verification** — 6-digit codes via Resend
- **Password recovery** — Email-based reset flow
- **CSRF protection** — Rate-limited endpoints with IP-based throttling
- **RBAC** — Studio roles (Owner/Admin/Moderator) enforced server-side

---

## Deployment

### Production
| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Next.js with edge functions |
| API | Railway | NestJS auto-deploy from GitHub |
| Database | Neon | Serverless PostgreSQL |

### Required Env Vars

**API:** `DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET`, `WEB_ORIGIN`, `PORT`  
**Frontend:** `API_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`

Local dev uses Next.js rewrites to proxy `/api/*` to NestJS, keeping cookies same-origin.

---

## Known Issues

| # | Issue | Severity | Notes |
|---|---|---|---|
| 1 | `coverUrl` still on Devlog model | Low | PRD says remove; needs data migration before dropping column |
| 2 | Devlog author is `User` (not `StudioMember`) | Low | Works correctly; PRD spec differs |
| 3 | Nested comments only 1 level deep in UI | Low | Backend supports recursive; frontend renders 1 level |
| 4 | Feed Engine: TRAILER_UPDATED not wired | Low | API DTOs don't expose trailer changes |
| 5 | `notFound()` in client components causes hang | Low | Reverted to error-state rendering; proper 404 requires server component refactor |
| 6 | 15/17 API tests fail in CI | Medium | Pre-existing; need test env DB configuration |
| 7 | Production login broken | High | Needs `NEXT_PUBLIC_API_URL` + `API_URL` set on Vercel, `WEB_ORIGIN` set on Railway (code fallbacks fixed) |

---

## What's Next

### Short-term
- Set `NEXT_PUBLIC_API_URL` + `API_URL` on Vercel, `WEB_ORIGIN` + `COOKIE_DOMAIN` on Railway
- Wire TRAILER_UPDATED FeedEngine event
- Add "Load more" pagination to devlog/comment listing pages

### Medium-term (from PRD deferred items)
- Email/push notifications to followers
- Dedicated CommunityPost entity (currently reuses Comment model)
- Recursive nested comment rendering

### Long-term
- WebSocket real-time feed
- Devlog analytics (views, read-through rate, shares)
- @mentions in comments
- Content moderation pipeline (auto-flagging)

---

## License

**All Rights Reserved.** Playmorrow is proprietary software. See [LICENSE](LICENSE).

---

*Playmorrow — Discover tomorrow's indie games today.*
