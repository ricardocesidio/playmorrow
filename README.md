# Playmorrow

**Discover tomorrow's indie games today.**

Playmorrow is a social discovery platform connecting indie game studios with players before launch. Studios share their development journey through devlogs, roadmaps, trailers, and press kits — players discover upcoming games, follow development, build wishlists, and join the conversation.

---

## Key Features

### For Players

- **Discover & Browse** — Curated indie games with search, tags, genres, and status filters
- **Follow** — Follow studios and games to track their development progress
- **Personalized Feed** — Real-time feed of devlogs, roadmap updates, and community activity from followed studios
- **Devlog Blog** — Rich blog-style devlogs with markdown, screenshots, tags, categories, and reading time
- **Wishlist** — Save upcoming releases and track their progress toward launch
- **Community Discussion** — Threaded comments with LIKE/LOVE/HYPE/INSIGHTFUL reactions on devlogs
- **Leaderboard** — XP-based player rankings with achievements and level progression
- **Push Notifications** — Browser push alerts for new devlogs and studio updates (VAPID keys)
- **Real-time Notifications** — SSE-based notification dropdown with auto-refresh and mark-all-read
- **Auto-refresh** — Feed, game stats, roadmap, devlogs, and notifications refresh every 30s
- **Cookie Consent** — Three-category consent system (Essential/Analytics/Marketing)

### For Studios

- **Game Pages** — Rich game profiles with screenshots, trailers, tags, platforms, pricing, and status
- **Devlog System** — Full CRUD with rich markdown editor, preview/split modes, scheduling, categories, tags, screenshots
- **Roadmap Management** — Visual milestone timeline with planned/in-progress/completed states
- **Team Management** — Role-based access (Owner/Admin/Moderator/Member) with invitation system and seat limits
- **Dashboard** — Studio analytics with views, follows, wishlists, and engagement data (auto-refresh)
- **Player Dashboard** — XP, level, achievements, and personal activity feed
- **Press Kits** — Auto-generated markdown downloads for media and publishers; standalone Studio Press Kits
- **Brand Kits** — Studio brand guidelines, logos, and asset management
- **Analytics** — Real event tracking with daily aggregates, game and studio analytics dashboards
- **Goals & Achievements** — Studio milestone tracking (publishing, content, planning, media, growth, press kit)
- **Health Score** — Studio health scoring with weekly reports and recommendations
- **Company Profiles** — Business-facing studio profiles with company details and verification badges
- **Studio Chat** — Internal studio messaging for team communication
- **Verification** — Tiered verification system (Unverified → Email → Basic → Official → Partner → Featured)
- **Trust Platform** — Trust scoring based on verification, brand kit completion, profile completeness, press kit, and email reputation

### Moderation & Administration

- **Admin Dashboard** — Global moderation controls, user management, and system administration
- **Moderation Reports** — User-driven reporting system with SPAM/HARASSMENT/HATE/VIOLENCE/COPYRIGHT reasons
- **Audit Log** — Full activity audit trail for all platform actions
- **Rate Limiting** — ThrottlerModule with global 60/min and per-route overrides
- **Activity Events** — Stream-based event bus powering goals, achievements, feed, and notifications

### Communications & Support

- **Support Center** — Ticketed support system with categories, replies, attachments, and history tracking
- **Admin Support Queue** — Admin interface for managing support tickets with status workflow
- **Help Center** — Full documentation platform with categorized articles, search, and feedback
- **Notifications** — SSE real-time, push (browser), and email (Resend) notification channels
- **Email** — Transactional email via Resend: verification, password reset, email change, and notifications

### Security

- **Session-based Auth** — httpOnly `playmorrow_session` cookie with SameSite=Lax (dev) / None (prod)
- **OAuth** — Google and GitHub authentication via Passport strategies
- **CSRF Protection** — Stateless HMAC-SHA256 tokens applied globally via `CsrfGuard` (`APP_GUARD`), covers all 70+ POST/PUT/PATCH/DELETE endpoints
- **CSP** — Nonce-based Content Security Policy via Next.js middleware
- **XSS Sanitization** — DOMPurify and sanitize-html on all rendered markdown and content fields
- **Input Validation** — class-validator with whitelist + forbidNonWhitelisted on all DTOs
- **Password Hashing** — argon2id with timing-safe comparison
- **Upload Validation** — MIME type whitelist, magic byte verification, dimension limits (4096px max), 20MB max
- **Rate Limiting** — Global and per-endpoint rate limiting via ThrottlerModule
- **Helmet** — Security headers (CSP, CORS, HSTS, X-Frame-Options, etc.)

### Infrastructure & DevOps

- **CI/CD** — GitHub Actions with lint, typecheck, backend tests, and E2E workflows
- **Branch Protection** — Required checks before merge to `main`
- **Dependabot** — Automated dependency updates
- **Sentry** — Error tracking for both frontend and backend
- **Monitoring** — Health endpoint (`/health`) with database and email provider status
- **Docker** — Multi-stage Dockerfile for Fly.io deployment
- **SEO** — OG images, canonical URLs, JSON-LD structured data (WebSite, VideoGame, Organization, BlogPosting), dynamic sitemap

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│  Next.js 15 (App Router) + React 19 + TanStack Query       │
│  Tailwind CSS v4 + Shared Design System (Button, Input,     │
│  Modal, GameCard)                                           │
└────────────┬────────────────────────────────────────────┘
             │
             │ /api/* (rewritten via next.config.ts)
             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Vercel (Frontend)                        │
│  - Static generation + server components                    │
│  - CSP middleware (nonce-based)                              │
│  - Service worker (push notifications + cache)              │
│  - Dynamic sitemap / OG image generation                    │
└────────────┬────────────────────────────────────────────┘
             │
             │ HTTPS
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Fly.io (Backend)                          │
│  NestJS REST API                                             │
│  - Controllers (26 modules)                                  │
│  - CsrfGuard (global, HMAC-SHA256)                           │
│  - ThrottlerGuard (60 req/min)                               │
│  - FeedEngine (8 event types)                                │
│  - EventBus (goals, achievements, notifications)             │
│  - DevlogsScheduler (5-min cron)                             │
│  - SSE real-time notifications (RxJS Subject)                │
│  - Pino structured logging                                   │
└────────────┬────────────────────────────────────────────┘
             │
             │ Prisma ORM
             ▼
┌─────────────────────────────────────────────────────────────┐
│              Neon (PostgreSQL)                               │
│  - 51 tables / Prisma models                                │
│  - 58 indexes, 8 unique constraints                         │
│  - 43 cascade deletes, 2 set-null                           │
│  - Connection pooler                                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow (Authentication)

```
1. User visits playmorrow.vercel.app
2. Server renders page (server component → no cookie needed for public pages)
3. User clicks "Sign in" → form login or OAuth (Google/GitHub)
4. Login:
   a. Form login: POST /api/auth/form-login → creates session → sets playmorrow_session
   b. OAuth: Passport strategy → callback → creates session → sets cookies
5. CSRF token is captured from login response, stored as playmorrow_csrf (non-httpOnly cookie)
6. All mutations include X-CSRF-Token header (captured by lib/api/client.ts)
7. Session validated via cookie on every request
8. Rate limiting applied per IP/user
9. Audit log records all auth and admin actions
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router) + React 19 + TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Design System** | Shared Button, Input, Modal (focus trap), GameCard (4 variants) |
| **State Management** | TanStack Query (auto-refresh, optimistic updates, cache invalidation) |
| **Backend** | NestJS + TypeScript |
| **Database** | PostgreSQL (Neon with connection pooler) |
| **ORM** | Prisma (51 models, 58 indexes, 8 unique constraints) |
| **Authentication** | Session-based (httpOnly cookies) + OAuth (Google, GitHub) |
| **Password Hashing** | argon2id |
| **Security** | CSRF (stateless HMAC), CSP (nonce-based), DOMPurify, sanitize-html, Helmet, ThrottlerModule |
| **Email** | Resend (verification, password reset, email change, notifications) |
| **Push Notifications** | Web Push API (VAPID keys), Service Worker |
| **Real-time** | SSE via RxJS Subject |
| **Markdown** | @uiw/react-md-editor, DOMPurify, sanitize-html |
| **Package Manager** | pnpm 11+ (workspaces) |
| **Build System** | Turborepo |
| **Testing** | Vitest (unit/integration), Playwright (E2E) |
| **CI/CD** | GitHub Actions |
| **Error Tracking** | Sentry (frontend + backend) |
| **Logging** | Pino (structured JSON logging) |
| **Cron** | @nestjs/schedule (5-min devlog publishing interval) |
| **Deployment** | Vercel (frontend), Fly.io (backend) |
| **Containerization** | Docker (multi-stage build) |

---

## Monorepo Structure

```
playmorrow/
├── apps/
│   ├── web/                          # Next.js 15 frontend
│   │   ├── app/                      # App router pages (40+ routes)
│   │   │   ├── games/                # Game browsing & detail
│   │   │   ├── studios/              # Studio browsing & detail
│   │   │   ├── devlogs/              # Public devlog detail pages
│   │   │   ├── feed/                 # Personal activity feed
│   │   │   ├── dashboard/            # Player & Studio dashboards
│   │   │   ├── search/               # Search (games, studios, devlogs)
│   │   │   ├── settings/             # User profile settings
│   │   │   ├── onboarding/           # New user onboarding flow
│   │   │   ├── support/              # Support ticket system
│   │   │   ├── help/                 # Help center articles
│   │   │   ├── leaderboard/          # XP leaderboard
│   │   │   ├── welcome/              # Welcome page for new users
│   │   │   ├── login/                # Authentication pages
│   │   │   ├── register/             # Registration pages
│   │   │   ├── status/               # Platform status page
│   │   │   ├── about/                # About page
│   │   │   ├── contact/              # Contact page
│   │   │   └── ...                   # Legal, policies, etc.
│   │   ├── components/               # Shared React components
│   │   │   ├── ui/                   # Design system (Button, Input, Modal, GameCard)
│   │   │   ├── dashboard/            # Shared dashboard components
│   │   │   └── ...                   # Feature-specific components
│   │   ├── lib/                      # Utilities, hooks, API client
│   │   ├── public/                   # Static assets, service worker
│   │   └── middleware.ts             # CSP + security headers
│   │
│   └── api/                          # NestJS backend
│       ├── src/
│       │   ├── auth/                 # Auth module (session, OAuth, registration)
│       │   ├── games/                # Games CRUD + publishing
│       │   ├── studios/              # Studios CRUD + team management
│       │   ├── devlogs/              # Devlogs CRUD + scheduling
│       │   ├── comments/             # Threaded comments
│       │   ├── reactions/            # LIKE/LOVE/HYPE/INSIGHTFUL
│       │   ├── feed/                 # Feed engine (8 event types)
│       │   ├── roadmap-items/        # Roadmap management
│       │   ├── press-kits/           # Press kit generation
│       │   ├── press-kit/            # Studio press kits
│       │   ├── studio-profile/       # Company profiles
│       │   ├── notifications/        # SSE + push notifications
│       │   ├── analytics/            # Game & studio analytics
│       │   ├── achievements/         # Player & studio achievements
│       │   ├── goals/                # Studio goal tracking
│       │   ├── player-xp/            # Player XP system
│       │   ├── verification/         # Studio verification (tiered)
│       │   ├── trust/                # Trust scoring
│       │   ├── studio-health/        # Health scoring + weekly reports
│       │   ├── support/              # Support ticket system
│       │   ├── help/                 # Help center CMS
│       │   ├── reports/              # Moderation reports
│       │   ├── audit-log/            # Audit trail
│       │   ├── search/               # Search service
│       │   ├── upload/               # File upload (MIME + magic bytes + dimension validation)
│       │   ├── common/               # Shared guards, pipes, interceptors, event bus
│       │   └── main.ts               # Entry point with + pre-health server
│       └── Dockerfile                # Multi-stage build
│
└── packages/
    └── database/                     # Prisma schema + migrations
        ├── prisma/
        │   ├── schema.prisma         # 51 models, 18 enums
        │   └── migrations/           # SQL migration history
        └── src/                      # Generated Prisma client
```

---

## API Overview

The NestJS API exposes RESTful endpoints under `/api/`. Key modules:

| Module | Base Path | Purpose |
|--------|-----------|---------|
| Auth | `/api/auth` | Registration, login, OAuth, password reset, email verification |
| Users | `/api/users` | Profile management, settings |
| Studios | `/api/studios` | Studio CRUD, team management |
| Games | `/api/games` | Game CRUD, media, publishing |
| Devlogs | `/api/devlogs` | Devlog CRUD, scheduling, screenshots |
| Comments | `/api/comments` | Threaded comments with replies |
| Reactions | `/api/reactions` | LIKE/LOVE/HYPE/INSIGHTFUL |
| Feed | `/api/feed` | Personalized activity feed with pagination |
| Roadmap | `/api/roadmap-items` | Roadmap milestone management |
| Press Kits | `/api/press-kits` | Press kit generation and download |
| Notifications | `/api/notifications` | SSE real-time + push notifications |
| Analytics | `/api/analytics` | Game and studio analytics dashboards |
| Search | `/api/search` | Global search across entities |
| Support | `/api/support` | Support ticket system |
| Help | `/api/help` | Help center articles and categories |
| Verification | `/api/verification` | Tiered studio verification |
| Upload | `/api/upload` | File upload with validation |
| Follows | `/api/follows` | Follow/unfollow studios and games |
| Wishlist | `/api/wishlist` | Game wishlist management |
| Reports | `/api/reports` | Content moderation reports |
| Health | `/health` | Platform health status |
| Achievements | `/api/achievements` | Player and studio achievements |
| Goals | `/api/goals` | Studio milestone goals |

---

## Database Schema

**51 models** across the Prisma schema, including:

| Category | Tables |
|----------|--------|
| **Identity** | User, Session, RefreshToken, VerificationToken, PasswordResetToken |
| **Studios** | Studio, StudioMember, StudioInvitation, StudioVerificationRequest |
| **Studio Content** | BrandKit, StudioPressKit, CompanyProfile |
| **Games** | Game, GameMedia, PlatformLink, PressKit, GameView |
| **Devlogs** | Devlog, DevlogScreenshot, DevlogLike |
| **Community** | Comment, Reaction, Follow |
| **Feed** | FeedEvent, ActivityEvent |
| **Notifications** | Notification, PushSubscription |
| **Analytics** | AnalyticsEvent, AnalyticsDailyAggregate |
| **Achievements** | Achievement, PlayerXpEvent, StudioXpEvent, StudioAchievement, StudioGoal |
| **Trust** | StudioHealthScore, StudioWeeklyReport |
| **Support** | SupportCategory, SupportTicket, SupportReply, SupportAttachment, SupportTicketHistory |
| **Help** | HelpCategory, HelpArticle, HelpArticleFeedback |
| **Moderation** | ModerationReport, AuditLog |
| **Player** | WishlistItem, StudioChatMessage |
| **Tags** | Tag, GameTag |
| **Misc** | EmailVerificationCode, GameView |

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 11+
- **PostgreSQL** database (local or [Neon](https://neon.tech) free tier)
- **VAPID keys** for push notifications (optional — feature skips gracefully)

### Quick Start

```bash
git clone git@github.com:ricardocesidio/playmorrow.git
cd playmorrow
pnpm install
pnpm setup:env
```

Edit the `.env` files with your credentials:

| File | Required Variables |
|------|-------------------|
| `.env` | (root — minimal, mostly empty) |
| `apps/api/.env` | `DATABASE_URL`, `SESSION_SECRET`, `JWT_SECRET`, `WEB_ORIGIN`, `CSRF_SECRET` |
| `apps/web/.env.local` | (minimal — most API config is server-side) |
| `packages/database/.env` | `DATABASE_URL` (same as API) |

```bash
# Push schema to database
pnpm db:push

# Generate Prisma client
pnpm db:generate

# Seed demo data (if desired)
pnpm db:seed

# Start development servers
pnpm dev
```

Open http://localhost:3000 (frontend) and http://localhost:4000/health (API).

### Environment Variables Reference

#### Backend (`apps/api/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon pooler) |
| `SESSION_SECRET` | ✅ | Session cookie encryption key |
| `JWT_SECRET` | ✅ | JWT token signing key |
| `WEB_ORIGIN` | ✅ | CORS allowed origin (e.g. `http://localhost:3000`) |
| `CSRF_SECRET` | ✅* | HMAC key for CSRF token signing (required in production, fallback in dev) |
| `RESEND_API_KEY` | ❌* | Transactional email (required for registration, password reset) |
| `VAPID_PUBLIC_KEY` | ❌ | Push notifications — public key |
| `VAPID_PRIVATE_KEY` | ❌ | Push notifications — private key |
| `VAPID_SUBJECT` | ❌ | Push notifications — mailto: contact |
| `SENTRY_DSN` | ❌ | Error tracking DSN |
| `REDACTED_AWS_KEY` | ❌ | S3 uploads (local disk fallback) |
| `REDACTED_AWS_SECRET` | ❌ | S3 uploads |
| `AWS_REGION` | ❌ | S3 region |
| `AWS_BUCKET` | ❌ | S3 bucket name |
| `NODE_ENV` | ✅ | `development` or `production` |

\* Required for production

#### Frontend (`apps/web/.env.local`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_API_URL` | ❌ | Client-side API base URL (default: `/api`) |
| `NEXT_PUBLIC_SITE_URL` | ❌ | Canonical site URL (auto-detected in dev) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ❌ | Push notifications — public key |
| `VAPID_PRIVATE_KEY` | ❌ | Service worker push encryption |

---

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start both frontend + backend in dev mode (Turbo) |
| `pnpm dev:api` | Start backend only |
| `pnpm dev:web` | Start frontend only |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm db:push` | Push Prisma schema to database |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm setup:env` | Create `.env` files from examples |
| `pnpm format` | Format code with Prettier |
| `pnpm loadtest` | Run k6 load tests |

---

## Testing

| Layer | Tool | Scope | Status |
|-------|------|-------|--------|
| **Unit/Integration** | Vitest | API controllers, services, guards | 301 tests across 24 spec files |
| **E2E** | Playwright | Full browser flows | Configured, requires running servers |
| **Load** | k6 | API performance baseline | Scripts available |

Run `pnpm test` for the full suite.

---

## Release Process

Every major release follows engineering validation. The **first public launch** requires completion of the mandatory Final Release Certification:

📄 [`docs/releases/FINAL_RELEASE_CERTIFICATION.md`](docs/releases/FINAL_RELEASE_CERTIFICATION.md)

This process validates the real production system end-to-end before launch — automated tests, manual QA, security audit, performance benchmarks, SEO validation, closed beta with real studios, and a final go/no-go decision.

Phase 2 Certification: [`docs/releases/PHASE2_CERTIFICATION.md`](docs/releases/PHASE2_CERTIFICATION.md)

## Deployment

### Frontend (Vercel)

The frontend automatically deploys from the `main` branch via Vercel's GitHub integration. Key configuration:

- Root directory: `apps/web`
- Rewrites proxy `/api/*` to Fly.io backend

**Required Vercel env vars:** `API_URL`, `NEXT_PUBLIC_SITE_URL`

### Backend (Fly.io)

The backend deploys via `flyctl deploy` from the repository root. The Dockerfile (`apps/api/Dockerfile`) builds all packages and runs the NestJS application. Configuration is in `fly.toml`.

**Required Fly.io secrets:** `DATABASE_URL`, `SESSION_SECRET`, `JWT_SECRET`, `WEB_ORIGIN`, `NODE_ENV`, `CSRF_SECRET`, `RESEND_API_KEY`, `SENTRY_DSN`

Health check: `GET /api/health` → `{"status":"ok","service":"playmorrow-api"}`

**Live URLs:**
- Frontend: [https://playmorrow.vercel.app](https://playmorrow.vercel.app)
- API: [https://playmorrow-api-aged-mountain-9542.fly.dev](https://playmorrow-api-aged-mountain-9542.fly.dev)
- Health: `https://playmorrow-api-aged-mountain-9542.fly.dev/api/health`

---

## Authentication & Authorization

Playmorrow uses a dual RBAC system:

### Global Roles

| Role | Scope | Permissions |
|------|-------|-------------|
| `PLAYER` | Platform-wide | Browse, follow, comment, react, wishlist, view content |
| `PUBLISHER` | Platform-wide | PLAYER + manage own studios and games |
| `MODERATOR` | Platform-wide | PUBLISHER + moderate content, manage reports |
| `ADMIN` | Platform-wide | Full platform access, all CRUD operations, system config |

### Studio Roles

| Role | Scope | Permissions |
|------|-------|-------------|
| `OWNER` | Per-studio | Full studio management, transfer ownership (max 2 per studio) |
| `ADMIN` | Per-studio | All studio operations except ownership transfer (max 3 per studio) |
| `MODERATOR` | Per-studio | Community moderation, content management (max 10 per studio) |
| `MEMBER` | Per-studio | Create content, participate in discussions |

### Authentication Flow

1. **Session-based auth** using `playmorrow_session` httpOnly cookie
2. **OAuth** via Google and GitHub (Passport strategies)
3. **CSRF protection** via stateless HMAC-SHA256 tokens applied globally
4. **Rate limiting** via ThrottlerModule (global 60 req/min)
5. **Email verification** required before full platform access
6. **Password recovery** via 15-minute token-based reset flow

---

## Security

Playmorrow is built with security as a first-class concern:

| Layer | Protection |
|-------|-----------|
| **Authentication** | Session-based httpOnly cookies, OAuth state parameter, timing-safe comparisons |
| **Authorization** | Dual RBAC (global + studio-scoped), seat limits, global guard |
| **CSRF** | Stateless HMAC-SHA256 tokens, global APP_GUARD, X-CSRF-Token header |
| **XSS** | DOMPurify on all rendered markdown, sanitize-html on content fields |
| **Input Validation** | class-validator whitelist + forbidNonWhitelisted on all DTOs |
| **Upload Security** | MIME whitelist, magic byte verification, 4096px dimension limit, 20MB limit |
| **Password Storage** | argon2id hashing |
| **HTTP Security** | Helmet middleware, CSP headers (nonce-based), CORS configuration |
| **Rate Limiting** | Global 60 req/min + per-route overrides |
| **Audit** | Full audit log for all platform actions |
| **Error Handling** | Structured error responses, no stack leaks in production |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for our contribution guidelines.

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

Security vulnerabilities should be reported privately via [SECURITY.md](SECURITY.md) — please do not file public issues.

---

## Project Status

See [STATUS.md](STATUS.md) for the complete verified feature inventory, engineering scores, known issues, and remaining work.

---

## License

All Rights Reserved. Playmorrow is proprietary software.

---

<p align="center">
  <a href="https://playmorrow.vercel.app/terms">Terms of Service</a>
  &nbsp;&middot;&nbsp;
  <a href="https://playmorrow.vercel.app/privacy">Privacy Policy</a>
  &nbsp;&middot;&nbsp;
  <a href="https://playmorrow.vercel.app/cookies">Cookie Policy</a>
  &nbsp;&middot;&nbsp;
  <a href="https://playmorrow.vercel.app/community-guidelines">Community Guidelines</a>
  &nbsp;&middot;&nbsp;
  <a href="https://github.com/ricardocesidio/playmorrow">GitHub</a>
</p>
