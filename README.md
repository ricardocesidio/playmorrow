# Playmorrow

**Discover tomorrow's indie games today.**

[![CI](https://github.com/ricardocesidio/playmorrow/actions/workflows/ci.yml/badge.svg)](https://github.com/ricardocesidio/playmorrow/actions)

---

## What Is Playmorrow?

Playmorrow is a social discovery platform connecting indie game studios with
players. Studios share development journeys through devlogs, roadmaps, and press
kits. Players discover upcoming games, follow development, build wishlists, and
join the conversation. The platform includes a marketplace (Stripe Connect),
events, a B2B partner CRM, and an AI recommendation layer.

**Live:** [playmorrow.co](https://playmorrow.co)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + React 19 + Tailwind CSS v4 |
| Backend | NestJS 11 + TypeScript |
| Database | PostgreSQL 16 (Neon) + Prisma ORM |
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
PostgreSQL (Neon)
```

- **Frontend:** Next.js 16 App Router, server components, Turbopack, Tailwind CSS
- **Backend:** NestJS 11 REST API with ~55 modules, validation pipes, global
  CSRF guard, Redis-backed rate limiting
- **Database:** 63 Prisma models, 41 migrations, pgvector for AI embeddings

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
pnpm test       # API test suite (requires disposable Postgres on :5433)
```

---

## Project Structure

```
apps/
  api/          NestJS backend (~55 modules, 170+ endpoints)
  web/          Next.js frontend (80+ routes, App Router)
packages/
  database/     Prisma schema, migrations, seed
  types/        Shared TypeScript types
  sdk/          API client SDK
  config/       Shared dev config
  cli/          CLI tools
```

---

## AI & Recommendations

Playmorrow runs a hybrid recommendation engine (M23) combining semantic
embeddings (pgvector) with collaborative signals. Personalization is
consent-gated and the system is currently under governed observation at a
controlled rollout percentage. Provider-agnostic architecture supports OpenAI
and Anthropic.

---

## Security

Security controls include:

- Session-based authentication with httpOnly/Secure/SameSite cookies
- Argon2id password hashing with configurable memory cost
- TOTP-based two-factor authentication
- RBAC with studio-level roles (Owner, Admin, Moderator, Member)
- Stateless HMAC-SHA256 CSRF protection on all authenticated mutations
- Content Security Policy with nonce-based script execution
- Rate limiting with Redis atomic Lua scripting (fail-open)
- Input validation with global whitelist + forbid-non-whitelisted pipes
- Upload validation (MIME type + magic bytes + dimensions)
- Parameterized database queries via Prisma ORM
- Secret scanning (Gitleaks), dependency review, SAST (CodeQL/Semgrep) in CI
- Pre-commit and pre-push hooks for quality gating

See [SECURITY.md](SECURITY.md) for our security policy and responsible
disclosure process.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

This project is licensed under the terms in [LICENSE](LICENSE).
