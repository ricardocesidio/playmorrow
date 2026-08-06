# Playmorrow — Project Status

> **Last verified:** 2026-08-06
> **Version:** v0.85-beta
> **Repository:** [github.com/ricardocesidio/playmorrow](https://github.com/ricardocesidio/playmorrow)
> **Tests:** 368+ total (33 files, 90 AI). **Typecheck:** 7/7. **Lint:** 0 errors.
> **Live:** https://playmorrow.co

---

## Honest Status (2026-08-06)

Playmorrow is v0.85-beta. All critical bugs from the independent audit are resolved.

What works:
- Backend: 55 modules, ~165 API endpoints
- Frontend: 82+ routes, all pages functional
- Marketplace: Stripe Connect Express integrated (test mode)
- AI Module: 35 files, M23 shipped (embedding-based recs via OpenAI)
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

### Remaining
| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | No Phase 5 E2E tests (Playwright) | Medium | Specs exist, CI pending |
| 2 | Integration tests share Neon dev DB | Medium | Planned |
| 3 | SSE/RxJS single-instance (needs Redis pub/sub for scaling) | Low | Planned |
| 4 | AI module spec rot: 25 tests fail (mocks stale vs ProviderFactory API) | Medium | Rebase AI specs on current provider interfaces |
| 5 | Dev DB migration history drifted (13 migrations unapplied, 1 failed) | Medium | Re-provision dev DB or reconcile via prisma migrate resolve |
| 6 | No staging environment deployed | Medium | render.yaml configured, not deployed |
| 7 | No delete/edit for marketplace listings | Low | Planned |
| 8 | fileUrl shown in UI for non-owners | Low | Backend strips it; UI block is dead code |

---

## Production Deployment

### URLs

| Environment | URL | Status |
|-------------|-----|--------|
| Frontend | https://playmorrow.co (Vercel) | 200 |
| API | https://playmorrow-api-aged-mountain-9542.fly.dev (Fly.io) | 200 |
| Health | https://playmorrow-api-aged-mountain-9542.fly.dev/api/health | 200 |
| Database | Neon PostgreSQL (connection pooler) | Active |

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
| API unit/integration | Vitest | 318 tests, 27 spec files | 100% passing |
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
