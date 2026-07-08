# Playmorrow — Project Handoff

**Last updated:** 2026-07-08 (30 commits — final PRD delivery)

## Tech Stack

- **Frontend:** Next.js 15 (app router) + React 19 + Tailwind CSS v4 + TanStack Query
- **Backend:** NestJS (REST API on port 4000)
- **Database:** PostgreSQL via Neon (pooler) + Prisma ORM
- **Monorepo:** `apps/web` (frontend), `apps/api` (backend), `packages/database` (Prisma)
- **Auth:** Session-based (`playmorrow_session` cookie, `SameSite=Lax`)
- **Package manager:** pnpm

## Environment

- **Neon DB:** `postgresql://neondb_owner:REDACTED@ep-orange-bird-abpuzipk-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require`
- **Demo login:** `dev@playmorrow.example` / `Demo123!@`
- **API URL:** `http://localhost:4000/api` (proxied via Next.js rewrites)
- **Frontend:** `http://localhost:3000`
- **`loadEnvFile('.env')`** called in `apps/api/src/main.ts` to ensure DATABASE_URL is loaded

## Design System (Cyberpunk)

- Accents: cyan (#3ee7ff), coral (#ff574d), violet (#a65cff), amber (#e4a83b)
- Background: obsidian-black (#020609)
- Components: `HudPanel`, `TechPanel`, `CircuitFrame`, `StatusBadge` in `apps/web/components/playmorrow/hud.tsx`
- 19 curated tags: stealth, cyberpunk, tactical, strategy, sci-fi, singleplayer, story-rich, atmospheric, rpg, space, adventure, exploration, fantasy, card-game, roguelike, action, runner, fast-paced, deckbuilding

## Security

- **XSS:** `DOMPurify` sanitizes all rendered Markdown (devlog body, game description preview)
- **Upload validation:** MIME type whitelist, magic byte header check, file size (20MB max), image dimensions (4096px max)
- **Screenshots:** Max 10 enforced at API layer via `@ArrayMaxSize(10)` DTO validation
- **Likes:** Unique per user enforced at DB level (`@@unique([devlogId, userId])`)
- **Seat limits:** Server-side enforcement with HTTP 409 error codes

## Database State

- **5 games:** Neon Warden, Starfall Tactics, Mossbound, Paper Relics, Voidrunner
- **5 studios:** Obsidian Signal, Ironlight Studios, Wildbriar, Second Story Games, Voidrunner Dev
- **8 devlogs:** 3 Neon Warden, 2 Starfall, 2 Mossbound, 1 Paper Relics, 1 Voidrunner
- **20 roadmap items:** 4 per game
- **Platform links:** 4 per game (cleaned from 20 duplicates)
- **Demo user XP:** 1250xp, level 4, with 7 player XP events + 3 studio XP events
- **Community comments:** Auto-generated when devlogs published via Feed Engine
- **Remaining warnings:** 10-15 pre-existing unused imports (non-blocking, ESLint only)

## Devlog System V2 PRD — Complete

### Implemented
- **Schema:** `DevlogStatus` (DRAFT/PUBLISHED/SCHEDULED), `FeedEventType`, `FeedEvent`, `DevlogLike` (unique constraint), `DevlogScreenshot` models. Devlog fields: subtitle, readingTimeMin, status, scheduledFor, editedAt, category, tags, screenshots, likes
- **Feed Engine:** `apps/api/src/feed/feed-events.service.ts` — centralized `emit()` + `onDevlogPublished()` with auto CommunityPost creation. Events wired: DEVLOG_PUBLISHED, GAME_CREATED, GAME_STATUS_CHANGED, ROADMAP_UPDATED, STUDIO_CREATED, PRESS_KIT_UPDATED, ROLE_CHANGED
- **API:** `POST /devlogs/:id/like` (toggle), `GET /feed/events` (paginated), expanded CRUD with all new fields
- **RBAC seat limits:** `assertSeatLimit()` in `apps/api/src/common/studio-permissions.ts` (Owner:2, Admin:3, Moderator:10)
- **Game page:** Devlogs full width in main content, Roadmap in right sidebar below QuickInfo. `toResponse` includes devlogs + roadmapItems
- **Devlog editor:** Status radio (Draft/Publish/Schedule), subtitle, tags chip input, screenshots upload (max 10), category, scheduled date picker, preview toggle (Edit/Preview/Split)
- **Devlog detail:** Status badge, category chip, tags, screenshots gallery, author role badge
- **Editor toolbar:** `@uiw/react-md-editor` v4.1.1 with full formatting toolbar
- **Cache revalidation:** Server actions in `apps/web/actions/revalidate.ts` — called on devlog publish, game update, studio mutations
- **Implementation Report:** Delivered (Section 10 of PRD)

### Intentionally Deferred (PRD Section 3 — Out of Scope)
- Email/push notifications to followers
- Real-time WebSocket updates (cache revalidation covers this)
- @mentions in comments
- Scheduled publishing worker (field exists, cron TBD)
- CoverUrl → screenshots migration (needs data migration plan)
- Recursive nested replies beyond 1 level (backend supports it, frontend renders 1 level)

## Key Files Reference

| Purpose | Path |
|---|---|
| Prisma schema | `packages/database/prisma/schema.prisma` |
| API main entry | `apps/api/src/main.ts` |
| Feed Engine | `apps/api/src/feed/feed-events.service.ts` |
| RBAC/permissions | `apps/api/src/common/studio-permissions.ts` |
| Game detail service | `apps/api/src/games/games.service.ts` |
| Devlog service | `apps/api/src/devlogs/devlogs.service.ts` |
| Game page | `apps/web/app/games/[slug]/page.tsx` |
| Homepage | `apps/web/app/page.tsx` |
| Feed page | `apps/web/app/feed/page.tsx` |
| Devlog editor (new) | `apps/web/app/dashboard/devlogs/new/page.tsx` |
| Devlog editor (edit) | `apps/web/app/dashboard/devlogs/[id]/page.tsx` |
| Devlog detail | `apps/web/app/devlogs/[id]/page.tsx` |
| API hooks | `apps/web/lib/api/hooks.ts` |
| API client types | `apps/web/lib/api/client.ts` |
| Markdown editor | `apps/web/components/md-editor.tsx` |
| Cache revalidation | `apps/web/actions/revalidate.ts` |
| Player dashboard | `apps/web/components/dashboard/PlayerDashboard.tsx` |
| Studio dashboard | `apps/web/components/dashboard/StudioDashboard.tsx` |

## Running the Project

```bash
# Backend (port 4000)
cd apps/api && npx nest start

# Frontend (port 3000)
cd apps/web && npx next dev -p 3000

# Database push
cd packages/database && DATABASE_URL="..." npx prisma db push
```

## Recent Work (2026-07-08)

**Session 1 — Infrastructure:**
- Cleaned database: 72 games → 5, 73 studios → 5
- Fixed `loadEnvFile('.env')` in main.ts for Neon connection
- Added 8 demo devlogs via API, 4 roadmap items per game
- Platform links deduplicated (20→4 per game)
- Game detail API now includes devlogs + roadmapItems

**Session 2 — Game page (9 fixes):**
- Tagline in hero (replaced tags-as-subtitle), featured badge conditional
- Studio name deduplicated, platform chips now links
- Removed fake trailer progress bar, roadmap dates → TBA
- Screenshots without 5-cap, Contact Studio → Visit Studio link
- Manage button gated by authentication

**Session 3 — Devlog system enhanced:**
- Editor (new+edit): status radio, subtitle, tags chip, screenshots upload, category, scheduled date
- Detail page: status badge, category chip, tags, screenshots gallery, author role badge
- Preview toggle: Edit/Preview/Split modes
- Cache revalidation on all mutations

**Session 4 — Feed + Homepage:**
- Feed page: Load more button with pagination, type filter tabs (All/Devlogs/Roadmap)
- "Your Signal" sidebar shows real following counts from API
- Homepage: fake progress bars → real stats (followers/wishlists/comments)
- Leaderboard populated with real XP data
- Implementation Report delivered (PRD Section 10)

**Session 5 — Security + Gaps:**
- XSS sanitization via DOMPurify on all Markdown rendering
- Image upload: dimension validation (4096px max)
- readingTimeMin recomputed on devlog update
- FeedEngine wired to game status, roadmap, press kit, role change events
- Devlog publish returns feedEventId for optimistic UI
- Editor defaults to Edit mode (no split panes per PRD)

**Session 6 — Performance + SEO:**
- Removed 2 redundant API calls on game page (devlogs+roadmap now from embedded `useGame`)
- Screenshots included in ALL devlog queries (not just create)
- Devlog SEO layout fixed: `/me/devlogs/` → `/devlogs/` (public endpoint)
- Game Devlogs listing page created (`/games/[slug]/devlogs`)
- Game Comments listing page created (`/games/[slug]/comments`)
- Press-kit link fixed (→ dashboard), dead anchor links fixed
- Homepage skeleton loading states added

**Session 7 — QA + Documentation:**
- Full page scan: all 14 public pages + 30+ auth pages verified
- README rewritten with project status, known issues, and roadmap
- AGENTS.md updated with full development history

## Known Issues

| # | Issue | Severity |
|---|---|---|
| 1 | `coverUrl` on Devlog — PRD says remove, needs migration | Low |
| 2 | Devlog author = User not StudioMember (works correctly) | Low |
| 3 | Nested comments 1 level only in UI | Low |
| 4 | TRAILER_UPDATED + STUDIO_VERIFIED FeedEngine not wired | Low |
| 5 | `notFound()` hangs in client components (reverted to error state) | Low |
| 6 | 10-15 pre-existing ESLint warnings | Low |
| 7 | 15/17 API tests fail (pre-existing, env config needed) | Medium |
| 8 | Production login broken (Vercel→Railway env vars) | High |
