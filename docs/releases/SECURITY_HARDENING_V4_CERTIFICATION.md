# Playmorrow — Security Hardening V4 Certification

**Date:** 2026-08-11
**Baseline:** `14ab149`
**Findings Source:** `docs/releases/FINAL_FINDING_VALIDATION_V1.md`
**Sprint:** Targeted P3 Remediation

---

## Verdict: 🟢 SECURITY HARDENING V4 COMPLETE

All 3 authorized findings remediated with verified evidence. No M23 algorithm
components modified. No dependency changes. No schema changes.

---

## 1. Remediation Summary

| Finding | Severity | Description | Status | Files |
|---------|----------|-------------|--------|-------|
| F-3 | P3 | Class-level @SkipCsrf on ApiKeysCtrl + EmailTemplatesCtrl | **REMEDIATED** | 2 files |
| F-2 | P4 | CSP report route miswired (duplicate `/api/` prefix) | **REMEDIATED** | 1 file |
| F-4 | P4 | MMR λ doc drift (0.7 → 0.5) | **REMEDIATED** | 1 file (doc only) |
| F-5 | P3 | GET endpoint throttling | **DEFERRED** — global 60/min floor is sufficient | 0 |
| F-6/F-7/F-8 | P3 | UX issues | **DEFERRED** — not security, separate UX sprint | 0 |
| F-9 | — | Incorrect finding | **CLOSED** — hooks never existed | 0 |

---

## 2. Detailed Changes

### F-3: ApiKeysController

**Change:** Removed class-level `@SkipCsrf()` and unused `SkipCsrf` import.

**Before:** All 3 endpoints (POST create, GET list, DELETE revoke) bypassed CSRF.
**After:** POST/DELETE now require valid `X-CSRF-Token` header. GET is unaffected
(CsrfGuard skips GET by default). `SessionAuthGuard` remains active.

**Impact:** An attacker page can no longer forge API key creation/revocation
requests through a victim's authenticated browser session.

### F-3: EmailTemplatesController

**Change:** Removed class-level `@SkipCsrf()` and unused `SkipCsrf` import.

**Before:** All POST/PATCH endpoints bypassed CSRF. ADMIN role gate remained active.
**After:** POST/PATCH now require valid `X-CSRF-Token` header. `SessionAuthGuard`
+ `@Roles('ADMIN')` remain active.

**Impact:** Admin-only email template mutations now protected by CSRF.
Blast radius limited to admin users but defense-in-depth improved.

### F-2: CSP Report Route

**Change:** `@Post('api/csp-report')` → `@Post('csp-report')`

**Before:** Route resolved to `/api/api/csp-report` (global `api` prefix +
controller route `api/csp-report`). CSP header sent `report-uri /api/csp-report`
→ 404. Violations silently lost.

**After:** Route resolves to `/api/csp-report` (global `api` prefix +
controller route `csp-report`). CSP header matches. Violations now reach the handler.

### F-4: MMR λ Documentation

**Change:** `docs/ai/M23_OBSERVATION_FREEZE.md` row 6: `λ=0.7` → `λ=0.5`

**Before:** Freeze doc claimed MMR λ=0.7 (70% relevance weight).
**After:** Matches code (`MMR_LAMBDA = 0.5` in `hybrid-recommender.service.ts:71`).

Documentation-only fix. Does NOT restart M23 observation window.

---

## 3. Verification Evidence

| Gate | Result |
|------|--------|
| Typecheck | 7/7 ✅ |
| `pnpm verify` | 6/6 (lint 0 errors, typecheck, build) |
| API Tests | **542/542** (51 files) ✅ |
| Class-level @SkipCsrf on authed controllers | **0 remaining** ✅ |
| M23 algorithm files modified | **0** ✅ |
| M23 weights changed | **0** ✅ |
| M23 rollout changed | **0** ✅ |
| Dependencies changed | **0** ✅ |
| Schema changed | **0** ✅ |

---

## 4. M23 Freeze

| Check | Result |
|-------|--------|
| Rollout | 5% (unchanged) |
| Freeze | ACTIVE |
| Algorithm | Untouched |
| Weights | Untouched |
| Embeddings | Untouched |
| Metrics | Untouched |
| Baseline | Not restarted |

The only M23-related change is the freeze doc λ correction (F-4), which is a
documentation-only fix and does not constitute a freeze violation.

---

## 5. Git State

```
HEAD: 14ab149 (unchanged)
Staged: 0
Modified: 4 files
  apps/api/src/api-keys/api-keys.controller.ts       (F-3)
  apps/api/src/email-templates/email-templates.controller.ts  (F-3)
  apps/api/src/common/csp.controller.ts              (F-2)
  docs/ai/M23_OBSERVATION_FREEZE.md                  (F-4)
M23 files modified: 1 (docs/ai/M23_OBSERVATION_FREEZE.md — doc-only)
Dependencies: 0
Schema: 0
NOT COMMITTED · NOT PUSHED · NOT DEPLOYED
```

---

## 6. Static Security Check

- 0 remaining controllers with both `@UseGuards(SessionAuthGuard)` and class-level `@SkipCsrf()`
- 0 accidental CSP weakening
- 0 accidental CORS changes
- 0 accidental auth bypass
- 0 new `@SkipCsrf()` introduced
- All remaining `@SkipCsrf()` usage is method-level and previously validated:
  - `POST /auth/session/logout` — justified
  - `PATCH /email-preferences` — debatable, existing
  - `POST /unsubscribe/:token` — token-based auth
  - `POST /dmca/takedown` — public form
  - `POST /dmca/counter/:id` — public form
  - EmailTrackingController (class) — GET-only, CsrfGuard skips GET
  - EmailWebhooksController (class) — unauthenticated, CsrfGuard skips

---

## 7. Deployment Recommendation

### 🟢 READY FOR SECURITY COMMIT REVIEW

3 of 3 authorized findings remediated. 542/542 tests pass. All gates green.
No M23 algorithm components modified. No dependency changes.
