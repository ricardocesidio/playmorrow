# Playmorrow — Engineering Handoff

**Prepared for:** Incoming senior engineering team  
**Date:** 2026-08-05  
**Current version:** v1.0.0-platinum  
**Engineering score:** 91/100 (RC3.2 Platinum Certified)

---

## 1. Project Overview

**Playmorrow** is a social discovery platform for indie games — the social layer connecting indie studios with players before launch. Studios showcase their development journey through devlogs, roadmaps, trailers, and press kits. Players discover upcoming games, follow studios, build wishlists, and participate in threaded community discussions. The platform also includes a marketplace with Stripe Connect payments, an events system, a B2B partner CRM, and a referral/creator program.

| | |
|---|---|
| **Product** | Indie game social discovery platform |
| **Domain** | [playmorrow.co](https://playmorrow.co) |
| **Repo** | [github.com/ricardocesidio/playmorrow](https://github.com/ricardocesidio/playmorrow) (public) |
| **Version** | v1.0.0-platinum (frozen) |
| **License** | Proprietary — All Rights Reserved |
| **Contact** | playmorrow@hotmail.com |

### Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (App Router) + React + TypeScript | 15 / 19 / 5.6 |
| Styling | Tailwind CSS v4 + CSS Modules | 4.x |
| State management | TanStack Query v5 (server state) + React context (UI state) | 5.x |
| Backend | NestJS + Express + TypeScript | 10.x |
| Database | PostgreSQL (Neon serverless with connection pooler) | 16 |
| ORM | Prisma | 5.x |
| Auth | Session-based (httpOnly cookie) + OAuth (Google, GitHub) | — |
| Real-time | SSE via RxJS Subject | — |
| Email | Resend API | — |
| Uploads | Local disk (dev) / Cloudflare R2 (prod) | — |
| Payments | Stripe Connect Express + PaymentIntent | 2025.x |
| AI (foundation) | Provider-agnostic abstraction (OpenAI + Anthropic), pgvector | — |
| Package manager | pnpm (workspaces) | 11.1+ |
| Build system | Turborepo | 2.x |
| Testing | Vitest + Supertest + Playwright | 2.x / 7.x / latest |
| Monitoring | Sentry + Pino structured logging + UptimeRobot | — |
| CI/CD | GitHub Actions (6 workflows) | — |
| Deployment | Vercel (frontend) + Fly.io (API) | — |
| Containerization | Docker (multi-stage) | — |
| Pre-push hook | simple-git-hooks → `pnpm verify` (lint + typecheck + build) | — |

---

## 2. Project Status

### Overall Scores

| Dimension | Score | Certification |
|---|---|---|
| Engineering | 91/100 | RC3.2 Platinum |
| Security | 90/100 | HMAC CSRF, CSP nonce, argon2id, SAQ A |
| QA | 88/100 | 33 test files, 368+ tests |
| Accessibility | 92/100 (Lighthouse) | WCAG 2.2 AA (55 fixes on 11 pages) |
| Production | 96/100 (Best Practices), 100/100 (SEO) | Lighthouse verified |
| AI Foundation | 92/100 | Strategy, Governance, Product Architecture, Execution certified |

### Completed Phases (1–5, 21 milestones)

| Phase | Milestones | Description |
|---|---|---|
| **Phase 1 — Core** | M1–M5 | Support center, help center, studio analytics, verification & trust, discovery platform (9 scorers, Search 2.0, Dynamic Collections) |
| **Phase 2 — Quality** | M6–M7 | Performance & SEO (auto-refresh, OG/canonical/JSON-LD/sitemap), QA & CI/CD (GitHub Actions, pre-push hooks) |
| **Phase 3 — Trust** | M8–M9 | Moderation center (reports, strikes, appeals, DMCA, shadow bans, auto-escalation), email automation (templates, digests, bounce handling) |
| **Phase 4 — Platform** | M10–M15 | Security hardening (global HMAC CSRF, CSP nonce, DOMPurify, rate limiting), Public API + SDK + CLI, production hardening, professionalization audit, final UI polish (devlog blog redesign, push notifications, SSE, avatar, email verification) |
| **Phase 5 — Ecosystem** | M16–M21 | Marketplace (Stripe Connect, PaymentIntent, PCI SAQ A), Publisher (revenue dashboard), Funding (scope — crowdfunding model defined), Creator (referral codes + commissions), Partner (B2B CRM), Events (listings, ticketing) |

### Phase 6 — AI & Platform Intelligence (Foundation built, features pending)

| Milestone | Focus | Status |
|---|---|---|
| M22 | AI Assistant (context-aware, devlog drafts, studio insights) | Foundation built (35 files, 82 tests), features pending |
| M23 | Recommendation Engine (collaborative filtering, embeddings, explainable) | Planned (8 weeks) |
| M24 | AI Moderation (toxicity detection, auto-flagging, triage) | Planned (deferred to >50K DAU) |
| M25 | Studio Intelligence (sentiment analysis, store page optimizer, competitive benchmarking) | Planned (6 weeks) |
| M26 | Semantic Search (embeddings, hybrid keyword+semantic, natural language queries) | Planned (6 weeks) |

---

## 3. Architecture Summary

### Monorepo Structure

```
playmorrow/
├── apps/
│   ├── web/                          # Next.js 15 frontend (82+ routes)
│   │   ├── app/                      # App Router pages (RSC + client components)
│   │   ├── components/               # React components (ui/, dashboard/, shared)
│   │   ├── lib/                      # API client, hooks, utilities
│   │   ├── actions/                  # Server actions (cache revalidation)
│   │   ├── middleware.ts             # CSP nonce + security headers
│   │   └── public/sw.js              # Service worker (push notifications)
│   └── api/                          # NestJS 10 backend (55+ modules)
│       └── src/
│           ├── main.ts               # Bootstrap (loadEnvFile, rawBody, Swagger)
│           ├── common/               # CSRF guard (HMAC), event bus, decorators, helpers
│           ├── auth/                 # Session, JWT, OAuth, guards, strategies
│           ├── ai/                   # @Global() AI module (35 files)
│           ├── [feature]/            # Domain modules (games, studios, devlogs, etc.)
│           └── test/                 # Integration test helpers (excluded from prod build)
├── packages/
│   ├── database/                     # Prisma schema (63 models), migrations, client
│   ├── sdk/                          # @playmorrow/sdk (JS API client)
│   └── cli/                          # playmorrow CLI tool
├── docs/                             # Documentation (handoff, releases, strategy, ai, verification, archive)
├── .github/                          # CI/CD workflows (6 files) + dependabot
├── turbo.json                        # Turborepo pipeline configuration
└── package.json                      # Root workspace (pnpm) with pre-push hook
```

### Scale

| Metric | Count |
|---|---|
| Database models | 63 (Prisma) |
| NestJS modules | 55+ |
| Frontend routes | 82+ |
| Backend test files | 33 |
| Phase 5 tests | 50 (6 spec files, all mocked) |
| AI foundation tests | 82 (8 spec files, all mocked) |
| Total tests | 368+ |
| CI workflows | 6 |
| Strategic AI documents | 28 |
| AI capabilities mapped | 69 across 7 domains |

### Key Architectural Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | **Provider-agnostic AI** | `AIProvider` interface + `ProviderFactory` pattern. Swap OpenAI → Anthropic via `AI_PROVIDER` env var, zero code changes. Enforced by AI Constitution Article 6. |
| 2 | **Stateless HMAC CSRF** | `HMAC-SHA256(userId:nonce:ts, CSRF_SECRET)` — no DB round-trips. Applied globally via `APP_GUARD` covering all 70+ mutation endpoints. |
| 3 | **CSP with nonce** | Per-request cryptographic nonce via Web Crypto API in `middleware.ts`. No `unsafe-inline` in production. |
| 4 | **Stripe rawBody** | `NestFactory.create(AppModule, { rawBody: true })` — required for webhook signature verification. |
| 5 | **PCI SAQ A** | Stripe.js tokenizes card details on frontend; backend never touches card data. Lowest PCI compliance burden. |
| 6 | **Webhook idempotency** | `ProcessedWebhookEvent` table with `UNIQUE(stripeEventId)` — prevents duplicate webhook processing. |
| 7 | **pgvector** | Neon PostgreSQL with pgvector extension for embedding storage — same DB, no separate vector infrastructure. |
| 8 | **Session-based auth** | `playmorrow_session` httpOnly cookie (`SameSite=Lax` dev / `SameSite=None` prod). No JWT in browser. |
| 9 | **Dual event system** | In-memory `EventBus` (RxJS Subject) for runtime coordination + `FeedEngineService` for feed-specific events → `feed_events` table. Historical (should be consolidated). |
| 10 | **SSE over WebSocket** | RxJS Subject → SSE for real-time notifications. Sufficient for current needs; simpler than WebSocket. |

### AI Module Architecture

```
apps/api/src/ai/
├── ai.module.ts                    # @Global() module, registered in AppModule
├── config/ai.config.ts             # Centralized AI config (provider, models, rate limits, cost limits)
├── interfaces/
│   ├── ai-provider.interface.ts    # AIProvider: chat(), embed(), moderate()
│   ├── embedding-provider.interface.ts
│   ├── moderation-provider.interface.ts
│   └── vector-store.interface.ts   # VectorStore: insert(), search(), delete()
├── providers/
│   ├── provider.factory.ts         # Factory: selects provider via AI_PROVIDER env var
│   ├── openai.provider.ts          # OpenAI: chat + embed + moderate
│   └── anthropic.provider.ts       # Anthropic: chat only
├── controllers/ai.controller.ts    # 4 endpoints (POST /ai/chat SSE, /ai/embed, /ai/moderate, GET /ai/providers)
├── services/
│   ├── ai.service.ts               # Orchestrator: routes to provider via factory
│   └── stream.service.ts           # SSE streaming with callbacks + cancellation
├── rag/
│   ├── vector-store.pgvector.ts    # pgvector adapter for Neon PostgreSQL
│   ├── embedding.service.ts        # Embedding generation with caching + chunking
│   └── chunker.ts                  # Paragraph-aware smart text chunking
├── prompts/prompt.registry.ts      # Versioned prompt template system (8 built-in)
├── memory/conversation.memory.ts   # Session memory with summarization + GDPR deletion
└── observability/ai-metrics.service.ts  # Cost estimation, latency, token tracking
```

---

## 4. Infrastructure

### Production Architecture

```
Browser → Vercel (playmorrow.co)
              │ /api/* rewrites
              ▼
         Fly.io (playmorrow-api-aged-mountain-9542.fly.dev)
              │ Prisma
              ▼
         Neon (PostgreSQL + pgvector)
              │ S3 API
              ▼
         Cloudflare R2 (uploads)
```

### Environments

| Environment | Frontend | Backend | Database |
|---|---|---|---|
| Local | `localhost:3000` | `localhost:4000` | Neon dev (shared) |
| Production | Vercel (playmorrow.co) | Fly.io (playmorrow-api-aged-mountain-9542.fly.dev) | Neon prod |

### CI/CD — GitHub Actions (6 workflows)

| Workflow | Trigger | What It Does |
|---|---|---|
| `ci.yml` | Push/PR to main | 3 parallel jobs: quality (lint + typecheck + audit), backend (PostgreSQL 16 container + 200+ tests), e2e (Playwright desktop + mobile). Concurrency group by ref, cancel-in-progress. |
| `security-scan.yml` | Scheduled (daily) + manual | CodeQL analysis for JavaScript/TypeScript |
| `dependency-review.yml` | PR | Reviews dependency changes for known vulnerabilities |
| `smoke-test.yml` | Scheduled (hourly) + manual | `curl` health check on production API endpoints |
| `uptime-check.yml` | Scheduled (5 min) | Availability monitoring for frontend + API |
| `a11y.yml` | Manual | Lighthouse accessibility audit on key pages |

### Monitoring & Observability

| Service | What | Interval |
|---|---|---|
| Sentry | Error tracking (frontend + backend) | Real-time |
| Pino | Structured JSON logging with request IDs, user IDs, latency | Per-request |
| UptimeRobot | Frontend + API health | 5 min |
| CSP reporting | Violation reports → `/api/csp-report` | On violation |
| AuditLog model | Sensitive operation audit trail in DB | On action |

### Backup

- **Neon**: Daily automated backups + point-in-time recovery (PITR)
- **No separate backup infrastructure**: Relies fully on Neon managed backups

### Docker

Multi-stage Dockerfile for the API:
- Build stage: install deps, generate Prisma client, compile NestJS
- Production stage: minimal Node 20 image
- CMD: `node apps/api/dist/main.js`
- Fly.io deployment via `fly.toml`

---

## 5. How to Run

### Quick Start

```bash
# Clone and install
git clone git@github.com:ricardocesidio/playmorrow.git
cd playmorrow
pnpm install

# Copy environment files (creates from .env.example, leaves existing files untouched)
pnpm setup:env

# Edit .env files with required values (see Section 11)
# apps/api/.env: DATABASE_URL, JWT_SECRET, SESSION_SECRET
# apps/web/.env.local: API_URL

# Start both frontend + backend in parallel
pnpm dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000 (Swagger: http://localhost:4000/docs)

### Alternative Start

```bash
pnpm dev:api     # NestJS on :4000
pnpm dev:web     # Next.js on :3000 (Turbopack)

# Database management
pnpm db:push     # Push Prisma schema to DB (dev only)
pnpm db:migrate  # Run Prisma migrations (production path)
pnpm db:studio   # Prisma Studio GUI
pnpm db:seed     # Seed demo data
```

### First Start Notes

- First start takes 20–40s (Turbopack + NestJS + Prisma client generation + Neon connection)
- Subsequent changes are fast (watch modes, `turbo.json` sets `cache: false` on dev tasks)
- Pre-push hook runs `pnpm verify` (lint + typecheck + build) automatically

### Required Environment Variables (Local Dev)

**`apps/api/.env`:**
```bash
DATABASE_URL="postgresql://..."        # Neon connection string (required)
JWT_SECRET="your-secret"               # JWT signing key (required)
SESSION_SECRET="your-secret"           # Session cookie signing (required)
CSRF_SECRET="your-secret"              # HMAC CSRF token signing (required in prod, fallback in dev)
RESEND_API_KEY="re_..."                # Email delivery (required for registration)
WEB_ORIGIN="http://localhost:3000"     # Frontend origin for CORS (required)
```

**`apps/web/.env.local`:**
```bash
NEXT_PUBLIC_API_URL="http://localhost:4000/api"   # API base URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"       # Canonical URL
```

**Optional AI (local dev only, not required to start):**
```bash
AI_PROVIDER=openai                      # or anthropic
OPENAI_API_KEY=sk-...                   # Required if AI_PROVIDER=openai
ANTHROPIC_API_KEY=sk-ant-...            # Required if AI_PROVIDER=anthropic
```

---

## 6. Testing

### Frameworks

| Layer | Framework | Runner | Config |
|---|---|---|---|
| API unit tests (mocked) | Vitest 2.x | `vitest run` | `apps/api/vitest.config.ts` |
| API integration tests | Vitest + Supertest 7.x | `vitest run` | Same as above |
| E2E (frontend) | Playwright | `playwright test` | `apps/web/playwright.config.ts` |

### Test Counts

| Category | Files | Tests | Description |
|---|---|---|---|
| Backend integration (supertest) | 27 | 200+ | Real HTTP requests against NestJS + PostgreSQL |
| Phase 5 unit tests (mocked) | 6 | 50 | Payments(9) + Creator(10) + Events(12) + Partner(9) + Publisher(6) + Marketplace(4) |
| AI module unit tests (mocked) | 8 | 82 | ProviderFactory, AIService, PromptRegistry, EmbeddingService, Chunker, ConversationMemory, AIMetricsService, StreamService |
| E2E (Playwright) | 6 suites | — | Auth, public pages, feed, responsive, social actions, snapshots |
| **Total** | **33** | **368+** | All passing (as of RC3.2) |

### Running Tests

```bash
# All tests (via turbo)
pnpm test

# Backend tests only
pnpm --filter @playmorrow/api test

# Backend tests with local test DB (recommended)
pnpm --filter @playmorrow/api test:db:up      # Start postgres:16 on :5433
pnpm --filter @playmorrow/api test:with-db    # Run against isolated DB
pnpm --filter @playmorrow/api test:db:down    # Stop container

# Backend tests with Neon branch
TEST_DATABASE_URL=postgresql://... pnpm --filter @playmorrow/api test

# E2E tests (requires running dev servers)
pnpm test:e2e

# Coverage report
pnpm --filter @playmorrow/api test:coverage

# Pre-push verification (runs automatically)
pnpm verify
```

### Test Database Setup

**Docker (recommended for local dev):**
```yaml
# docker-compose.yml
services:
  postgres-test:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: playmorrow_test
    ports:
      - "5433:5432"
    tmpfs: /var/lib/postgresql/data   # Ephemeral (data lost on stop)
```

**CI (GitHub Actions):**
- PostgreSQL 16 service container (`postgres:16-alpine`) with health check
- `TEST_DATABASE_URL` + `DATABASE_URL` both point at CI container
- Migrations applied via `pnpm db:deploy` before test step

**Production Safety Guard:**
`vitest.setup.ts` blocks tests against production Neon URLs unless `ALLOW_PROD_DB_FOR_TESTS=1` is explicitly set. Detects Neon patterns and blocks by default.

### Test Patterns

**Unit tests (mocked, no DB):**
```typescript
const mockPrisma = { referralCode: { findUnique: vi.fn(), create: vi.fn() } };
const module = await Test.createTestingModule({
  providers: [CreatorService, { provide: PrismaService, useValue: mockPrisma }],
}).compile();
```

**Integration tests (supertest, real DB):**
```typescript
const SUFFIX = `g-${Date.now()}`;
const result = await createTestApp(Test.createTestingModule({ imports: [...] }));
const user = await registerTestUser(httpServer, prisma, email, password);
// ... test assertions via supertest
afterAll(async () => {
  await prisma.game.deleteMany({ where: { slug: GAME_SLUG } });
});
```

### Test Gaps

| Gap | Impact | Recommendation |
|---|---|---|
| No Phase 5 E2E tests | UI regressions in marketplace/events undetected | Add 2–3 E2E specs for Phase 5 pages |
| No Phase 5 integration tests | HTTP layer (guards, validation, error formatting) untested for Phase 5 | Add 1 integration spec per Phase 5 module |
| No coverage thresholds | Coverage can silently regress | Add `thresholds` to vitest config + CI enforcement |
| 27 integration tests need test DB | New contributors encounter safety guard error | Add `scripts/setup-test-db.sh` automation |

---

## 7. Security Posture

### Authentication Flow

```
Browser → POST /api/auth/form-login → Next.js route handler
  → Forward to NestJS /auth/session/login
    → Verify credentials (argon2)
    → Set playmorrow_session (httpOnly cookie) + playmorrow_csrf (non-httpOnly cookie)
    → Return user data + CSRF token
  → Response with cookies to browser

Subsequent requests:
  GET: Browser sends playmorrow_session cookie → API validates session
  POST/PUT/PATCH/DELETE: Browser sends playmorrow_csrf as X-CSRF-Token header
    → CsrfGuard validates HMAC token → mutation proceeds
```

**OAuth:** Google + GitHub via Passport strategies with state parameter for CSRF protection. Cookies set via shared `cookie-helper.ts` utility (not hardcoded domain).

### Security Layers

| Layer | Implementation | Details |
|---|---|---|
| **Authentication** | Session-based (httpOnly cookie) | `playmorrow_session`, `SameSite=Lax` dev / `SameSite=None` prod, 7-day expiry |
| **Password hashing** | argon2id | Per-password salts, timing-safe comparison |
| **Session management** | Server-side `Session` model | `authVersion` field for mass invalidation, individual revocation |
| **CSRF** | Stateless HMAC-SHA256 | `HMAC-SHA256(userId:nonce:ts, CSRF_SECRET)`, global `APP_GUARD` |
| **CSP** | Nonce-based | Per-request cryptographic nonce via Web Crypto API in `middleware.ts` |
| **XSS** | DOMPurify + sanitize-html | Client-side DOMPurify on all Markdown, server-side sanitizeHtml on game/studio fields |
| **Rate limiting** | @nestjs/throttler | 60 req/min global, per-route overrides (register: 5, login: 10, upload: 20) |
| **File upload** | MIME + magic bytes + dimensions + size | JPEG/PNG/GIF/WebP only, ≤4096px, ≤5MB |
| **Input validation** | class-validator | `whitelist: true`, `forbidNonWhitelisted: true` — strips unknown props |
| **RBAC** | Dual enforcement | `RolesGuard` for global roles (ADMIN/MODERATOR), `assertStudioWriteAccess()` for studio roles |
| **PCI** | SAQ A | Stripe.js tokenizes on frontend; backend never touches card data |
| **Webhooks** | HMAC sig + idempotency | `stripe.webhooks.constructEvent()` + `UNIQUE(stripeEventId)` |
| **Audit** | AuditLog model + Pino | Structured JSON logs with request IDs, user IDs, latency |
| **Account security** | Lockout + authVersion bump | `failedLoginAttempts` counter, `lockedUntil` timestamp, mass session invalidation |

### Security Headers (set by `apps/web/middleware.ts`)

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Nonce-based (script-src 'self' 'nonce-{nonce}') |

### Known Security Gaps

- No 2FA (multi-factor authentication)
- No Redis-backed rate limiting (in-memory resets on restart)
- GDPR export UI pending
- Rate limiting not enforced on all mutation endpoints (only per-route overrides exist)

---

## 8. AI Governance Summary

Phase 6 AI development is governed by a comprehensive, frozen governance framework. **No AI feature may be implemented without passing all 24 gates of the Decision Framework and complying with all 20 constitutional articles.**

### Strategic Documents (28 total)

| Domain | Documents | Key Files |
|---|---|---|
| **Philosophy & Identity** | 3 | `AI_PHILOSOPHY.md`, `AI_PERSONALITY.md`, `AI_NORTH_STAR.md` |
| **Governance** | 4 | `AI_CONSTITUTION.md` (20 articles), `AI_GOVERNANCE.md`, `AI_GUIDING_PRINCIPLES.md` (15 principles), `ADR-001-AI-GOVERNANCE-FREEZE.md` |
| **Product & Decision** | 5 | `AI_PRODUCT_PRINCIPLES.md` (4 goals), `AI_DECISION_FRAMEWORK.md` (24 gates), `AI_FEATURE_EVALUATION_MATRIX.md` (10 dimensions), `AI_SUCCESS_METRICS.md` (25 KPIs), `AI_ROADMAP_ALIGNMENT.md` |
| **Execution** | 4 | `AI_EXECUTION_FRAMEWORK.md`, 3 templates (Sprint Report, KPI, Post-Implementation Review) |
| **Capability Architecture** | 8 | `AI_CAPABILITY_MAP.md` (69 capabilities), `AI_CAPABILITY_HIERARCHY.md`, `AI_BUSINESS_VALUE_MATRIX.md`, `AI_DEPENDENCY_GRAPH.md`, `AI_PRODUCT_TREE.md`, `AI_COMPETITIVE_CAPABILITIES.md`, `AI_ROADMAP_V2.md`, Certification |
| **Infrastructure** | 3 | `AI_ARCHITECTURE.md`, `PROVIDER_ARCHITECTURE.md`, `AI_SECURITY.md` |
| **Certifications** | 3 | AI Foundation, AI Strategy (92/100), AI Governance (94/100), AI Execution (91/100), AI Product Architecture (91/100) |

### North Star

> **"Playmorrow always finds the game I didn't even know I wanted."**

Every AI feature must make users say this sentence. Discovery, not conversation, is the core value proposition.

### 20 Constitutional Articles (Summary)

| # | Article | Engineering Implication |
|---|---|---|
| 1 | Value Over Novelty | Every feature ships with a KPI dashboard |
| 2 | Never Manipulate Users | Dark pattern review before deployment |
| 3 | Always Explain Recommendations | Every recommendation endpoint returns `explanation` field |
| 4 | Respect Studio Ownership | Studio AI features are opt-in; never auto-publish |
| 5 | Protect Privacy By Default | All AI data access goes through PrivacyService |
| 6 | Remain Provider-Agnostic | Use `ProviderFactory`, never `new OpenAI()` |
| 7 | Design for Human Oversight | Every pipeline has `humanOverride` flag |
| 8 | Fail Gracefully | Every AI call wrapped in try/catch with non-AI fallback |
| 9 | Be Domain-Specialized | All prompts versioned in PromptRegistry; generic rejected |
| 10 | Measure Everything | AIMetricsService mandatory; weekly KPI review |
| 11 | Minimize Hallucinations | RAG pipeline mandatory; facts grounded in platform data |
| 12 | Learn From Feedback | All interactions logged; feedback used to improve |
| 13 | Label AI Content | "AI" badge on all AI UI; `generatedBy: 'ai'` metadata |
| 14 | No AI-Generated Reviews | Reviews must come from real players |
| 15 | AI Must Be Kill-Switchable | Feature flags; quarterly kill switch testing |
| 16 | No AI Feature Debt | Features underperforming 8 weeks → fix or remove |
| 17 | Respect Cultural Context | Moderation evaluated across regions and languages |
| 18 | Studios Own Their AI Data | Export + deletion endpoints for AI insights |
| 19 | Accessibility Before AI | All AI UI must pass WCAG 2.2 AA |
| 20 | The Constitution Is Binding | PRs must reference relevant articles |

### 15 Guiding Principles

1. Assist, Never Replace
2. Always Explain Recommendations
3. Respect Player Autonomy
4. Provider-Agnostic
5. Data Minimization by Default
6. Human-in-the-Loop
7. Fail Gracefully
8. Domain-Specialized Expert
9. Measure Everything
10. Minimize Hallucinations
11. Learn From Feedback
12. Label AI Content
13. No AI-Generated Reviews
14. AI Must Be Kill-Switchable
15. Continuous Improvement is Mandatory

### Decision Framework (24-Gate Checklist)

Every AI feature proposal must pass a mandatory 5-section, 24-gate checklist before implementation:

1. **Problem Validation** — Is this a real problem? Who has it? Can it be solved without AI?
2. **Value Assessment** — User value + business value + Priority Score (≥12 to approve)
3. **Risk Assessment** — Privacy, bias, hallucination, security, fairness, cost analysis
4. **Architecture Compatibility** — Provider independence, failover, RAG, kill-switch, monitoring
5. **Final Gate** — Constitution compliance, principle alignment, KPI baseline, rollback plan

### Evaluation Matrix (10 Dimensions)

```
Priority Score = (UserValue × 2) + BusinessValue + Differentiation − Cost − (OperationalCost / 10)

≥12 → Approved
8–11 → Redesign required
<8 → Rejected
```

### Execution Cycle (6-Step Mandatory)

```
Build → Measure → Learn → Improve → Review → Repeat
```

- Features gated at 5% → 25% → 100% rollout
- Continuous improvement loop; no feature is ever "done"
- Underperforming features deprecated at 10 weeks (Constitution Article 16)
- Cost governance: $500/month total AI spend limit

### 69 Capabilities Across 7 Domains

| Domain | Count | Top Capabilities |
|---|---|---|
| Player Intelligence | 16 | Recommendation Engine, Semantic Search, Personalization |
| Studio Intelligence | 12 | Store Page Optimizer, Sentiment Analysis, Devlog Assistant |
| Publisher Intelligence | 8 | Revenue Forecasting, Market Demand Analysis |
| Marketplace Intelligence | 8 | Asset Recommendations, Fraud Detection |
| Community Intelligence | 8 | Toxicity Detection, Spam Detection, Auto-Triage |
| Platform Intelligence | 7 | Help Search, Ticket Routing, Notification Relevance |
| Global/Shared | 10 | Provider Factory, Embedding Service, Prompt Registry |

### Value-Ordered Build Sequence

1. **M23 Recommendation Engine** (first — highest user value, strongest differentiator)
2. **M26 Semantic Search** (second — complements recommendations)
3. **M25 Studio Intelligence** (third — empowers studios)
4. **M22 AI Assistant** (fourth — lower priority than discovery)
5. **M24 AI Moderation** (deferred to >50K DAU — current manual moderation sufficient)

---

## 9. Known Technical Debt

### Critical

| # | Issue | Location | Impact |
|---|---|---|---|
| 1 | StripePayment component never rendered | `apps/web/app/marketplace/[id]/page.tsx` | Card payment flow broken — marketplace purchases can't complete |
| 2 | Register button on event detail has no onClick handler | `apps/web/app/events/[slug]/page.tsx` | Event registration dead — users can't register |
| 3 | Events + Partners POST endpoints missing RBAC guards | `apps/api/src/events/`, `apps/api/src/partner/` | Any authenticated user can create/publish events and partners |

### High

| # | Issue | Impact |
|---|---|---|
| 4 | 137 `any` type warnings (pre-existing, legacy code) | Type safety erosion across codebase |
| 5 | 27 integration test files need test DB to run locally | New contributors can't run full test suite without Docker setup |
| 6 | No Phase 5 integration/E2E tests | HTTP layer for marketplace/events/partners/creator/publisher untested |
| 7 | Marketplace purchase flow has no transactional rollback | Orphaned PaymentIntents possible on failure |
| 8 | `/me/licenses` not inside `/dashboard` layout | Lacks auth redirect gating |
| 9 | No 2FA | Major security gap for studios with financial operations |

### Medium

| # | Issue | Impact |
|---|---|---|
| 10 | Lighthouse Performance 71 (Fly.io free tier cold starts) | Resolvable via $5/mo Fly.io upgrade in Phase 6 |
| 11 | No Vitest coverage thresholds in CI | Coverage can silently regress |
| 12 | Dependabot paused | Dependency updates not automated |
| 13 | In-memory rate limiting (resets on restart) | Rate limits reset on deploy |
| 14 | No Redis cache | No distributed caching; auth tokens checked against DB on every request |
| 15 | Dual event system (EventBus + FeedEngine) | Architectural debt — should be consolidated |

### Low

| # | Issue |
|---|---|
| 16 | Stripe Connect onboarding uses `alert()` instead of toast/ErrorState |
| 17 | No pagination UI on marketplace/events/partners pages (API supports it) |
| 18 | No DTOs for update operations in Phase 5 (UpdateListingDto, UpdateEventDto, etc.) |
| 19 | `applyReferral` is read-only — validates code but doesn't persist relationship |
| 20 | No seed scripts for test fixtures (tests create their own data in `beforeAll`) |
| 21 | GDPR export UI not implemented |

---

## 10. Open Decisions

| # | Decision | Stakeholders | Context |
|---|---|---|---|
| 1 | **M22 vs M23 build order** | CTO, Product | Strategic documents recommend M23 (Recommendation Engine) first, then M26 (Semantic Search), then M22 (Assistant). The original roadmap listed M22 first. Resolution needed before next sprint. |
| 2 | **M18 Funding implementation** | Legal, Product, CTO | Reward-based crowdfunding model defined (Kickstarter style). Schema not designed. Needs legal counsel before implementation. |
| 3 | **Fly.io paid tier upgrade timing** | CTO, Ops | $5/mo upgrade eliminates cold starts (Performance 71 → ~85+). Budget trivial. |
| 4 | **Screen reader testing** | QA, Accessibility | NVDA/VoiceOver testing not yet performed. WCAG 2.2 AA certification based on automated Lighthouse + manual keyboard navigation. |
| 5 | **Staging environment** | Ops | No staging env exists. Production deployment is single-path. |
| 6 | **Test database strategy** | Engineering | Integration tests share Neon dev DB. Dedicated test DB recommended (Neon free branch or CI-only). |
| 7 | **Redis adoption** | Engineering | Rate limiting + session cache would benefit from Redis. Not currently in architecture. |

---

## 11. Required Environment Variables

### Fly.io (Backend — `fly secrets set`)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | **Yes** | Neon PostgreSQL connection string with pooler |
| `JWT_SECRET` | **Yes** | JWT signing key |
| `SESSION_SECRET` | **Yes** | Session cookie signing key |
| `CSRF_SECRET` | **Yes** | HMAC CSRF token signing (server fails fast if missing in prod) |
| `RESEND_API_KEY` | **Yes** | Email delivery (required for registration, verification, password reset) |
| `WEB_ORIGIN` | **Yes** | Frontend origin for CORS (`https://playmorrow.co`) |
| `NODE_ENV` | **Yes** | Set to `production` |
| `COOKIE_DOMAIN` | Recommended | `.playmorrow.co` for cross-subdomain cookies |
| `SENTRY_DSN` | Recommended | Sentry error tracking DSN |
| `VAPID_PUBLIC_KEY` | Optional | Web push notification VAPID public key |
| `VAPID_PRIVATE_KEY` | Optional | Web push notification VAPID private key |
| `VAPID_SUBJECT` | Optional | `mailto:` contact for push notifications |
| `STRIPE_SECRET_KEY` | Yes (Phase 5) | Stripe API secret key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Yes (Phase 5) | Stripe webhook endpoint signing secret (`whsec_...`) |
| `R2_ACCESS_KEY_ID` | Optional | Cloudflare R2 upload storage |
| `R2_SECRET_ACCESS_KEY` | Optional | Cloudflare R2 upload storage |
| `R2_ENDPOINT` | Optional | Cloudflare R2 endpoint URL |
| `R2_BUCKET_NAME` | Optional | Cloudflare R2 bucket name |
| `REDACTED_STORAGE_PROVIDER` | Optional | `local` or `r2` (default: `local`) |

### Vercel (Frontend — Vercel dashboard)

| Variable | Required | Purpose |
|---|---|---|
| `API_URL` | **Yes** | Backend API base URL (`https://playmorrow-api-aged-mountain-9542.fly.dev/api`) |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URL for OG/sitemap (`https://playmorrow.co`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Optional | Push notification subscription (public key only) |

### Optional AI (both Fly.io and Vercel — not required for operation)

| Variable | Where | Purpose |
|---|---|---|
| `AI_PROVIDER` | Fly.io | `openai` or `anthropic` — selects active AI provider |
| `OPENAI_API_KEY` | Fly.io | OpenAI API key (required if `AI_PROVIDER=openai`) |
| `ANTHROPIC_API_KEY` | Fly.io | Anthropic API key (required if `AI_PROVIDER=anthropic`) |

### Local Dev Only

See Section 5 for local `.env` file setup. Local dev uses `.env` files in `apps/api/` and `apps/web/`. The `CSRF_SECRET` has a hardcoded fallback in dev only — production uses `ConfigService.getOrThrow('CSRF_SECRET')`.

---

## 12. Critical Project Rules

### AI Governance (Non-Negotiable)

1. **No AI feature without passing the 24-gate Decision Framework.** All 24 checklist items require written answers. "Yes/No" without evidence is treated as failure.
2. **Provider-agnostic only.** Never call OpenAI, Anthropic, or any provider directly. Always use `ProviderFactory`. This is enforced by AI Constitution Article 6.
3. **Every AI feature must be kill-switchable.** Feature flags required. Kill switches tested quarterly. Constitution Article 15.
4. **Studios own their AI data.** Export and deletion endpoints must exist. Never publish as a studio without human approval. Constitution Article 18.
5. **No AI feature without measurable KPIs.** Pre-launch baseline required. Weekly KPI review. Constitution Article 10.
6. **ADR required for strategy document changes.** All AI strategy documents (North Star, Constitution, Principles, Decision Framework) are frozen. Modifications require an Architecture Decision Record with CEO + CTO approval.

### Code Quality

7. **Pre-push hook enforces `pnpm verify`** (lint + typecheck + build). Will block push on failure.
8. **No `console.log` in production code.** Use Pino logger on backend, toasts on frontend.
9. **CI blocks merge on test failure.** All 33 backend test files + 6 E2E suites must pass.
10. **No Prisma `db push` in production.** All schema changes via migrations (`db:migrate`).

### Security

11. **CSRF global guard must never be bypassed** except on explicitly allowed endpoints. Any new mutation route `POST/PUT/PATCH/DELETE` automatically receives CSRF protection.
12. **No `dangerouslySetInnerHTML` without DOMPurify sanitization.** Verified by professionalization audit.
13. **Production env vars set via Fly.io secrets + Vercel dashboard** — never committed to repo.
14. **PCI SAQ A compliance:** Card details never touch the backend. Stripe.js frontend integration only.

### Documentation

15. **STATUS.md is the single source of truth** for feature status. AGENTS.md is development history only.
16. **ARCHITECTURE.md must reflect current state** — update when adding new modules or architectural decisions.

---

## 13. Immediate Next Sprint

### Decision Required: M22 or M23 First?

The strategic documents (`AI_ROADMAP_V2.md`, `AI_BUSINESS_VALUE_MATRIX.md`) recommend **M23 (Recommendation Engine) first**, followed by M26 (Semantic Search), then M25 (Studio Intelligence), then M22 (AI Assistant). Rationale:

- M23 has the highest business value score (48/70 on the 7-dimension matrix)
- Discovery is the North Star — recommendation engine directly delivers "finds the game I didn't know I wanted"
- M22 (AI Assistant) is user-facing but lower-priority than silent discovery improvements
- M23 + M26 create a compounding data advantage

**If decision is M23 first:**

### Steps to Begin

1. **Phase 0: Environment Setup (1 day)**
   ```bash
   # Set AI_PROVIDER + API keys on Fly.io
   fly secrets set AI_PROVIDER=openai OPENAI_API_KEY=sk-...
   
   # Enable pgvector extension on Neon (if not already enabled)
   # Run via Neon SQL editor: CREATE EXTENSION IF NOT EXISTS vector;
   
   # Apply pgvector migration (create embeddings column on games, studios)
   pnpm --filter @playmorrow/database db:migrate
   ```

2. **Phase 1: Embedding Pipeline (Week 1)**
   - Use existing `EmbeddingService` + `PgVectorStore` to generate embeddings for all games
   - Create embedding refresh endpoint (triggered on `GAME_UPDATED` event)
   - Build embedding freshness dashboard in `AIMetricsService`

3. **Phase 2: Baseline Metrics (Week 1–2)**
   - Measure current recommendation KPIs (CTR, engagement, conversion) from existing 9 scorers
   - Create A/B test infrastructure for M23 vs existing scorers
   - Set up `AIMetricsService` dashboards for M23 KPIs

4. **Phase 3: Collaborative Filtering Engine (Week 2–4)**
   - Implement user-game interaction matrix from follows, wishlists, reactions, purchases
   - Implement content-based similarity from game embeddings
   - Build hybrid scoring: collaborative (60%) + content (30%) + trending (10%)

5. **Phase 4: Explainability (Week 4–5)**
   - Implement "because you..." explanation generation using PromptRegistry
   - Every recommendation response includes `explanation` field

6. **Phase 5: Rollout (Week 6–8)**
   - 5% rollout → measure against baseline (Week 6)
   - 25% rollout → stabilize (Week 7)
   - 100% rollout → full migration (Week 8)

### First AI Feature Scope Recommendation

**Start with:** Store page embeddings + content-based similarity recommendations.

This is the smallest complete loop that exercises the entire AI pipeline (embedding → vector store → similarity → recommendation → explanation → measurement) without the complexity of collaborative filtering. It provides immediate user value and validates the infrastructure end-to-end.

```typescript
// Proposed API endpoint for first AI feature:
GET /api/recommendations/ai?gameId=xxx
→ Response: {
    recommendations: [{
      game: { id, title, slug, coverUrl },
      score: 0.94,
      explanation: "Similar gameplay mechanics to [current game]"
    }],
    generatedBy: "ai",
    provider: "openai"
  }
```

### Quality Gates for M23

- [ ] 24-gate Decision Framework completed and approved
- [ ] Constitutional compliance verified (Articles 1, 3, 6, 8, 9, 10, 11, 12, 15)
- [ ] Baseline KPIs measured and recorded
- [ ] 5% rollout metrics exceeding baseline
- [ ] Kill switch tested (AI_SEMANTIC_SEARCH_ENABLED=false → instant fallback to keyword search)
- [ ] All new code has tests (unit + integration following existing patterns)
- [ ] ARCHITECTURE.md + STATUS.md updated

---

## Appendix A: Key Contacts & Resources

| Resource | Details |
|---|---|
| Repo | github.com/ricardocesidio/playmorrow |
| Domain | playmorrow.co |
| Email | playmorrow@hotmail.com |
| Frontend (prod) | Vercel (playmorrow.co) |
| API (prod) | Fly.io (playmorrow-api-aged-mountain-9542.fly.dev) |
| Database (prod) | Neon PostgreSQL |
| CI/CD | GitHub Actions (`.github/workflows/`) |
| Error tracking | Sentry (`SENTRY_DSN` on Fly.io) |
| Uptime | UptimeRobot (frontend + API, 5min) |
| Email service | Resend |
| Uploads | Cloudflare R2 (prod) / Local disk (dev) |
| Payments | Stripe Connect Express |

## Appendix B: Document Map

| Document | Location | Purpose |
|---|---|---|
| **This handoff** | `docs/handoff/HANDOFF.md` | Complete project overview for incoming team |
| **Development history** | `AGENTS.md` | Chronological log of all 23 development sessions |
| **Current status** | `STATUS.md` | Verified feature status, known issues, env vars, models |
| **Architecture** | `ARCHITECTURE.md` | Mermaid diagrams, module list, auth flow, deployment |
| **Security policy** | `SECURITY.md` | 10 protection domains, headers, PCI SAQ A, reporting |
| **Changelog** | `CHANGELOG.md` | Release notes for all versions |
| **Roadmap** | `docs/releases/ROADMAP_STATUS.md` | Phase 5 milestone status + Phase 6 plan |
| **AI North Star** | `docs/strategy/AI_NORTH_STAR.md` | Single-page strategic AI identity |
| **AI Constitution** | `docs/strategy/AI_CONSTITUTION.md` | 20 immutable articles governing all AI |
| **AI Guiding Principles** | `docs/strategy/AI_GUIDING_PRINCIPLES.md` | 15 actionable principles with compliance tests |
| **AI Decision Framework** | `docs/strategy/AI_DECISION_FRAMEWORK.md` | 24-gate mandatory checklist for AI features |
| **AI Capability Map** | `docs/strategy/AI_CAPABILITY_MAP.md` | 69 capabilities across 7 domains |
| **AI Architecture** | `docs/strategy/AI_ARCHITECTURE.md` | Technical design for M22-M26 |
| **Phase 6 Roadmap** | `docs/strategy/PHASE6_ROADMAP.md` | 5-milestone AI roadmap with cost estimates |
| **v1.0.0 Release** | `docs/releases/V1_PLATINUM_RELEASE.md` | Platinum freeze release notes |
| **RC3.2 Certification** | `docs/releases/RC3_2_CERTIFICATION.md` | Final quality certification report |
| **Engineering Scorecard** | `docs/releases/FINAL_ENGINEERING_SCORECARD.md` | Full scoring breakdown |
| **Test Infrastructure** | `docs/releases/TEST_INFRASTRUCTURE_REPORT.md` | How testing works, CI pipeline, local setup |
| **Lighthouse Report** | `docs/releases/LIGHTHOUSE_REPORT.md` | Production performance audit |
| **Contrast Audit** | `docs/releases/CONTRAST_AUDIT.md` | 6 failing color combinations + fix recommendations |
| **Accessibility Report** | `docs/releases/ACCESSIBILITY_REPORT.md` | WCAG 2.2 AA remediation (55 fixes) |
| **QA Report** | `docs/releases/QA_REPORT.md` | All QA gates and results |

---

*Prepared for investor-level technical due diligence. This document supersedes all previous handoff documents.*
