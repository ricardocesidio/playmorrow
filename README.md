# Playmorrow

**Discover tomorrow's indie games today.**

[![CI](https://github.com/ricardocesidio/playmorrow/actions/workflows/ci.yml/badge.svg)](https://github.com/ricardocesidio/playmorrow/actions)
![License](https://img.shields.io/badge/license-proprietary-red)
![Status](https://img.shields.io/badge/status-closed%20beta-blue)
![Tests](https://img.shields.io/badge/tests-318%20passing-green)

---

Playmorrow is a social discovery platform connecting indie game studios with players before launch. Studios share their development journey through devlogs, roadmaps, trailers, and press kits — players discover upcoming games, follow development, build wishlists, and join the conversation.

**Live:** [https://playmorrow.co](https://playmorrow.co)

---

## Features

### For Players
- **Discover** — Curated indie games with search, tags, genres, and recommendation engine
- **Follow** — Track studios and games to follow their development progress
- **Personalized Feed** — Real-time feed of devlogs, roadmap updates, and community activity
- **Wishlist** — Save upcoming releases and get notified of updates
- **Community** — Threaded comments with reactions (LIKE/LOVE/HYPE/INSIGHTFUL)
- **Notifications** — Real-time SSE + push notifications for followed studio activity
- **Leaderboard** — XP-based rankings with achievements and level progression

### For Studios
- **Game Pages** — Rich profiles with screenshots, trailers, tags, platforms, and pricing
- **Devlogs** — Full markdown editor with scheduling, categories, tags, and screenshots
- **Roadmap** — Visual milestone timeline with planned/in-progress/completed states
- **Analytics** — Real event tracking with daily aggregates per game and studio
- **Press Kits** — Auto-generated markdown for media and publishers
- **Brand Kits** — Studio brand guidelines and asset management
- **Verification** — Tiered system (Unverified → Email → Basic → Official → Partner → Featured)
- **Team Management** — Role-based access with invitation system and seat limits
- **Goals & Achievements** — Studio milestone tracking

### Discovery & Recommendations (M5)
- **Recommendation Engine** — 9 scorers: tag similarity, follow-based, trending, wishlist similarity, interaction history, hidden gems, similar studios, recently updated, latest releases
- **Search 2.0** — Full-text search with 6 filters (genre, status, tag, engine, isFree, demo) and 4 sort modes
- **Dynamic Collections** — 5 curated collections (Top Wishlisted, In Development, Free to Play, Verified Studios, Recently Released)
- **Discover Page** — Server-side rendered with Featured, Trending, Popular, and Newest sections
- **SEO Landing Pages** — `/discover/[tag]` with generateMetadata + JSON-LD

### Moderation & Trust (M8)
- **Reports System** — User-driven reporting with SPAM/HARASSMENT/COPYRIGHT reasons
- **Suspension & Shadow Ban** — Manual + automatic (3 strikes → auto-suspend 24h)
- **Appeals** — Users can file appeals against moderation actions
- **Strike System** — Progressive enforcement: warn → suspend → ban
- **Spam Detection** — Keyword matching, short URL detection, ALL CAPS heuristics, rate-limit
- **Escalation Workflow** — Unresolved reports auto-escalated after 48h
- **DMCA Workflow** — Takedown notices with 14-day counter-notification timer
- **Audit Trail** — All moderation actions logged via EventBus
- **Moderation Dashboard** — Real-time metrics: open reports, escalation rate, avg resolution time

### Email Automation (M9)
- **Email Templates** — CRUD + render engine with 7 default templates
- **Transactional Emails** — Welcome, email verification, password reset
- **Weekly Digest** — Automated weekly summary of followed studio activity
- **Email Preferences** — Granular notification toggles + token-based unsubscribe
- **Bounce Handling** — Automatic detection and suppression of bounced addresses
- **Delivery Analytics** — Open, click, and bounce rate tracking

### Public API & SDK (M11/M12)
- **API Keys** — Programmatic access with scoped keys
- **JavaScript SDK** — `@playmorrow/sdk` with full API client
- **CLI** — `playmorrow` command-line tool (search, games, trending, collections)

### Marketplace & Ecosystem (M16-M21)
- **Marketplace** — Game asset listings with Stripe Connect Express payouts, PaymentIntent purchases, license management
- **Publisher** — Per-studio revenue dashboard with earnings, transactions, and payout history
- **Funding** — Reward-based crowdfunding scope (Kickstarter model; equity/investment blocked)
- **Creator** — Referral codes with commission tracking for affiliate earnings
- **Partner** — B2B CRM with 6 partner types (University, Publisher, Accelerator, Incubator, Studio, Event Organizer)
- **Events** — Event listings with detail pages, publish workflow, ticketing, and upcoming filter

### Security
- **Session-based Auth** — httpOnly `playmorrow_session` cookie
- **OAuth** — Google and GitHub authentication
- **CSRF** — Stateless HMAC-SHA256 applied globally
- **CSP** — Content Security Policy with nonce (production)
- **XSS Prevention** — DOMPurify + sanitize-html on all rendered content
- **Password Hashing** — Argon2id with timing-safe comparison
- **Rate Limiting** — Global 60/min + per-route overrides
- **Upload Validation** — MIME whitelist, magic bytes, dimension limits, 20MB max

---

## Architecture

```
Browser (Next.js 15 + React 19)
    │ /api/* (rewritten via next.config.ts)
    ▼
Vercel (Frontend)
    │ HTTPS
    ▼
Fly.io (Backend — NestJS)
    │ Prisma ORM
    ▼
Neon (PostgreSQL)
```

**Key Components:**
- **Frontend:** Next.js 15 App Router, React 19, Tailwind CSS v4, TanStack Query
- **Backend:** NestJS with 55 modules, 47 controllers, 318 integration tests
- **Database:** PostgreSQL on Neon — 63 models, 29 migrations, connection pooler
- **CI/CD:** GitHub Actions — lint, typecheck, 318 tests, security scans
- **Monitoring:** Sentry error tracking, UptimeRobot health checks (5min)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL (Neon with connection pooler) |
| ORM | Prisma (63 models) |
| Auth | Session-based + OAuth (Google, GitHub) |
| Security | CSRF HMAC, CSP, DOMPurify, Helmet, rate limiting |
| Email | Resend (transactional + digests) |
| Real-time | SSE via RxJS Subject |
| Package Manager | pnpm 11+ (workspaces) |
| Build System | Turborepo |
| Testing | Vitest (318 tests), Playwright (E2E) |
| CI/CD | GitHub Actions |
| Error Tracking | Sentry |
| Deployment | Vercel (frontend) + Fly.io (backend) |
| Containerization | Docker (multi-stage) |
| Domain | playmorrow.co |

---

## Quick Start

```bash
git clone git@github.com:ricardocesidio/playmorrow.git
cd playmorrow
pnpm install
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:4000

See [Architecture docs](ARCHITECTURE.md) for detailed setup and deployment instructions.

---

## Project Structure

```
playmorrow/
├── apps/
│   ├── web/          # Next.js frontend (82 routes)
│   └── api/          # NestJS backend (55 modules)
├── packages/
│   ├── database/     # Prisma schema + client
│   ├── sdk/          # JavaScript SDK (@playmorrow/sdk)
│   └── cli/          # CLI tool (@playmorrow/cli)
├── docs/
│   ├── releases/     # Certification reports
│   ├── security/     # Runbooks and policies
│   └── archive/      # Superseded documents
└── .github/          # CI/CD workflows
```

---

## Documentation

| Resource | Location |
|----------|----------|
| Architecture | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Security | [`SECURITY.md`](SECURITY.md) |
| Security runbooks | [`docs/security/`](docs/security/) |
| Release certifications | [`docs/releases/`](docs/releases/) |

---

## Contact

- **Email:** playmorrow@hotmail.com
- **Discord:** [discord.gg/playmorrow](https://discord.gg/playmorrow)
- **X:** [@playmorrow](https://x.com/playmorrow)
- **GitHub:** [github.com/ricardocesidio/playmorrow](https://github.com/ricardocesidio/playmorrow)

---

## License

All Rights Reserved — Copyright (c) 2026 Playmorrow

---

*Last updated: 2026-07-30. Tests verified: 318 passing (27 files).*
