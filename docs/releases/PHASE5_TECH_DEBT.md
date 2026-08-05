# Phase 5 Technical Debt Register

**Date:** 2026-08-05
**Audit scope:** Phase 5 code only

---

## Immediate (Must Fix — Phase 6 Day 1-2)

| # | Item | Effort | Impact |
|---|------|--------|--------|
| TD-01 | Render StripePayment in marketplace/[id] page | 30 min | All purchases broken |
| TD-02 | Add onClick to event Register button | 15 min | Event registration dead |
| TD-03 | Add @Roles to events create/publish endpoints | 5 min | Any user can create events |
| TD-04 | Add @Roles to partners create endpoint | 5 min | Any user can create partners |

**Total: 1 hour**

---

## Short-Term (Week 1)

| # | Item | Effort |
|---|------|--------|
| TD-05 | Fix 8 raw Error throws → HttpExceptions | 30 min |
| TD-06 | Add `exports: [EventsService]` to EventsModule | 1 min |
| TD-07 | Extract 3 inline useQuery → hooks (useEvents, useEvent, usePartners) | 30 min |
| TD-08 | Add missing types to client.ts (Event, Partner, ReferralCode, ReferralCommission) | 15 min |
| TD-09 | Write tests for payments module | 2h |
| TD-10 | Write tests for publisher module | 1h |
| TD-11 | Write tests for creator module | 1h |
| TD-12 | Write tests for partner module | 1h |
| TD-13 | Write tests for events module | 1h |
| TD-14 | Integrate EventBus into marketplace purchase flow | 1h |
| TD-15 | Integrate EventBus into other Phase 5 modules | 2h |
| TD-16 | Add pagination UI to marketplace page | 30 min |
| TD-17 | Add pagination UI to events page | 30 min |
| TD-18 | Add pagination UI to partners page | 20 min |
| TD-19 | Move /me/licenses inside /dashboard layout (or add auth redirect) | 20 min |
| TD-20 | Replace alert() with toast on Stripe onboarding page | 10 min |

**Total: ~12 hours**

---

## Medium-Term (Week 2-3)

| # | Item | Effort |
|---|------|--------|
| TD-21 | Add SEO metadata to all 12 Phase 5 pages | 2h |
| TD-22 | Add route-level layout/loading/error.tsx files | 2h |
| TD-23 | Add ticket/ticketing flow for events | 4h |
| TD-24 | Add edit/delete functionality for marketplace listings | 3h |
| TD-25 | Add game association to new listing form | 1h |
| TD-26 | Add UpdateListingDto + UpdateEventDto + UpdatePartnerDto | 1h |
| TD-27 | Fix 9 `any` annotations in Phase 5 code | 1h |
| TD-28 | Add license verification to download flow (signed tokens) | 2h |
| TD-29 | Fix Stripe Connect page onboarded state tracking | 30 min |
| TD-30 | Normalize empty state components (2 custom → shared) | 15 min |
| TD-31 | Consider marketplace.getListing returning fileUrl for studio owners | 30 min |
| TD-32 | Add transactional rollback for orphaned PaymentIntents | 2h |

**Total: ~19 hours**

---

## Long-Term (Backlog)

| # | Item | Effort |
|---|------|--------|
| TD-33 | Accessibility audit + remediation on Phase 5 pages | 8h |
| TD-34 | Fix marketplace.getListing fileUrl asymmetry (owner vs public) | 1h |
| TD-35 | Rename creator applyReferral or make it persist referrals | 30 min |
| TD-36 | Add download with signed token (not direct URL) to licenses | 2h |
| TD-37 | Reactivate Dependabot | 5 min |
| TD-38 | Complete Cloudflare DNS setup (zone still pending) | Wait |
| TD-39 | Fix 133 pre-existing `any` lint warnings (not Phase 5) | 4h |

**Total: ~16 hours**

---

## Dead Code

| File | Issue |
|------|-------|
| `apps/web/app/marketplace/[id]/page.tsx:11` | `StripePayment` imported but unused (rendering missing, not dead import — CRITICAL bug) |

---

## TODOs in Code

| File | Line | Comment |
|------|------|---------|
| `apps/api/src/common/custom-throttler.guard.ts` | 7 | Audit comment about per-user rate limiting (not actionable code) |
| `apps/web/middleware.ts` | 49 | TODO: Migrate to Next.js 16 native CSP |
