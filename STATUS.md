# Playmorrow — Project Status

> **Last verified:** 2026-08-09
> **Version:** v0.85-beta
> **Repository:** [github.com/ricardocesidio/playmorrow](https://github.com/ricardocesidio/playmorrow)
> **Tests:** 505 total (50 files). **Typecheck:** 7/7. **Lint:** 0 errors. **Build:** 6/6.
> **Live:** https://playmorrow.co
> **Production DB isolation:** 🟢 CERTIFIED (separate prod/dev Neon branches)
> **Production hardening (P0.1.1):** 🟡 CONDITIONALLY CERTIFIED — credentials rotated; real backup verified in R2; `gh` secret registration is the final user action. See `docs/releases/P0_1_FINAL_CERTIFICATION.md`.
> **Phase 6 AI:** M23 (Recommendation Engine) 🟢 CERTIFIED for governed 5% rollout — see `docs/releases/M23_CERTIFICATION.md`. M22/M24/M25/M26 not started. 🟢 **Catalog publishing path available** (2026-08-10): `POST /api/games/:slug/publish` lets studios publish games; public catalog/search filter `isPublished: true`.

---

## Honest Status (2026-08-06)

Playmorrow is v0.85-beta. All critical bugs from the independent audit are resolved.

What works:
- Backend: 55 modules, ~165 API endpoints
- Frontend: 82+ routes, all pages functional
- Marketplace: Stripe Connect Express integrated (test mode)
- AI Module: 47 files, M23 shipped (hybrid recs: pgvector semantic + legacy floor)
- 2FA: TOTP implemented and deployed
- GDPR: Export endpoint + UI deployed
- Redis: wired into the rate limiter (atomic Lua INCR, fail-open fallback)
- 65 Phase 5 tests (unit + integration), 0 failures
- Vitest coverage thresholds (40% lines)

What needs work:
- No Phase 5 E2E tests (Playwright)
- No staging environment deployed
- SSE/RxJS single-instance (needs Redis pub/sub for scaling)
- 149 legacy `any` warnings outside Phase 5 (Phase 5 now enforces `any`-free via ESLint error)

Current state: v0.85-beta — functional, not production-hardened.

---

## Milestone Summary (21 Milestones)

| Milestone | Focus | Status | Tests | Description |
|-----------|-------|--------|-------|-------------|
| **M1** | Support Center | Complete | Integration | Support tickets, replies, admin queue, notifications |
| **M2** | Help Center | Complete | Integration | Documentation platform with CMS, categories, search, article feedback |
| **M3** | Studio Analytics | Complete | Integration | Real event tracking, daily aggregates, game & studio analytics dashboards |
| **M4** | Verification & Trust | Complete | Integration | Tiered verification (6 levels), trust scoring, brand kits, press kits |
| **M5** | Discovery Platform | Complete | Integration | Recommendations (9 scorers), Search 2.0, Dynamic Collections (5), Discover page, SEO landing pages |
| **M6** | Performance & SEO | Complete | Integration | TanStack Query caching, 30s auto-refresh, OG images, canonical URLs, JSON-LD, dynamic sitemap |
| **M7** | QA & CI/CD | Complete | Integration | 318 tests (27 files), GitHub Actions CI, pre-push hooks, lint + typecheck + build gating |
| **M8** | Moderation Center | Complete | Integration | Reports, suspension, shadow ban, appeals, strikes, DMCA workflow, admin dashboard |
| **M9** | Email Automation | Complete | Integration | Templates CRUD, transactional emails, weekly digest, bounce handling, delivery analytics |
| **M10** | Security Hardening | Complete | Integration | Stateless HMAC CSRF (global), CSP nonce, DOMPurify, sanitize-html, argon2id, rate limiting, audit log |
| **M11** | Public API | Complete | Integration | API keys with scoped access, programmatic access endpoints |
| **M12** | SDK & CLI | Complete | Integration | `@playmorrow/sdk` (JS client), `playmorrow` CLI (search, games, trending) |
| **M13** | Production Hardening | Complete | Integration | Dashboard restructure, OAuth cookie domain fix, CSP fixes, branch protection, Dependabot |
| **M14** | Professionalization | Complete | Integration | Full project audit, enterprise readiness, repo files (CONTRIBUTING, SECURITY, CODE_OF_CONDUCT) |
| **M15** | Final Polish & UI | Complete | Integration | Devlog blog redesign, push notifications, email verification, avatar upload, SSE notifications |
| **M16** | Marketplace | Complete | Unit + integration | Stripe Connect Express, PaymentIntent, listings, purchases, licenses (5 DB models) |
| **M17** | Publisher | Complete | Unit | Per-studio revenue dashboard with earnings and payout history |
| **M18** | Funding | Scope Defined | Not started | Reward-based crowdfunding (Kickstarter model); equity/investment blocked — implementation deferred |
| **M19** | Creator | Complete | Unit | Referral codes + commission tracking via affiliate system |
| **M20** | Partner | Complete | Unit + integration | B2B CRM with 6 partner types (University, Publisher, Accelerator, Incubator, Studio, Event Organizer) |
| **M21** | Events | Complete | Unit + integration | Event listings, detail pages, publish workflow, ticketing, upcoming filter |
| **M22** | AI Assistant | Foundation only | Unit | Provider-agnostic AI module (35 files, 82 tests); feature endpoints gated off |
| **M23** | Recommendation Engine | Complete | Unit + live | Hybrid For You feed (semantic + legacy floor), pgvector embeddings, feedback events, semantic search — certified for 5% rollout |

---

## Feature Inventory

### Authentication & Security

| Feature | Status | Details |
|---------|--------|---------|
| Session-based auth (httpOnly cookies) | Complete | `playmorrow_session` cookie, SameSite=Lax (dev) / None (prod) |
| Email/password login | Complete | Form action → Next.js route handler → NestJS API |
| OAuth (Google + GitHub) | Complete | Passport strategies with state parameter, session creation |
| Email verification | Complete | 6-digit SHA-256 hashed codes via Resend |
| Password recovery | Complete | 15-min token expiry, email-based reset flow |
| Password hashing | Complete | argon2id with timing-safe comparison |
| CSRF protection | Complete | Stateless HMAC-SHA256, global APP_GUARD, X-CSRF-Token header |
| CSP (nonce-based) | Complete | Next.js middleware with security headers |
| XSS sanitization | Complete | DOMPurify on all Markdown + sanitize-html on content fields |
| Input validation | Complete | class-validator whitelist + forbidNonWhitelisted |
| Upload validation | Complete | MIME whitelist + magic bytes + 4096px max + 5MB limit |
| Rate limiting | Complete | ThrottlerModule: 60/min global + per-route overrides; Redis-backed (atomic Lua) with fail-open fallback |

### Player Features

| Feature | Status | Details |
|---------|--------|---------|
| Game discovery & browsing | Complete | Search, tags, genres, status filters, pagination |
| Follow studios & games | Complete | Personal feed population |
| Personalized feed | Complete | Auto-refresh every 30s, type filters (All/Devlogs/Roadmap) |
| Devlog blog detail | Complete | Two-column blog layout, hero image, neon borders, lightbox |
| Devlog reactions | Complete | LIKE (blue), LOVE (red), HYPE (green), INSIGHTFUL (yellow) |
| Wishlist | Complete | Private game wishlist management |
| Threaded comments | Complete | 3-level recursive Prisma include, create/edit/delete/reply |
| XP & level system | Complete | Player XP tracking with achievements + leaderboard |
| Push notifications | Complete | Browser push via VAPID keys, service worker |
| Real-time notifications | Complete | SSE-based, auto-refresh, mark-all-read, responsive |
| Welcome notification bot | Complete | Auto-generated welcome on first login |

### Studio Features

| Feature | Status | Details |
|---------|--------|---------|
| Studio CRUD | Complete | Full lifecycle with RBAC |
| Game CRUD | Complete | Full lifecycle with media, tags, platforms, pricing |
| Team management | Complete | Owner/Admin/Moderator/Member roles with invitations |
| Seat limits | Complete | 2 OWNER / 3 ADMIN / 10 MODERATOR, 409 on over-limit |
| Devlogs editor | Complete | Markdown with screenshot upload, scheduling, categories, tags |
| Roadmap | Complete | Visual timeline with planned/in-progress/completed/cancelled |
| Press kits | Complete | Auto-generated markdown downloads, fact sheets |
| Brand kits | Complete | Brand guidelines, logos, asset management |
| Verification | Complete | 6 tiers: Unverified → Email → Basic → Official → Partner → Featured |
| Trust scoring | Complete | Based on verification, brand kit, profile, press kit, email |
| Studio goals & achievements | Complete | Publishing, content, planning, media, growth milestones |

### Marketplace & Ecosystem (Phase 5)

| Feature | Status | Details |
|---------|--------|---------|
| Marketplace listings | Complete | Game assets for sale with Stripe Connect payout routing |
| Purchases & licenses | Complete | PaymentIntent with platform commission, PurchasedLicense records |
| Revenue dashboard | Complete | Per-studio earnings, transactions, payout history |
| Funding (scope only) | Deferred | Reward-based crowdfunding model defined; implementation pending legal review |
| Referral codes | Complete | Affiliate codes with commission tracking (REFERRAL_COMMISSION) |
| Partner CRM | Complete | B2B directory with 6 partner types |
| Events | Complete | Listings, detail, publish workflow, ticketing, upcoming filter |

### AI & Platform Intelligence (Phase 6)

| Feature | Status | Details |
|---------|--------|---------|
| For You feed (hybrid recs) | Complete | Semantic (pgvector, taste signals, MMR) over legacy floor; 5% governed rollout; kill switch |
| Semantic search | Complete | KNN vector search (game titles), 5-candidate cap, fallback chain; wired into search page + game detail |
| Recommendation feedback | Complete | CLICKED / DISMISSED / WISHLISTED events, dismissal window, validated gameId |
| Embedding refresh | Complete | Nightly 03:00 UTC cron for published games + orphan cleanup |
| Assistant chat (per-request) | Gated (M22 flags) | Chat on game detail page; preferences stored to `UserPreferences`; feature flags default off |
| Admin AI debug | Complete | `/dashboard/admin/ai` — embeddings count, provider status |

---

## Known Issues

### Resolved (Previously Critical/High)
| # | Issue | Resolution |
|---|-------|-----------|
| ✅ | StripePayment not rendered | Renders at marketplace/[id]/page.tsx:102 |
| ✅ | Register button dead | onClick calls POST /events/:slug/register |
| ✅ | Missing RBAC on events/partners | @Roles('ADMIN','MODERATOR') on both controllers |
| ✅ | Marketplace no rollback | cancelPaymentIntent() compensating action |
| ✅ | /me/licenses auth gap | Redirect to /login; page in /dashboard layout |
| ✅ | Stripe alert() | Replaced with ErrorState |
| ✅ | No 2FA | TOTP implemented (native crypto, zero deps) |
| ✅ | No GDPR export | GET /me/export + /dashboard/gdpr page |
| ✅ | SEO on Phase 5 pages | layout.tsx files added (marketplace, events, me/licenses) |
| ✅ | No pagination UI | Load More button on marketplace |
| ✅ | Missing client.ts types | Event, Partner, ReferralCodeInfo added |
| ✅ | No Update DTOs | UpdateListingDto, UpdateEventDto, UpdatePartnerDto created |
| ✅ | applyReferral read-only | Now creates ReferralUsage record |
| ✅ | 9 any types in Phase 5 | Fixed |
| ✅ | 6 missing TypeScript interfaces | Fixed |
| ✅ | No game association in listing form | Fixed |
| ✅ | Redis throttler wired (was config-only) | Atomic Lua INCR/PEXPIRE/PTTL storage, fail-open on Redis error, in-memory fallback |
| ✅ | Upload limit too lax (20MB) | 5MB cap via MaxFileSizeValidator (matches express.json 5mb) |
| ✅ | Purchase failure cancelled PaymentIntent | Transaction PENDING→FAILED; intent never cancelled (races confirmation webhook) |
| ✅ | No PATCH routes / PartialType DTOs | PATCH /marketplace/:id, /events/:slug, /partners/:slug with explicit @IsOptional() DTOs |
| ✅ | Phase 5 missing enum types (prod 500) | EventStatus/PartnerStatus/PartnerType/MarketplaceListingStatus added via migration (TEXT columns drifted) |
| ✅ | `any` in Phase 5 | 0 remaining; ESLint error override on Phase 5 modules |
| ✅ | AI module spec rot (25 tests failing) | All 25 AI/recommendations specs rebased on current ProviderFactory/EmbeddingProvider API; suite now 478/478 |
| ✅ | 122 `any` warnings across 44 modules | 0 remaining (full repo); type-only cleanup, no behavior change |
| ✅ | Dead code (knip) | Removed 8 dead AI barrel/prompt files + stray postcss.config.js; removed unused deps (@anthropic-ai/sdk, @sentry/core, @nestjs/mapped-types, @types/dompurify); added missing devDeps (@vitest/coverage-v8, tsx, tsconfig-paths); deleted unused assertPermission, SearchRequestDto, StudioResponse, AI_PROVIDER |
| ✅ | prisma/seed.ts drift | emailVerified → emailVerifiedAt + missing displayName (blocked `pnpm verify`) |
| ✅ | SSE/RxJS single-instance | Redis pub/sub bridge (`RedisPubSubService` + `NotificationPubSubService`); multi-instance relay via `playmorrow:notifications` channel, per-instance UUID dedupe, fail-open when `REDIS_URL` absent |
| ✅ | No delete/edit for marketplace listings | `DELETE /marketplace/:id` soft-archives (OWNER/ADMIN RBAC); edit page `/dashboard/marketplace/[id]`; dashboard shows all statuses + Archive/Edit |
| ✅ | fileUrl shown for non-owners | Verified already resolved — backend strips `fileUrl` in `getListing`; UI block was dead code |
| ✅ | No Phase 5 E2E tests | 9 mock-based Playwright specs (marketplace browse/filter/edit/archive, events, partners, revenue, creator) — 18/18 green (desktop + mobile) |
| ✅ | Dev DB migration history drifted | Dev DB reset + reconciliation migration `20260806010000_reconcile_schema_to_prisma`; 39/39 migrations applied, zero drift vs `schema.prisma`, seeded, API 200. Migration also fixes fresh/prod deploys (was missing `ReferralUsage` table + `VerificationRequestStatus` enum; had orphan `devlogs.coverUrl`, wrong FK/onDelete + index parity) |
| ✅ | Integration tests share Neon dev DB | Dedicated local test DB provisioned (Colima + Docker + `docker-compose.yml` `postgres-test` on :5433). Schema replayed via all 39 migrations, full suite green: 48 files / 490 tests against `TEST_DATABASE_URL` |
| ✅ | Reconcile migration to prod | Already live — prod and dev share the same Neon DB (`neondb` on `ep-orange-bird-abpuzipk-pooler`). Verified against prod `DATABASE_URL`: 39/39 migrations applied, zero drift vs `schema.prisma`. Smoke: `/api/health`, `/api/games`, `/api/marketplace`, `/api/events` 200; `/api/creator/*` 401 (guard works, no 500) |
| ✅ | **P0: prod/dev DB isolation** | Neon project `green-leaf-42103134` (Playmorrow) now has TWO branches: `production` (br-patient-bonus-abbxfc07) and `dev` (br-sparkling-sea-abobomp9, endpoint ep-raspy-sunset-abo6apgc). Dev `DATABASE_URL` (apps/api/.env) rewired to the dev branch. Verified: dev reset + 39 migrations + seed OK; prod untouched (39/39, zero drift, smoke 200/401); guard blocks prod destructive ops and allows dev/test. Full details: `docs/releases/PRODUCTION_DB_ISOLATION_CERTIFICATION.md` |
| ✅ | **P0.1: production hardening & recovery readiness** | Fail-closed DB guard (destructive ops vs unknown hosts blocked unless override); dead `admin:ensure` bypass removed; stale `vitest.setup.ts` prod-host regex fixed (blocks suite on both Neon hosts); `smoke-test.yml` robust to empty-but-healthy prod (`total=0` passes); nightly backup workflow (→R2) + read-only backup role + full restore drill. See `docs/releases/P0_1_PRODUCTION_HARDENING_CERTIFICATION.md` |

### Remaining
| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 5 | No staging environment deployed | Medium | Skipped by decision (dedicated test DB chosen over staging) |
| 6 | ~~Nightly `pg_dump` backup not yet implemented~~ | ~~High~~ | **RESOLVED 2026-08-07** — `.github/workflows/backup-db.yml` (02:00 UTC cron) dumps prod via read-only role `playmorrow_backup` (postgres:18, `--exclude-schema=neon_auth`) → R2 `db-backups/` (14-day retention, SHA-256 + MANIFEST). ✅ **Real production backup VERIFIED in R2** this session: `db-backups/20260807T132952Z.dump` (197,092 bytes) + checksum + manifest created with the workflow's own flags, downloaded back (checksum matched), and **restored to disposable Postgres 18 → 65/65 tables, row counts match live prod**. Remaining: register 5 GitHub secrets (`gh` not installed here) to activate nightly cron. See `docs/releases/P0_1_FINAL_CERTIFICATION.md` |
| 7 | ~~Exposed Neon credentials still live~~ | ~~High~~ | **RESOLVED 2026-08-07 (P0.1.1)** — DB password rotated via Neon API (old `npg_…` confirmed dead via failed auth; new password live in Fly `DATABASE_URL`, prod smoke 200). Exposed org `NEON_API_KEY` revoked (`playmorrow-key`, id 3244621), replaced by `playmorrow-key-v2` (gitignored `.env.neon-apikey`). New prod URL in gitignored `.env.prod-dburl`. Full evidence: `docs/releases/P0_1_FINAL_CERTIFICATION.md` |

| 8 | ~~**No game publishing workflow** — no product path sets `Game.isPublished=true`~~ | ~~High (product)~~ | **RESOLVED 2026-08-10** — Game Publishing Path shipped: `POST /api/games/:slug/publish` (SessionAuthGuard, OWNER/ADMIN/MODERATOR, completeness gate, idempotent, transactional, audit `GAME_PUBLISHED`, `game_published` EventBus + `GAME_PUBLISHED` feed on real transition). Public catalog (`GET /api/games`) + search games branch now filter `isPublished: true`; RELEASED no longer auto-stamps publication metadata. Frontend Publication card + `usePublishGame()` on the editor. e2e: 34 tests in `games.controller.spec.ts`. No M23 frozen component touched (freeze log entry). See `docs/releases/M23_CATALOG_READINESS_CERTIFICATION.md` |


> **Migration ops note:** `prisma migrate deploy`/`resolve` time out with P1002 against the Neon endpoint (both pooled `-pooler` and direct hosts block session advisory locks). Dev migration workflow = run the SQL via `prisma db execute` (single transaction), then record in `_prisma_migrations` with the correct SHA-256 checksum (or use a Neon branch that exposes a real direct endpoint). `prisma migrate status` and `prisma migrate diff` work fine.
>
> **Prod/dev isolation (RESOLVED):** prod (`ep-orange-bird-abpuzipk…`) and dev (`ep-raspy-sunset-abo6apgc…`) now use **separate Neon branches**. The 2026-08-06 incident cleared the production dataset; the pre-incident data is **not recoverable** (Neon PITR = 6h, zero snapshots). A DB safety guard (`packages/database/scripts/db-guard.mjs`) blocks `reset`/`push`/`seed`/`migrate dev` against the prod host unless `ALLOW_PROD_DB_OPERATIONS=1`. See `docs/infrastructure/PRODUCTION_DATABASE_SAFETY.md`.

---

## Production Deployment

### URLs

| Environment | URL | Status |
|-------------|-----|--------|
| Frontend | https://playmorrow.co (Vercel) | 200 |
| API | https://playmorrow-api-aged-mountain-9542.fly.dev (Fly.io) | 200 |
| Health | https://playmorrow-api-aged-mountain-9542.fly.dev/api/health | 200 |
| Database | Neon PostgreSQL — **separate branches: prod (`ep-orange-bird-abpuzipk…`) / dev (`ep-raspy-sunset-abo6apgc…`)** | Active |

### Monitoring

| Service | What | Interval |
|---------|------|----------|
| UptimeRobot | Frontend + API health | 5 min |
| Sentry | Error tracking (frontend + backend) | Real-time |
| GitHub Actions | CI (lint, typecheck, 318 tests, build) | On push |

---

## Environment Variables

### Fly.io (Backend)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT signing key |
| `SESSION_SECRET` | Yes | Session cookie signing |
| `CSRF_SECRET` | Yes | HMAC CSRF token signing (getOrThrow in production) |
| `RESEND_API_KEY` | Yes | Email delivery (required for registration) |
| `WEB_ORIGIN` | Yes | Frontend origin for CORS (https://playmorrow.co) |
| `NODE_ENV` | Yes | Set to `production` |
| `COOKIE_DOMAIN` | Recommended | `.playmorrow.co` for cross-subdomain cookies |
| `SENTRY_DSN` | Recommended | Error tracking DSN |
| `VAPID_PUBLIC_KEY` | Optional | Web push notifications |
| `VAPID_PRIVATE_KEY` | Optional | Web push notifications |
| `VAPID_SUBJECT` | Optional | mailto: contact for push notifications |
| `STRIPE_SECRET_KEY` | Yes (Phase 5) | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Yes (Phase 5) | Stripe webhook signature verification |
| `R2_ACCESS_KEY_ID` | Optional | Cloudflare R2 uploads |
| `R2_SECRET_ACCESS_KEY` | Optional | Cloudflare R2 uploads |

### Vercel (Frontend)

| Variable | Required | Purpose |
|----------|----------|---------|
| `API_URL` | Yes | Backend API base URL (Fly.io) |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URL (https://playmorrow.co) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Optional | Push notification subscription |

---

## Database

**63 models** across the Prisma schema with 18 enums, 58 indexes, 8 unique constraints, 43 cascade deletes.

| Model | Key Fields |
|-------|-----------|
| User | id, email, username, role, xp, level, isVerified |
| Studio | id, name, slug, verificationStatus, trustScore |
| StudioMember | id, studioId, userId, role, joinedAt |
| Game | id, title, slug, coverUrl, trailerUrl, status, priceCents |
| Devlog | id, title, slug, body, status, scheduledFor, category, tags |
| Comment | id, body, parentId, devlogId, authorId, type (POST/REPLY) |
| Reaction | id, commentId/devlogId, userId, type (LIKE/LOVE/HYPE/INSIGHTFUL) |
| FeedEvent | id, type, studioId, gameId, actorId, payload |
| RoadmapItem | id, gameId, title, description, status, releaseDate |
| Follow | id, userId, targetId, targetType (STUDIO/GAME) |
| Notification | id, userId, type, title, body, read, link |
| Session | id, userId, token, expiresAt |
| Transaction | id, amount, status, buyerId, stripePaymentIntentId (Phase 5) |
| MarketplaceListing | id, title, description, price, studioId, gameId (Phase 5) |
| StripeConnectAccount | id, studioId, stripeAccountId, chargesEnabled (Phase 5) |
| ProcessedWebhookEvent | id, stripeEventId (UNIQUE), processedAt (Phase 5) |
| PurchasedLicense | id, transactionId, listingId, buyerId, key (Phase 5) |
| ReferralCode | id, userId, code, commissionRate, uses (Phase 5) |
| Partner | id, name, type, description, contactEmail (Phase 5) |
| Event | id, title, slug, description, startDate, published (Phase 5) |

Full schema: `packages/database/prisma/schema.prisma`

---

## Testing

| Suite | Framework | Count | Status |
|-------|-----------|-------|--------|
| API unit/integration | Vitest | 478 tests, 46 spec files | 100% passing |
| E2E (Playwright) | Playwright | Configured | Requires running dev servers |

---

## Architectural Decisions

1. **Devlog.author → User (not StudioMember):** Role badge shows global `UserRole`, not studio role. Represents platform trust level, not studio hierarchy.
2. **Comment model reused for CommunityPost:** `type` discriminator column (`POST` vs `REPLY`) distinguishes auto-generated community posts from user comments.
3. **Scheduled devlog publishing:** Uses `@nestjs/schedule` 5-min cron inside the NestJS process.
4. **Stateless HMAC CSRF:** HMAC-SHA256(userId:nonce:timestamp, CSRF_SECRET) avoids DB round-trips, applied globally via APP_GUARD.
5. **SSE over WebSocket:** SSE via RxJS Subject for real-time notifications — sufficient for current needs.
6. **PCI SAQ A for marketplace:** Stripe.js tokenizes card details on the frontend; backend never touches card data.
7. **Webhook idempotency:** `ProcessedWebhookEvent` UNIQUE constraint on `stripeEventId` prevents duplicate processing.

---

*For development history, see [AGENTS.md](AGENTS.md). For changelog, see [CHANGELOG.md](CHANGELOG.md). For architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).*
