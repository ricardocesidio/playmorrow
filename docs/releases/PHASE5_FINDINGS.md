# Phase 5 Audit — Detailed Findings

**Date:** 2026-08-05

---

## Finding 1 — CRITICAL: StripePayment Not Rendered (M16)

**File:** `apps/web/app/marketplace/[id]/page.tsx:11`
**Evidence:** `import { StripePayment } from '@/components/stripe-payment'` exists on line 11. The JSX return tree (lines 52-122) contains zero references to `<StripePayment>`. The `clientSecret` state (line 22) is set in `handlePurchase` (line 27), but the Stripe Elements component is never mounted.

**Impact:** Users click "Purchase," a PaymentIntent is created at Stripe, but the card input UI never appears. Payment is impossible. All marketplace purchases are broken.

**Fix:** Add `<StripePayment>` to the JSX, conditionally rendered when `clientSecret` is present.

---

## Finding 2 — CRITICAL: Event Register Button Dead (M21)

**File:** `apps/web/app/events/[slug]/page.tsx`
**Evidence:** The "Register" `<Button>` has no `onClick` handler. The button renders but does nothing when clicked.

**Impact:** Users cannot register for events.

**Fix:** Wire onClick to a registration/ticketing flow.

---

## Finding 3 — HIGH: Missing RBAC on Events Controller (M21)

**Files:** `apps/api/src/events/events.controller.ts`
**Evidence:** `POST /api/events` and `PATCH /api/events/:slug` use `@UseGuards(SessionAuthGuard)` without `@Roles('ADMIN', 'MODERATOR')` or `RolesGuard`. Contrast with `/api/admin/moderation` which uses `@Roles('ADMIN', 'MODERATOR')` correctly.

**Impact:** Any authenticated user can create events and publish/unpublish any event.

**Fix:** Add `@Roles('ADMIN', 'MODERATOR')` decorator + `@UseGuards(RolesGuard)`.

---

## Finding 4 — HIGH: Missing RBAC on Partners Controller (M20)

**File:** `apps/api/src/partner/partner.controller.ts`
**Evidence:** `POST /api/partners` uses `@UseGuards(SessionAuthGuard)` without role restriction.

**Impact:** Any authenticated user can create B2B partner records in the CRM.

**Fix:** Add `@Roles('ADMIN', 'MODERATOR')` + `RolesGuard`.

---

## Finding 5 — HIGH: 5 Untested Backend Modules

**Evidence:** Only `apps/api/src/marketplace/marketplace.service.spec.ts` exists (4 tests). The other 5 modules have zero test files:
- `payments/` — no `.spec.ts`
- `publisher/` — no `.spec.ts`
- `creator/` — no `.spec.ts`
- `partner/` — no `.spec.ts`
- `events/` — no `.spec.ts`

Total: 13 endpoints with no test coverage.

---

## Finding 6 — HIGH: No EventBus Integration (All Phase 5)

**Evidence:** None of the 6 Phase 5 modules inject `EventBus` or `NotificationsService`. Contrast with pre-Phase 5 modules (devlogs, invitations, reports, reactions, support, dmca, press-kits, wishlist, activity, moderation) which all integrate EventBus extensively.

Missing notification opportunities:
- Purchase completed (notify seller/studio)
- Revenue milestone reached
- Referral commission earned
- New event published
- New partner onboarded

---

## Finding 7 — HIGH: EventsModule Missing Export

**File:** `apps/api/src/events/events.module.ts`
**Evidence:** Unlike all other 5 Phase 5 modules (which export their service), EventsModule has no `exports: [EventsService]`. This prevents cross-module injection of EventsService.

---

## Finding 8 — MEDIUM: Raw Error Throws

8 instances of `throw new Error(...)` instead of NestJS HttpExceptions:

| File | Current | Should Be |
|------|---------|-----------|
| marketplace.service.ts:66 | `throw new Error('Listing is not active')` | `BadRequestException` |
| marketplace.service.ts:71 | `throw new Error('Already purchased')` | `ConflictException` |
| marketplace.service.ts:79 | `throw new Error('Studio not ready...')` | `BadRequestException` |
| marketplace.controller.ts:39 | `throw new Error('studioId is required')` | `BadRequestException` |
| payments.controller.ts:23 | `throw new Error('Missing studioId')` | `BadRequestException` |
| creator.controller.ts:25 | `throw new Error('Referral code is required')` | `BadRequestException` |
| partner.controller.ts:23 | `throw new Error('type, name, and slug are required')` | `BadRequestException` |
| events.controller.ts:24 | `throw new Error('title, slug, and startDate are required')` | `BadRequestException` |

---

## Finding 9 — MEDIUM: Missing Frontend Types/Hooks

6 inline `useQuery` calls should be extracted hooks:

| Current (inline) | Missing Hook |
|-----------------|--------------|
| `events/page.tsx` — direct `useQuery` | `useEvents()` |
| `events/[slug]/page.tsx` — direct `useQuery` | `useEvent()` |
| `dashboard/partners/page.tsx` — direct `useQuery` | `usePartners()` |
| No delete listing hook | `useDeleteListing()` |
| No update listing hook | `useUpdateListing()` |
| No ticket purchase hook | `usePurchaseTicket()` |

4 missing TypeScript interfaces in `client.ts`: `Event`, `Partner`, `ReferralCode`, `ReferralCommission`.

---

## Finding 10 — MEDIUM: Documentation Gaps

| Document | Status | Issue |
|----------|--------|-------|
| STATUS.md | MISSING | Referenced by README + AGENTS as single source of truth |
| ROADMAP.md | MISSING | Referenced by AGENTS |
| ARCHITECTURE.md | STALE | Missing all Phase 5 modules (marketplace, payments, publisher, creator, partner, events) |
| CHANGELOG.md | STALE | Missing Session 18 / Phase 5 entry |
| PHASE5_FINAL_REPORT.md | EXISTS | Good but only covers backend — frontend issues discovered in audit not reflected |

---

## Finding 11 — MEDIUM: No SEO on Phase 5 Pages

All 12 Phase 5 pages are `'use client'` components with no `generateMetadata`, OpenGraph, canonical URLs, or structured data. Zero route-level `layout.tsx` for `metadata` export.

---

## Finding 12 — MEDIUM: No Route-Level Error/Loading Conventions

Zero `loading.tsx`, `error.tsx`, `not-found.tsx`, or `layout.tsx` files in any Phase 5 route directory. All loading/error/empty states are handled inline in page components (which works but doesn't leverage Next.js 15 granular routing conventions).

---

## Finding 13 — LOW: Empty State Inconsistency

2 pages use custom inline empty states instead of shared `<EmptyState>`:
- `/dashboard/revenue` — custom inline with DollarSign icon
- `/dashboard/partners` — `<p>No partners found.</p>` text

---

## Finding 14 — LOW: DTO Gaps

Only create DTOs exist:
- `CreateListingDto` ✅
- `CreatePartnerDto` ✅
- `CreateEventDto` ✅
- `UpdateListingDto` ❌
- `UpdateEventDto` ❌
- `UpdatePartnerDto` ❌

---

## Finding 15 — LOW: Creator "apply" Endpoint Mismatch

`POST /api/creator/apply` validates a referral code but does NOT create any referral association record. The verb "apply" implies a persistent action, but it's a pure validation endpoint.

---

## Finding 16 — LOW: Marketplace getListing Always Strips fileUrl

`marketplace.service.ts:40` strips `fileUrl` for all callers. Studio owners creating a listing may need to see their own file URL. No differentiation between owner and public view.

---

## Finding 17 — LOW: Marketplace Purchase No Transactional Rollback

If `payments.recordTransaction()` fails after `payments.createPaymentIntent()` succeeds, the Stripe PaymentIntent exists but has no local Transaction record. No cleanup of orphaned PaymentIntents.

---

## Finding 18 — LOW: Stripe Onboarding Uses alert()

`dashboard/marketplace/stripe/page.tsx` uses `alert()` for error handling instead of toast notifications.

---

## Finding 19 — LOW: No Ticket/Ticketing Flow for Events

The Event model has `ticketPriceCents` and `maxAttendees` but no ticket purchase backend or frontend flow exists. The "Register" button on event detail has no onClick handler (Finding 2).

---

## Finding 20 — LOW: `/me/licenses` Auth Gating

`/me/licenses` is not inside `/dashboard/` layout, so it lacks automatic auth redirect. It uses inline `useAuth()` which returns `null` (blank page) when unauthenticated rather than redirecting to `/login`.

---

## Positive Findings (What's Working Well)

1. **Stripe webhook security** — HMAC signature verification + idempotency via `ProcessedWebhookEvent` UNIQUE constraint
2. **PCI SAQ A compliance** — card data never touches backend; Stripe Elements on frontend
3. **IDOR protection** — Publisher revenue queries check studio membership; Marketplace listings filter by active status
4. **PurchasedLicense uniqueness** — compound `@@unique([userId, listingId])` prevents double purchases
5. **OnDelete: Restrict on license FK** — deletion of listing preserves purchase history
6. **Referral code security** — auto-generated 8-char codes without ambiguous characters (O/0/I/1)
7. **Consistent pagination** — all list endpoints use `page`/`pageSize`/`hasMore` pattern
8. **DTO validation** — class-validator with global ValidationPipe (`whitelist`, `forbidNonWhitelisted`)
9. **Stripe graceful degradation** — PaymentsService returns user-friendly errors if STRIPE_SECRET_KEY is missing
10. **Complete PartnerType enum** — 6 types covering full B2B CRM scope
