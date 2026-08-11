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
| Phase 6 — AI | 🚧 Observation | M23 deployed at 5% under **observation freeze** (25% gate LOCKED); M22/M24/M25/M26 gated until gate evaluated |

**Publishing — studios publish games via the dashboard (completeness gate); public catalog/search only show published games. AI does not decide public visibility — publishing is a product/studio decision; AI works on already-eligible content.**

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

### M23 — Hybrid Recommendation Engine (DEPLOYED, 5% OBSERVATION FREEZE)

- Hybrid "For You" feed: legacy scoring floor ∪ pgvector semantic candidates,
  weighted ranking + MMR diversity, every card explains why it was chosen
- **Consent-gated personalization** (AI Constitution Art. 5): opt-in via
  `/settings/personalization`, default off; opted-out users' data is never read
- **Measurable by design**: CLICKED / DISMISSED / IMPRESSION feedback with
  60-min dedup, one-click history reset, ADMIN CTR metrics endpoint
- **Fail-graceful**: provider/pgvector down → content/trending fallback,
  never a 500; `RECOMMENDATIONS_ENABLED=false` kill switch
- Config-driven embeddings (`AI_EMBEDDING_MODEL`, `AI_EMBEDDING_DIMENSIONS`)
  with dimension-abort + empty-catalog guards in the nightly refresh
- Also ships: semantic search (search page + game detail), per-request
  assistant chat (M22-flag gated)
- **Observation freeze (2026-08-10 → 2026-08-17):** system is frozen at 5% —
  no scoring/model/UX/metric changes, **25% gate LOCKED** until evaluated.
  See `docs/ai/M23_OBSERVATION_FREEZE.md`.

**Planned (ALL gated until M23 25% gate evaluated):** M26 Semantic Search (expansion), M25 Studio Intelligence, M22 AI Assistant, M24 AI Moderation

**Governance:** 20 constitutional articles · 15 guiding principles · provider-agnostic architecture · 5% → 25% → 100% gated rollout

**Docs:** [`docs/ai/AI_RECOMMENDATION_ARCHITECTURE.md`](docs/ai/AI_RECOMMENDATION_ARCHITECTURE.md) ·
[`docs/ai/M23_ROLLOUT.md`](docs/ai/M23_ROLLOUT.md) ·
[`docs/ai/M23_METRICS.md`](docs/ai/M23_METRICS.md) ·
[`docs/ai/M23_OBSERVATION_FREEZE.md`](docs/ai/M23_OBSERVATION_FREEZE.md) ·
[`docs/releases/M23_PRODUCTION_OBSERVATION_CERTIFICATION.md`](docs/releases/M23_PRODUCTION_OBSERVATION_CERTIFICATION.md)

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
| `docs/security/SECURITY_ASSESSMENT_V2.md` | **Security Assessment v2 — full audit report** |
| `docs/security/SECURITY_THREAT_MODEL.md` | **Threat model & attack surface** |
| `docs/security/SECURITY_CVE_INVENTORY.md` | **CVE inventory & correlation** |
| `docs/security/SECURITY_FINDINGS.md` | **Findings register & remediation** |
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
