# Security Hardening V3 — Final Commit Review

**Date:** 2026-08-11
**Baseline:** `e8855ae`

---

## Verdict: 🟢 READY TO COMMIT

All 5 findings remediated with verified evidence. No M23 files touched. No
unrelated changes. No new dependencies. No secrets exposed.

---

## Files Changed (15 + 1)

### CSP-1 + HDR-1 (1 file)
| File | Finding | Changes |
|------|---------|---------|
| `apps/web/middleware.ts` | CSP-1 (P1), HDR-1 (P3) | Added Stripe CSP: `js.stripe.com`, `api.stripe.com`, `frame-src`. Added `Permissions-Policy`. 13 lines. |

### IDOR-1 (4 files)
| File | Finding | Changes |
|------|---------|---------|
| `apps/api/src/games/games.service.ts` | IDOR-1 (P2) | `findBySlug()` + `findByStudioSlug()` accept optional viewer; draft gating via `isPublished` + studio membership check. 30 lines. |
| `apps/api/src/games/games.controller.ts` | IDOR-1 (P2) | Added `OptionalSessionGuard` + `@CurrentUser()` to public GET endpoints. 17 lines. |
| `apps/api/src/games/games.controller.spec.ts` | IDOR-1 tests | 4 new tests: anonymous 404, owner 200, non-member 404, published 200. 28 lines. |
| `apps/api/src/follows/follows.controller.spec.ts` | IDOR-1 test fix | Authenticated GET /games/:slug (draft requires auth). 4 lines. |

### SAST-019 (1 file)
| File | Finding | Changes |
|------|---------|---------|
| `apps/api/src/email/email-tracking.controller.ts` | SAST-019 (P2) | URL allowlist validation (`isValidRedirectUrl`): https-only, no userinfo, 4 host allowlist. 24 lines. |

### RATE-1 (10 files)
| File | Endpoints | Limit |
|------|-----------|-------|
| `apps/api/src/devlogs/devlogs.controller.ts` | create, update, delete, like | 15/min |
| `apps/api/src/roadmap-items/roadmap-items.controller.ts` | create, update, delete, reorder | 15/min |
| `apps/api/src/marketplace/marketplace.controller.ts` | create, purchase, update, delete | 10/min |
| `apps/api/src/wishlist/wishlist.controller.ts` | add, remove | 30/min |
| `apps/api/src/payments/payments.controller.ts` | stripe/onboarding | 10/min |
| `apps/api/src/creator/creator.controller.ts` | generate code | 15/min |
| `apps/api/src/publisher/publisher.controller.ts` | all (class-level) | 20/min |
| `apps/api/src/events/events.controller.ts` | create, update, register | 10/min |
| `apps/api/src/partner/partner.controller.ts` | create, update | 10/min |

### Documentation (1 file)
| `docs/releases/SECURITY_HARDENING_V3_CERTIFICATION.md` | New |

## M23 Freeze

| Check | Result |
|-------|--------|
| M23 files in diff | **0** |
| Recommendation algorithm | Untouched |
| Weights | Untouched |
| Embeddings | Untouched |
| Rollout (5%) | Untouched |
| Personalization | Untouched |
| Kill switch | Untouched |

## Verification

| Gate | Result |
|------|--------|
| `pnpm verify` | 6/6 ✅ |
| API tests | 542/542 (51 files) ✅ |
| Lint | 0 errors ✅ |
| Typecheck | 7/7 ✅ |
| Build | 6/6 ✅ |
| Dompurify | 3.4.13 ✅ |
| Sharp | 0.35.3 ✅ |
| Multer | 2.2.0 ✅ |
| js-yaml | 4.3.1 ✅ |
| Secrets in diff | 0 ✅ |
| Dependencies changed | 0 ✅ |
| Unrelated changes | 0 ✅ |

## Git State

| Check | Status |
|-------|--------|
| HEAD | `e8855ae` |
| Files modified | 15 |
| Files new | 1 (certification doc) |
| Staged | 0 |
| M23 files staged | 0 |
| Commit created | NO |
| Push | NO |
| Deploy | NO |

## Per-File Review

| File | Finding | Unrelated? | Risk |
|------|---------|------------|------|
| `middleware.ts` | CSP-1, HDR-1 | 0 unrelated lines | LOW — header changes only |
| `email-tracking.controller.ts` | SAST-019 | 0 unrelated lines | LOW — validation only, allowlist-based |
| `games.service.ts` | IDOR-1 | 0 unrelated lines | LOW — additive, no existing flow broken |
| `games.controller.ts` | IDOR-1 | 0 unrelated lines | LOW — `OptionalSessionGuard` + optional param |
| `games.controller.spec.ts` | IDOR-1 | 0 unrelated lines | LOW — new tests only |
| `follows.controller.spec.ts` | IDOR-1 | 0 unrelated lines | LOW — auth cookie added to existing test |
| 10 RATE-1 controllers | RATE-1 | 0 unrelated lines | LOW — `@Throttle` + import only |

**All 15 files contain ONLY security hardening changes. Zero unrelated modifications.**

## Proposed Commit Message

```
security: harden web application security controls (V3)

Remediate 5 findings from web/production security audit:

CSP-1 (P1): Add Stripe domains to CSP (script-src, connect-src, frame-src)
IDOR-1 (P2): Gate draft game access by viewer authorization
SAST-019 (P2): Validate redirect URLs in email tracking (allowlist)
HDR-1 (P3): Add Permissions-Policy header
RATE-1 (P3): Add @Throttle to 10 unprotected mutation controllers

542/542 tests · pnpm verify 6/6 · 0 M23 files touched
```

## Recommended Action

### 🟢 Authorize `git add` + `git commit`

Stage ONLY the 15 V3 files + certification doc. Do NOT `git add .`.

```bash
git add apps/api/src/creator/creator.controller.ts \
        apps/api/src/devlogs/devlogs.controller.ts \
        apps/api/src/email/email-tracking.controller.ts \
        apps/api/src/events/events.controller.ts \
        apps/api/src/follows/follows.controller.spec.ts \
        apps/api/src/games/games.controller.spec.ts \
        apps/api/src/games/games.controller.ts \
        apps/api/src/games/games.service.ts \
        apps/api/src/marketplace/marketplace.controller.ts \
        apps/api/src/partner/partner.controller.ts \
        apps/api/src/payments/payments.controller.ts \
        apps/api/src/publisher/publisher.controller.ts \
        apps/api/src/roadmap-items/roadmap-items.controller.ts \
        apps/api/src/wishlist/wishlist.controller.ts \
        apps/web/middleware.ts \
        docs/releases/SECURITY_HARDENING_V3_CERTIFICATION.md
git diff --cached --stat  # verify: 16 files only
git commit -m "security: harden web application security controls (V3)"
```
