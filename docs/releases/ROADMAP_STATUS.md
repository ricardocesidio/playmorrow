# ROADMAP STATUS — Phase 5 Certification Audit

**Date:** 2026-08-05

**Note:** The original `ROADMAP.md` file is missing from the repository. This document reconstructs the Phase 5 roadmap status from AGENTS.md, docs/releases/PHASE5_FINAL_REPORT.md, and codebase evidence.

---

## Phase 5 — Ecosystem (Session 18, 2026-07-30/31)

### M16 — Marketplace
- **Status:** 🟢 Implemented (with 1 critical frontend bug)
- **Backend:** 22 endpoints across marketplace + payments + Stripe webhook
- **Frontend:** 6 pages (marketplace listing/detail/licenses/dashboard/new/stripe)
- **Database:** 5 models (Transaction, MarketplaceListing, StripeConnectAccount, ProcessedWebhookEvent, PurchasedLicense)
- **Critical Bug:** StripePayment component never rendered — card payment flow broken
- **Tests:** 4 unit tests (marketplace.service.spec.ts)

### M17 — Publisher
- **Status:** 🟢 Implemented
- **Backend:** 3 endpoints (all-revenue, per-studio, per-studio-by-period)
- **Frontend:** 1 page (revenue dashboard with metric cards)
- **Security:** IDOR protected (studio membership check)
- **Tests:** None

### M18 — Funding
- **Status:** 🟡 Scope defined only (by design)
- **Legal:** M18_SCOPE_DECISION.md — reward-based crowdfunding only; equity/investment blocked
- **Implementation:** Deferred to Phase 6 (needs legal counsel + reward schema design)

### M19 — Creator
- **Status:** 🟢 Implemented
- **Backend:** 3 endpoints (referral code + commissions + validate)
- **Frontend:** 1 page (creator dashboard with referral link + stats)
- **Database:** 1 model (ReferralCode)
- **Tests:** None
- **Note:** `applyReferral` is read-only — validates code but doesn't persist any relationship

### M20 — Partner
- **Status:** 🟢 Implemented (with RBAC gap)
- **Backend:** 3 endpoints (list + get + create)
- **Frontend:** 1 page (partners directory with type tabs)
- **Database:** 1 model (Partner with 6 PartnerType values)
- **RBAC Gap:** Any authenticated user can create partners (no ADMIN/MODERATOR guard)
- **Tests:** None

### M21 — Events
- **Status:** 🟢 Implemented (with RBAC gap + frontend bug)
- **Backend:** 4 endpoints (list + get + create + publish)
- **Frontend:** 2 pages (events listing + event detail)
- **Database:** 1 model (Event)
- **RBAC Gap:** Any authenticated user can create/publish events
- **Frontend Bug:** Register button on event detail has no onClick handler
- **Tests:** None

---

## Engineering Improvements (Session 18)

| Improvement | Status |
|-------------|--------|
| Pre-push hook: `pnpm verify` (lint + typecheck + build) | ✅ |
| Refactored `any`/`req: any` → `@CurrentUser()` + typed DTOs | ✅ |
| IDOR protection on listing creation + revenue queries | ✅ |
| Stripe rawBody: `NestFactory.create(AppModule, { rawBody: true })` | ✅ |
| Dockerfile: CMD runs `node apps/api/dist/main.js` | ✅ |
| Responsive overflow fix: header grid `minmax(0,1fr)` | ✅ |

---

## Phase 6 — Planned (from certification findings)

1. Fix 3 critical frontend bugs (StripePayment, Register button, RBAC)
2. Write tests for 5 untested Phase 5 modules
3. Integrate EventBus into Phase 5 modules
4. M18 Funding — reward-based crowdfunding implementation
5. SEO pass on all 12 Phase 5 pages
6. Accessibility audit + remediation
7. Recreate missing documentation (STATUS.md, ROADMAP.md)

---

## Missing Documentation

| Document | Status | Action |
|----------|--------|--------|
| STATUS.md | MISSING | Reconstruct from AGENTS.md + git history |
| ROADMAP.md | MISSING | Replace with this document |
| CHANGELOG.md | STALE | Add Session 18 / Phase 5 entry |
| ARCHITECTURE.md | STALE | Add Phase 5 modules to module listing |
