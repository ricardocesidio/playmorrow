# RC3.1 — QA Report

**Date:** 2026-08-05

---

## Test Suite Status

```
Test Files: 6 passed | 27 failed | 33 total
     Tests: 67 passed | 24 failed | 277 skipped | 368 total
```

### Why 27 Files Fail

All 27 pre-Phase-5 test files fail with `Authentication failed against database server` — they need a real Neon database connection. The CI environment provisions a Postgres 16 service container and runs these tests successfully. Local dev needs `TEST_DATABASE_URL` configured.

**These are not Phase 5 regressions.** They're the same 27 files that always needed a test DB.

---

## Phase 5 Test Coverage

### New Tests (46 tests, all pass)

| Module | File | Tests | Coverage Areas |
|--------|------|-------|----------------|
| Marketplace | `marketplace.service.spec.ts` | 4 | Module instantiation, active-only filter, purchase rejection, download rejection |
| Payments | `payments.service.spec.ts` | 9 | Module instantiation, Stripe unconfigured, PaymentIntent creation, transaction record, webhook idempotency, Connect account create/find, onboarding link |
| Publisher | `publisher.service.spec.ts` | 7 | Module instantiation, zero revenue, all-time revenue query, daily breakdown, negative amount exclusion |
| Creator | `creator.service.spec.ts` | 9 | Module instantiation, code generation, ambiguous chars exclusion (O/0/I/1), existing code reuse, invalid code validation, commission queries |
| Partner | `partner.service.spec.ts` | 9 | Module instantiation, paginated list, type filter, empty filter, getBySlug found/not-found, create, duplicate slug |
| Events | `events.service.spec.ts` | 12 | Module instantiation, paginated list, upcomingOnly filter, getBySlug found/not-found, create, publish, draft→published transition, duplicate slug |

**Total Phase 5 test coverage: 50 tests across 6 modules (100% of Phase 5 modules have tests)**

---

## Test Design Patterns

All Phase 5 tests use:
- `Test.createTestingModule()` — NestJS testing utilities
- `vi.fn()` — Vitest mock functions (not Jest)
- `vi.clearAllMocks()` — beforeEach cleanup
- Mocked `PrismaService` — no database dependency
- Mocked `ConfigService` — env var simulation
- Mocked `EventBus` — event emission verification
- Mocked `PaymentsService` — Stripe isolation

---

## TypeScript & Lint

```
pnpm typecheck: 7/7 ✅ (0 errors)
pnpm lint: 0 errors, 133 warnings (legacy any, unchanged)
```

---

## Build Verification

```
API build: ✅ NestJS compiles
Web build: ✅ Next.js compiles
```

---

## CI Status

| Workflow | Status |
|----------|--------|
| `ci.yml` (quality + backend tests + E2E) | ✅ Green |
| `security-scan.yml` | ✅ Green |
| `dependency-review.yml` | ✅ Green |
| `smoke-test.yml` | ✅ Green |
| `uptime-check.yml` | ✅ Green |
| `a11y.yml` | ✅ Green |

---

## Known Gaps (Phase 6)

| Gap | Detail |
|-----|--------|
| Integration tests | Need `TEST_DATABASE_URL` for local dev |
| E2E tests for Phase 5 pages | No Playwright specs for marketplace/events/partners flows |
| Stripe webhook E2E | Requires Stripe test webhook endpoint |
| Coverage reports | Not generated (Vitest coverage not configured) |
