# Playmorrow

**Discover tomorrow's indie games today.**

[![CI](https://github.com/ricardocesidio/playmorrow/actions/workflows/ci.yml/badge.svg)](https://github.com/ricardocesidio/playmorrow/actions)

Playmorrow is a social discovery platform connecting indie game studios with
players. Studios broadcast their development journey in real time through
devlogs, roadmaps, and press kits; players discover upcoming games, follow
development, build wishlists, and join the conversation. On top of the social
layer, the platform offers a marketplace (Stripe Connect), community events,
a B2B partner CRM, and a governed, explainable AI recommendation engine.

**Live:** [playmorrow.co](https://playmorrow.co) — currently in **beta**.

---

## Table of Contents

- [Status & History](#status--history)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Testing](#testing)
- [AI & Recommendations](#ai--recommendations)
- [Security](#security)
- [CI/CD & Operations](#cicd--operations)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Status & History

Playmorrow is a **beta product** in active development. The production dataset
is small and changes frequently. Status and known issues are tracked in
[`STATUS.md`](STATUS.md); a chronological development history lives in
[`AGENTS.md`](AGENTS.md).

**2026-08-06 incident (disclosed):** a development database operation
(`prisma migrate reset`) executed against the production database and cleared
the production dataset. Neon's point-in-time recovery (6-hour retention, no
snapshots) could not restore it. Remediated 2026-08-07:

- Separate **production** and **development** Neon branches (hard isolation).
- Fail-closed DB safety guard (`packages/database/scripts/db-guard.mjs`) wired
  into every DB script — destructive operations are blocked against the
  production host and against unknown hosts.
- Nightly `pg_dump` backups to Cloudflare R2 with a verified restore drill and
  a read-only backup role.
- Credential rotation (DB password, Neon API key) with a clean secret-exposure
  audit of the full git history.

See [SECURITY.md](SECURITY.md) and `docs/infrastructure/` for details.

**Current milestone (2026-08-15):** the M23 hybrid recommendation engine is
**deployed to production** and under a governed **5% rollout observation**
window (baseline 2026-08-10 → 2026-08-17). See
[`docs/ai/M23_ROLLOUT.md`](docs/ai/M23_ROLLOUT.md).

Production onboarding flow was hardened in August 2026: CSRF self-heal, the
onboarding bounce (stale AuthContext) fix, and the `studioWebsite` →
`websiteUrl` payload alignment were all fixed, tested, and verified live.

---

## Features

### Discovery & Community

- **Game directory** — searchable catalog with genres, tags, platform links,
  screenshots, and press kits. Games are only public once published by their
  studio (server-authoritative `isPublished` gate).
- **Studios** — studio profiles, teams, followers, verification badges, and
  activity streams.
- **Devlogs** — blog-style development journals with Markdown editing, statuses,
  categories, tags, screenshots, and scheduled publishing.
- **Roadmaps** — per-game roadmap items with public/private visibility.
- **Feed** — a real-time "transmissions" feed (public + personal) powered by an
  event bus; devlogs, roadmap updates, and game status changes land as events.
- **For You feed** — AI-powered hybrid recommendations with explainable reasons,
  consent-gated personalization, and dismissal/CTR feedback (see
  [AI & Recommendations](#ai--recommendations)).
- **Comments & reactions** — threaded comments, per-type reactions, and
  community moderation.
- **Wishlists, follows, notifications** — wishlist tracking, game/studio
  following, and SSE + push notifications.

### Marketplace & Monetization

- **Marketplace** — asset/tool/service listings; purchases via **Stripe Connect
  Express** with platform commission (`application_fee_amount`), idempotent
  webhooks, and a transaction/license ledger.
- **Publisher dashboard** — per-studio revenue reporting.
- **Creator program** — referral codes and commission tracking.
- **Events & ticketing** — community event listings with registration.

### Platform & Governance

- **Dashboard** — role-aware player and studio dashboards (achievements,
  devlogs, media, marketplace, analytics, support, 2FA, GDPR, reports).
- **Admin tooling** — moderation queue, verification, email templates,
  analytics, and an AI debug panel.
- **Partner CRM** — B2B partner types (University, Publisher, Accelerator,
  Incubator, Studio, Event Organizer) with invites.
- **Support & help center** — ticket system and a searchable knowledge base.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + TanStack Query |
| Backend | NestJS 11 + TypeScript — 57 modules, ~254 endpoints |
| Database | PostgreSQL 16 (Neon, two branches) + Prisma ORM + pgvector |
| Auth | Session-based (httpOnly cookies) + OAuth (Google, GitHub) + TOTP 2FA + Argon2id |
| AI | Provider-agnostic (OpenAI + Anthropic), hybrid recommendation engine |
| Payments | Stripe Connect Express + PaymentIntent + idempotent webhooks |
| Storage | Cloudflare R2 (S3-compatible) |
| Email | Resend API |
| Real-time | SSE + Web Push notifications |
| Caching / rate-limit | Upstash Redis (atomic Lua throttling, fail-open) |
| Testing | Vitest (API) + Playwright (E2E) + Gitleaks + CodeQL |
| CI/CD | GitHub Actions (7 workflows), pre-push quality gate |

---

## Architecture

```
Frontend (Next.js 16 / Vercel)
    ↕  API requests (Next.js rewrites, +X-CSRF-Token)
Backend (NestJS 11 / Fly.io)
    ↕  Prisma ORM
PostgreSQL (Neon: production + dev branches, pgvector)
    ↑ nightly pg_dump → Cloudflare R2 (backups)
```

- **Frontend:** App Router with server components, Turbopack, nonce-based CSP,
  and a client API layer (`apps/web/lib/api/`) with TanStack Query hooks.
- **Backend:** NestJS with feature modules, global `ValidationPipe`
  (whitelist + forbid-non-whitelisted), global stateless HMAC-SHA256 CSRF guard,
  Redis-backed rate limiting, and an event bus powering the feed.
- **Database:** 65 Prisma models, 42 migrations, pgvector for AI embeddings.
  All schema changes ship as migrations (never `db push` in production).

A detailed architecture reference (including diagrams) lives in
[`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## Monorepo Structure

```
apps/
  api/          NestJS backend (57 modules, ~254 endpoints)
  web/          Next.js frontend (99+ routes, App Router)
packages/
  database/     Prisma schema, migrations, seed, DB safety guard
  types/        Shared TypeScript types
  sdk/          API client SDK
  config/       Shared dev config
  cli/          CLI tools
docs/
  security/     Security policy, threat model, CVE inventory, audit reports
  infrastructure/ Environment isolation, migration policy, recovery runbook
  ai/           AI architecture, rollout, metrics, governance
  releases/     Milestone certifications and engineering reports
  handoff/      Engineering handoffs
```

---

## Getting Started

Requirements: **Node 20+**, **pnpm 11+**, and a PostgreSQL database (local or
Neon) with the `vector` extension enabled.

```bash
# 1. Install dependencies
pnpm install

# 2. Create env files from the examples
pnpm setup:env
#   - apps/api/.env        (DATABASE_URL, JWT_SECRET, CSRF_SECRET, ...)
#   - apps/web/.env.local  (NEXT_PUBLIC_API_URL, ...)
#   - packages/database/.env (DATABASE_URL)

# 3. Apply the schema + seed demo data
pnpm db:migrate   # or pnpm db:push for a fresh dev DB
pnpm db:seed

# 4. Start API + frontend (hot reload)
pnpm dev
#   API      → http://localhost:4000/api
#   Frontend → http://localhost:3000
```

> **Warning:** the DB safety guard
> (`packages/database/scripts/db-guard.mjs`) blocks destructive operations
> (`db:reset`, `db:push`, destructive migrations, `db:seed`) against the
> production host and unknown hosts. Set `ALLOW_PROD_DB_OPERATIONS=1` **only**
> if you explicitly intend to touch production.

### Useful scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Run API + web with hot reload (Turbopack) |
| `pnpm verify` | Lint + typecheck + build across all workspaces |
| `pnpm test` | API test suite (requires isolated test DB) |
| `pnpm test:all` | API suite + web E2E (Playwright) |
| `pnpm lint` / `pnpm typecheck` / `pnpm build` | Individual gates |
| `pnpm db:migrate` / `pnpm db:push` / `pnpm db:seed` | Database workflows |
| `pnpm loadtest` | k6 load tests |
| `pnpm format` | Prettier across the repo |

---

## Environment Variables

See `apps/api/.env.example` and `apps/web/.env.example` for the canonical list.
Highlights:

**API (`apps/api/.env`):**
- `DATABASE_URL`, `WEB_ORIGIN`, `JWT_SECRET`, `SESSION_SECRET`, `CSRF_SECRET`
- `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` (OAuth)
- `RESEND_API_KEY`, `EMAIL_FROM` (email)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (marketplace)
- `OPENAI_API_KEY`, `AI_PROVIDER` (AI; `AI_EMBEDDING_MODEL`,
  `AI_EMBEDDING_DIMENSIONS`, `RECOMMENDATIONS_ENABLED`, `ROLLOUT_PCT`)
- `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (Web Push)
- `SENTRY_DSN` (error tracking)

**Web (`apps/web/.env.local`):**
- `NEXT_PUBLIC_API_URL` / `API_URL` (dev API vs production Railway-style proxy)
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_PLAUSIBLE_URL`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (analytics)

---

## Database

```bash
pnpm db:migrate   # apply migrations (recommended)
pnpm db:push      # apply schema directly (dev only)
pnpm db:seed      # seed demo data
pnpm db:studio    # Prisma Studio
```

- **65 models** across the schema (users, studios, games, devlogs, roadmaps,
  feed events, comments, marketplace, payments, events, partners, AI/feedback,
  and more).
- **42 migrations**; production and development run on **separate Neon
  branches**. Migrations are applied in production via `prisma migrate deploy`
  as a Fly.io release command.
- **pgvector** powers semantic embeddings for the recommendation engine
  (`game_embeddings` with HNSW index).

See [`docs/infrastructure/DATABASE_MIGRATION_POLICY.md`](docs/infrastructure/DATABASE_MIGRATION_POLICY.md)
and [`docs/security/BACKUP_RESTORE.md`](docs/security/BACKUP_RESTORE.md).

---

## Testing

```bash
pnpm verify            # lint + typecheck + build (pre-push gate)
pnpm test              # API suite (Vitest)
pnpm test:all          # API suite + web E2E (Playwright)
```

- **API:** 54 spec files / 549 tests against an isolated test database
  (ephemeral Postgres in CI; local via `docker-compose.yml` `postgres-test`
  service). Integration tests create unique data and clean up in `afterAll`.
  One pre-existing test is flaky (comment-test timeout) and tracked in
  [`STATUS.md`](STATUS.md).- **Web E2E:** Playwright specs covering marketplace, events, partners,
  revenue, creator, and responsive layouts.
- **Static analysis:** ESLint (0 errors), TypeScript strict, Prettier.
- **Security scans:** Gitleaks (secrets), CodeQL/Semgrep (SAST) in CI.

See [`TEST_INFRASTRUCTURE_REPORT.md`](docs/releases/TEST_INFRASTRUCTURE_REPORT.md)
and [CONTRIBUTING.md](CONTRIBUTING.md).

---

## AI & Recommendations

Playmorrow runs a **hybrid recommendation engine** (M23) that combines:

1. **Semantic candidates** — pgvector embeddings of the user's taste signals.
2. **Legacy scoring floor** — the deterministic 9-scorer pool, so AI output can
   never be worse than the pre-AI feed.
3. **MMR re-ranking** for diversity, with **explainable reasons** per pick
   ("Because you're into X").

Governance and trust:

- **Consent-gated personalization** — off by default; zero personal data is
  read for opted-out users (AI Constitution Art. 5).
- **Kill switch** — `RECOMMENDATIONS_ENABLED=false` instantly returns the
  legacy feed.
- **Graceful degradation** — provider failures fall back to content/trending,
  never to an error (Art. 8).
- **Controlled rollout** — 5% deterministic rollout under observation until
  the 25% gate is evaluated (2026-08-17).
- **Provider-agnostic** — OpenAI + Anthropic behind a factory; no vendor lock-in.

Architecture and governance are documented in
[`docs/ai/AI_RECOMMENDATION_ARCHITECTURE.md`](docs/ai/AI_RECOMMENDATION_ARCHITECTURE.md),
[`docs/ai/M23_ROLLOUT.md`](docs/ai/M23_ROLLOUT.md), and the AI Constitution
(`docs/strategy/AI_CONSTITUTION.md`).

---

## Security

Security controls include:

- Session-based auth with httpOnly/Secure/SameSite cookies; Argon2id hashing;
  TOTP 2FA with SHA-256-hashed backup codes; account lockout.
- RBAC with studio-level roles (Owner, Admin, Moderator, Member) and a global
  ADMIN/MODERATOR tier; every controller guarded.
- Stateless **HMAC-SHA256 CSRF** protection on all authenticated mutations.
- Nonce-based **Content Security Policy**, HSTS, X-Frame-Options DENY.
- Rate limiting with Redis atomic Lua scripting (fail-open) + per-endpoint
  throttles.
- Input validation via global whitelist + forbid-non-whitelisted pipes;
  DOMPurify sanitization on all Markdown rendering.
- Upload validation (MIME type + magic bytes + dimension limits).
- Parameterized queries via Prisma; encrypted TOTP secrets; audit logging.
- Secret scanning (Gitleaks pre-commit), dependency review, SAST (CodeQL,
  Semgrep/Opengrep) in CI; a documented dependency/CVE inventory.
- Fail-closed DB safety guard and nightly encrypted backups with restore drills.

The security policy, dependency/CVE inventory, threat model, and responsible
disclosure process live in [`SECURITY.md`](SECURITY.md).

---

## CI/CD & Operations

Seven GitHub Actions workflows:

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Lint, typecheck, API tests, build on push/PR |
| `security-scan.yml` | CodeQL + dependency audit + secrets |
| `dependency-review.yml` | PR dependency change review |
| `smoke-test.yml` | Production endpoint smoke tests |
| `a11y.yml` | Accessibility checks |
| `uptime-check.yml` | Uptime monitoring |
| `backup-db.yml` | Nightly production `pg_dump` → R2 + integrity check |

Deployment:

- **Frontend:** Vercel (auto-deploy on `main`).
- **Backend:** Fly.io — release command runs `prisma migrate deploy`; secrets
  stored in the platform (never in the repo).
- **Database:** Neon with separate production/dev branches; a read-only backup
  role for nightly dumps.

Operations runbooks live in `docs/infrastructure/` (environment isolation,
migration policy, database recovery).

---

## Documentation

| Document | Contents |
|----------|----------|
| `STATUS.md` | Current verified state, known issues, deployment info |
| `ARCHITECTURE.md` | Full architecture with diagrams |
| `SECURITY.md` | Security policy, CVE inventory, threat model |
| `CONTRIBUTING.md` | Contribution workflow, test DB setup, coding standards |
| `AGENTS.md` | Chronological development history |
| `CHANGELOG.md` | Release-by-release changes |
| `docs/strategy/PHASE6_ROADMAP.md` | Phase 6 (AI) roadmap |
| `docs/releases/ROADMAP_STATUS.md` | Roadmap status |
| `docs/ai/` | AI architecture, rollout, metrics, governance |
| `docs/infrastructure/` | DB isolation, migration policy, recovery runbook |
| `docs/releases/` | Milestone certifications and engineering reports |
| `docs/strategy/` | AI governance (North Star, Constitution, roadmap) |

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) —
it covers the contribution workflow, the isolated test-database setup, coding
standards, and the mandatory quality gates. Security issues should be reported
privately (see [SECURITY.md](SECURITY.md)).

---

## License

This project is licensed under the terms in [LICENSE](LICENSE).
