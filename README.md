# Playmorrow

**Discover tomorrow's indie games today.**

[![CI](https://github.com/ricardocesidio/playmorrow/actions/workflows/ci.yml/badge.svg)](https://github.com/ricardocesidio/playmorrow/actions)

---

## What Is Playmorrow?

Playmorrow is a social discovery platform connecting indie game studios with players. Studios share their development journey through devlogs, roadmaps, trailers, and press kits. Players discover upcoming games, follow development, build wishlists, and join the conversation. The platform includes a marketplace (Stripe Connect), events, a B2B partner CRM, and an AI intelligence layer.

**Live:** [https://playmorrow.co](https://playmorrow.co) | **API:** Fly.io | **DB:** Neon PostgreSQL (prod/dev on separate branches)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + React 19 + Tailwind CSS v4 |
| Backend | NestJS 10 + TypeScript |
| Database | PostgreSQL 16 (Neon serverless) + Prisma 6 ORM |
| Auth | Session-based (httpOnly cookies) + OAuth (Google, GitHub) + TOTP 2FA |
| AI | Provider-agnostic (OpenAI + Anthropic), embedding-based recommendations |
| Payments | Stripe Connect Express + PaymentIntent (PCI SAQ A) |
| Storage | Cloudflare R2 (S3-compatible) |
| Email | Resend API + Cloudflare Email Routing |
| Real-time | SSE via RxJS Subject |
| Redis | Upstash — rate-limiter storage (atomic Lua, fail-open) |
| Deploy | Vercel (frontend) + Fly.io (backend) |
| CI/CD | GitHub Actions (6 workflows) |
| Monorepo | pnpm workspaces + Turborepo |

---

## Project Status (v0.85-beta)

| Phase | Status | Milestones |
|-------|--------|-----------|
| Phase 1 — Core | ✅ Complete | M1-M5: Game pages, devlogs, feed, search, auth |
| Phase 2 — Quality | ✅ Complete | M6-M7: Performance, SEO, CI/CD |
| Phase 3 — Trust | ✅ Complete | M8-M9: Moderation, email automation |
| Phase 4 — Platform | ✅ Complete | M10-M15: Security, public API, SDK, hardening |
| Phase 5 — Ecosystem | ✅ Complete | M16-M21: Marketplace, Events, Partners, Creator, Publisher |
| Phase 6 — AI | 🚧 In Progress | M23 shipped (embedding-based recs), M22/M24/M25/M26 pending |

**Scale:** 63 database models · 55 NestJS modules · 82+ frontend routes · 35 AI module files · 368+ tests

---

## Quick Start

```bash
git clone https://github.com/ricardocesidio/playmorrow.git
cd playmorrow
pnpm install
pnpm dev
```

Frontend: [http://localhost:3000](http://localhost:3000) | API: [http://localhost:4000](http://localhost:4000) | Swagger: [http://localhost:4000/docs](http://localhost:4000/docs)

---

## Environment Variables

### Backend (`apps/api/.env`)

```bash
# Required
DATABASE_URL="postgresql://..."        # Neon connection string
JWT_SECRET="generate: openssl rand -base64 32"
SESSION_SECRET="generate: openssl rand -base64 32"
CSRF_SECRET="generate: openssl rand -base64 32"
RESEND_API_KEY="re_..."                # Email delivery
WEB_ORIGIN="http://localhost:3000"

# Marketplace (Phase 5)
STRIPE_SECRET_KEY="sk_test_..."        # Use test keys for development
STRIPE_WEBHOOK_SECRET="whsec_..."

# AI (Phase 6 — optional)
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."

# Infrastructure (optional)
REDIS_URL=""                           # Upstash Redis (throttler storage; fail-open if absent)
REDIS_TOKEN=""                         # Upstash token, fallback to URL embedded token
SENTRY_DSN=""                          # Error tracking
STORAGE_PROVIDER="local"               # local (dev) or r2 (prod)
```

### Frontend (`apps/web/.env.local`)

```bash
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

⚠️ Never commit `.env` files.

---

## Architecture

```
Browser → Vercel (playmorrow.co)
              │ /api/* rewrites
              ▼
         Fly.io (playmorrow-api)
              │ Prisma
              ▼
         Neon (PostgreSQL + pgvector)
              │ S3 API
              ▼
         Cloudflare R2 (uploads)
```

---

## Testing

```bash
pnpm test              # All tests
pnpm verify            # Pre-push: lint + typecheck + build
```

**Coverage:** 40% lines, 30% branches (CI-enforced)

---

## Security

- **Auth:** Session-based (httpOnly, SameSite), argon2id, TOTP 2FA, OAuth (Google/GitHub)
- **CSRF:** HMAC-SHA256 stateless, global guard on all mutation endpoints
- **CSP:** Nonce-based per-request, no unsafe-inline in production
- **XSS:** DOMPurify on all Markdown rendering
- **Rate limiting:** 60 req/min global, stricter on AI/auth/upload endpoints
- **Upload validation:** MIME + magic bytes + dimension caps + size limits
- **PCI:** SAQ A — Stripe.js tokenizes on frontend
- **Secrets scanning:** Gitleaks in CI
- **SAST:** CodeQL + Semgrep + Trivy + SBOM

---

## AI Features

### M23 — Embedding-Based Recommendations (SHIPPED)

- Text embeddings via OpenAI `text-embedding-3-small`
- Cosine similarity scoring for semantic game recommendations
- Tag-based fallback when AI provider unavailable
- First feature exercising the 35-file AI pipeline

**Planned:** M26 Semantic Search, M25 Studio Intelligence, M22 AI Assistant, M24 AI Moderation

**Governance:** 20 constitutional articles · 8-gate decision framework · provider-agnostic architecture

---

## Documentation

| Document | Purpose |
|----------|---------|
| `docs/handoff/HANDOFF.md` | Complete project overview, architecture, security |
| `docs/releases/CLAUDE_REVIEW_PACKAGE.md` | Auditor briefing |
| `STATUS.md` | Feature inventory |
| `ARCHITECTURE.md` | Technical architecture |
| `CHANGELOG.md` | Release notes |
| `SECURITY.md` | Security policy |
| `docs/archive/` | Retired certifications and obsolete docs |

---

## Contributing

1. Fork and clone
2. `pnpm install`
3. Copy `.env.example` files and configure
4. `pnpm dev` to start
5. `pnpm verify` before pushing (enforced by pre-push hook)

**PR requirements:** tests pass · lint clean · typecheck clean · no new `any` types · coverage thresholds met

---

## License

Proprietary — All Rights Reserved | Contact: playmorrow@hotmail.com

---

*Self-certifications retired 2026-08-05 following independent architectural audit. See `docs/archive/` for historical documents.*
