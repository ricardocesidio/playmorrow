# Playmorrow

**Discover tomorrow's indie games today.**

[![CI](https://github.com/ricardocesidio/playmorrow/actions/workflows/ci.yml/badge.svg)](https://github.com/ricardocesidio/playmorrow/actions)

Playmorrow is a social discovery platform connecting indie game studios with
players. Studios share development journeys through devlogs, roadmaps, and press
kits. Players discover upcoming games, follow development, build wishlists, and
join the conversation. The platform includes a marketplace (Stripe Connect),
events, a B2B partner CRM, and an AI recommendation layer.

**Live:** [playmorrow.co](https://playmorrow.co) — currently in **beta**.

---

## Production Status & History

Playmorrow is a **beta product** in active development. The production dataset
is small and changes frequently.

**2026-08-06 incident (disclosed):** a development database operation
(`prisma migrate reset`) executed against the production database and cleared
the production dataset. Neon's point-in-time recovery (6-hour retention, no
snapshots) could not restore it. Remediated 2026-08-07 with separate production
and development Neon branches, a fail-closed DB safety guard
(`packages/database/scripts/db-guard.mjs`), and nightly `pg_dump` backups to R2
with a verified restore drill. See [SECURITY.md](SECURITY.md) for details.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + React 19 + Tailwind CSS v4 |
| Backend | NestJS 11 + TypeScript |
| Database | PostgreSQL 16 (Neon) + Prisma ORM + pgvector |
| Auth | Session-based (httpOnly cookies) + OAuth (Google, GitHub) + TOTP 2FA |
| AI | Provider-agnostic (OpenAI + Anthropic), hybrid recommendation engine |
| Payments | Stripe Connect + PaymentIntent |
| Storage | Cloudflare R2 (S3-compatible) |
| Email | Resend API |
| Real-time | SSE + push notifications |
| Caching | Upstash Redis |

---

## Architecture

```
Frontend (Next.js / Vercel)
    ↕  API requests (Next.js rewrites)
Backend (NestJS / Fly.io)
    ↕  Prisma ORM
PostgreSQL (Neon, with pgvector)
```

- **Frontend:** Next.js 16 App Router, server components, Turbopack, Tailwind CSS
- **Backend:** NestJS 11 REST API — 58 modules, ~250 endpoints, validation
  pipes, global CSRF guard, Redis-backed rate limiting
- **Database:** 65 Prisma models, 41 migrations, pgvector for AI embeddings

---

## Getting Started

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Configure required environment variables in each .env file
pnpm dev
```

The dev environment starts the API (`localhost:4000`) and frontend
(`localhost:3000`) with hot-reload.

### Database

```bash
pnpm db:push    # Apply schema to dev database
pnpm db:seed    # Seed with demo data
pnpm db:migrate # Run migrations
```

### Tests

```bash
pnpm verify     # Lint + typecheck + build (all workspaces)
pnpm test       # API test suite (542 tests; requires isolated test DB)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the isolated test database workflow.

---

## Project Structure

```
apps/
  api/          NestJS backend (58 modules)
  web/          Next.js frontend (100+ routes, App Router)
packages/
  database/     Prisma schema, migrations, seed
  types/        Shared TypeScript types
  sdk/          API client SDK
  config/       Shared dev config
  cli/          CLI tools
```

---

## AI & Recommendations

Playmorrow runs a hybrid recommendation engine combining semantic embeddings
(pgvector) with collaborative signals. Personalization is consent-gated and the
system is currently under governed observation at a controlled rollout
percentage. Provider-agnostic architecture supports OpenAI and Anthropic.

---

## Security

Security controls include:

- Session-based authentication with httpOnly/Secure/SameSite cookies
- Argon2id password hashing
- TOTP-based two-factor authentication with SHA-256-hashed backup codes
- RBAC with studio-level roles (Owner, Admin, Moderator, Member)
- Stateless HMAC-SHA256 CSRF protection on all authenticated mutations
- Content Security Policy (Stripe and analytics origins allow-listed)
- Rate limiting with Redis atomic Lua scripting (fail-open)
- Input validation with global whitelist + forbid-non-whitelisted pipes
- Upload validation (MIME type + magic bytes + dimensions)
- Parameterized database queries via Prisma ORM
- Secret scanning (Gitleaks), dependency review, SAST (CodeQL/Semgrep) in CI
- Pre-push quality gate (`pnpm verify`)

See [SECURITY.md](SECURITY.md) for the security policy, known gaps, and
responsible disclosure process.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

This project is licensed under the terms in [LICENSE](LICENSE).
