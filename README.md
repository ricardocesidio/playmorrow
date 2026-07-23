# Playmorrow

**Discover tomorrow's indie games today.**

Playmorrow is a curated social platform where indie studios showcase their games,
share development logs, publish roadmaps, grow communities, and connect with players,
press, streamers, and publishers.

---

## Project Status — Production Ready

All 8 audit rounds complete. **No known bugs, 0 TypeScript errors, 0 lint errors.**

| Deployment | URL | Status |
|------------|-----|--------|
| Frontend | https://playmorrow.vercel.app | ✅ Live |
| API | https://playmorrow-api-production.up.railway.app | ✅ Health 200 |
| Staging | https://playmorrow-api-temp-staging.up.railway.app | ✅ |

## Quick Start

```bash
git clone https://github.com/ricardocesidio/playmorrow
cd playmorrow
pnpm install
pnpm dev
```

Then open http://localhost:3000.

**Demo login:** `dev@playmorrow.example` / `Demo123!@`

**Note:** First `pnpm dev` can take 20-40s (Turbopack + Nest watch + Prisma + Neon cold start).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Auth | Session-based (httpOnly cookies) + OAuth (Google, GitHub) |
| State | TanStack Query |
| Security | CSRF (HMAC), CSP, rate limiting, argon2id, DOMPurify |
| Build | pnpm workspaces + Turborepo |
| Testing | Playwright (E2E) + Vitest (unit) |
| Deployment | Vercel (frontend) + Railway (API) |

## Architecture

```
Browser → Next.js (Vercel) → /api/* → NestJS (Railway) → PostgreSQL (Neon)
```

## Features (170+ implemented)

- **Auth:** Email/password + Google OAuth + GitHub OAuth, email verification, password reset
- **Games:** Full CRUD with screenshots, trailers, tags, platforms, pricing
- **Devlogs:** Rich markdown editor, scheduling, categories, tags, screenshots gallery
- **Studios:** Profiles, team management (Owner/Admin/Moderator/Member), invitations
- **Feed:** 8 event types (devlogs, roadmap updates, game status changes, etc.)
- **Comments:** Threaded (4 levels), reactions (LIKE/LOVE/HYPE/INSIGHTFUL)
- **Social:** Follow studios/games, wishlist, player XP + levels, achievements
- **Search:** Full-text across games, studios, devlogs
- **Dashboards:** Player dashboard (XP, wishlist, following) + Studio dashboard (analytics, games, devlogs)
- **Security:** Global HMAC CSRF, rate limiting, argon2id password hashing, CSP, DOMPurify XSS sanitization

## CI/CD Status

| Check | Status |
|-------|--------|
| Typecheck | ✅ 0 errors |
| Lint | ✅ 0 errors |
| Build | ✅ 4/4 packages |
| Backend tests | ✅ Postgres tests pass |
| E2E (Playwright) | ✅ All selectors fixed |
| Deploy (Vercel) | ✅ Auto-deploy from main |
| Deploy (Railway) | ✅ Auto-deploy from main |

## Documentation

- [`docs/qa-report.md`](docs/qa-report.md) — Full QA audit
- [`docs/launch-readiness-report.md`](docs/launch-readiness-report.md) — Launch readiness
- [`docs/production-readiness-report.md`](docs/production-readiness-report.md) — Production verification
- [`docs/company-readiness-report.md`](docs/company-readiness-report.md) — Company readiness
- [`docs/handoff/`](docs/handoff/) — Development history

## License

All Rights Reserved. Playmorrow is proprietary software.
