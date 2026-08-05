# Playmorrow — Project Status

> **Last verified:** 2026-08-05
> **Branch:** `main` (876+ commits)
> **Repository:** [github.com/ricardocesidio/playmorrow](https://github.com/ricardocesidio/playmorrow) (public)
> **Engineering Score:** 84/100
> **Tests:** 318 pass, 0 failures (27 files) • **Typecheck:** 6/6 • **Lint:** 0 errors
> **Live:** https://playmorrow.co

---

## Milestone Summary (21 Milestones)

| Milestone | Focus | Status | Description |
|-----------|-------|--------|-------------|
| **M1** | Support Center | Complete | Support tickets, replies, admin queue, notifications |
| **M2** | Help Center | Complete | Documentation platform with CMS, categories, search, article feedback |
| **M3** | Studio Analytics | Complete | Real event tracking, daily aggregates, game & studio analytics dashboards |
| **M4** | Verification & Trust | Complete | Tiered verification (6 levels), trust scoring, brand kits, press kits |
| **M5** | Discovery Platform | Complete | Recommendations (9 scorers), Search 2.0, Dynamic Collections (5), Discover page, SEO landing pages |
| **M6** | Performance & SEO | Complete | TanStack Query caching, 30s auto-refresh, OG images, canonical URLs, JSON-LD, dynamic sitemap |
| **M7** | QA & CI/CD | Complete | 318 tests (27 files), GitHub Actions CI, pre-push hooks, lint + typecheck + build gating |
| **M8** | Moderation Center | Complete | Reports, suspension, shadow ban, appeals, strikes, DMCA workflow, admin dashboard |
| **M9** | Email Automation | Complete | Templates CRUD, transactional emails, weekly digest, bounce handling, delivery analytics |
| **M10** | Security Hardening | Complete | Stateless HMAC CSRF (global), CSP nonce, DOMPurify, sanitize-html, argon2id, rate limiting, audit log |
| **M11** | Public API | Complete | API keys with scoped access, programmatic access endpoints |
| **M12** | SDK & CLI | Complete | `@playmorrow/sdk` (JS client), `playmorrow` CLI (search, games, trending) |
| **M13** | Production Hardening | Complete | Dashboard restructure, OAuth cookie domain fix, CSP fixes, branch protection, Dependabot |
| **M14** | Professionalization | Complete | Full project audit, enterprise readiness, repo files (CONTRIBUTING, SECURITY, CODE_OF_CONDUCT) |
| **M15** | Final Polish & UI | Complete | Devlog blog redesign, push notifications, email verification, avatar upload, SSE notifications |
| **M16** | Marketplace | Complete | Stripe Connect Express, PaymentIntent, listings, purchases, licenses (5 DB models) |
| **M17** | Publisher | Complete | Per-studio revenue dashboard with earnings and payout history |
| **M18** | Funding | Scope Defined | Reward-based crowdfunding (Kickstarter model); equity/investment blocked — implementation deferred |
| **M19** | Creator | Complete | Referral codes + commission tracking via affiliate system |
| **M20** | Partner | Complete | B2B CRM with 6 partner types (University, Publisher, Accelerator, Incubator, Studio, Event Organizer) |
| **M21** | Events | Complete | Event listings, detail pages, publish workflow, ticketing, upcoming filter |

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
| Upload validation | Complete | MIME whitelist + magic bytes + 4096px max + 20MB limit |
| Rate limiting | Complete | ThrottlerModule: 60/min global + per-route overrides |

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

| # | Issue | Severity | Milestone | Status |
|---|-------|----------|-----------|--------|
| 1 | StripePayment component not rendered — card payment flow broken | Critical | M16 | Needs fix |
| 2 | Register button on event detail has no onClick handler | Critical | M21 | Needs fix |
| 3 | POST/PATCH /api/events missing @Roles admin/mod guard | High | M21 | Needs fix |
| 4 | POST /api/partners missing @Roles admin/mod guard | High | M20 | Needs fix |
| 5 | Marketplace purchase flow has no transactional rollback for orphaned PaymentIntents | Medium | M16 | Needs fix |
| 6 | /me/licenses not inside /dashboard layout — lacks auth redirect gating | Medium | M16 | Needs fix |
| 7 | Stripe Connect page uses alert() instead of toast/ErrorState | Low | M16 | Needs fix |
| 8 | No SEO metadata on any Phase 5 page (no generateMetadata, OpenGraph, canonical) | Low | M16-M21 | Needs fix |
| 9 | No route-level layout/loading/error convention files for Phase 5 pages | Low | M16-M21 | Needs fix |
| 10 | marketplace/[id] fileUrl shown in UI for non-owners | Low | M16 | Needs fix |
| 11 | No pagination UI on marketplace/events/partners despite API support | Low | M16-M21 | Needs fix |
| 12 | Creator applyReferral is read-only — name implies action but none performed | Low | M19 | Needs fix |
| 13 | No DTOs for update operations (UpdateListingDto, UpdateEventDto, etc.) | Low | All Phase 5 | Needs fix |
| 14 | 9 `any` type annotations in Phase 5 code | Low | All Phase 5 | Needs fix |
| 15 | No delete/edit functionality for marketplace listings in dashboard | Low | M16 | Needs fix |
| 16 | No game association field in new listing form | Low | M16 | Needs fix |
| 17 | 6 missing TypeScript interfaces in client.ts | Low | All Phase 5 | Needs fix |
| 18 | No 2FA (multi-factor authentication) | Medium | Core | Planned |
| 19 | No Redis-backed rate limiting (in-memory reset on restart) | Low | Core | Planned |
| 20 | GDPR export UI pending | Medium | Core | Planned |
| 21 | Integration tests share Neon dev DB (no dedicated test database) | Medium | CI | Planned |

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
