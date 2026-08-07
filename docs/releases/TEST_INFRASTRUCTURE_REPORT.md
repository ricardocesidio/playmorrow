# Test Infrastructure Report

**Project:** Playmorrow  
**Date:** 2026-08-05  
**Scope:** Full testing architecture — backend unit/integration tests + E2E frontend tests

---

## 1. Current State

### Frameworks & Runners

| Layer | Framework | Runner | Config |
|---|---|---|---|
| Backend (unit + integration) | Vitest 2.1.8 | `vitest run` | `apps/api/vitest.config.ts` |
| Backend (HTTP integration) | Supertest 7.0 | Inside Vitest suites | `request()` from supertest |
| Frontend (E2E) | Playwright | `playwright test` | `apps/web/playwright.config.ts` |
| NestJS testing | `@nestjs/testing` 11.0 | `Test.createTestingModule()` | via vitest globals |

### Test Database

- **CI:** PostgreSQL 16 service container (`postgres:16-alpine` in GitHub Actions), port 5432, DB `playmorrow_test`
- **Local dev:** `docker-compose.yml` provides `postgres-test` service on port **5433** (avoids collision with port 5432)
- **Production:** Neon (pooled), guarded by `vitest.setup.ts` — tests **cannot** run against production Neon unless `ALLOW_PROD_DB_FOR_TESTS=1` is explicitly set
- **Connection override:** If `TEST_DATABASE_URL` is set, `vitest.setup.ts` overrides `DATABASE_URL` before any test runs
- **CI env vars provided to backend job:**
  - `TEST_DATABASE_URL` + `DATABASE_URL`: both pointing at the CI postgres container
  - `JWT_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`, `CSRF_SECRET`: minimum CI-safe values

### Test Counts

| Category | Files | Description |
|---|---|---|
| Backend spec files (total) | 33 | All under `apps/api/src/` |
| Integration tests (supertest) | 27 | Require real DB + HTTP server |
| Unit tests (mocked, no DB) | 6 | Phase 5 modules (mock PrismaService only) |
| Phase 5 tests | 50 | Payments (9), Creator (10), Events (12), Partner (9), Publisher (6), Marketplace (4) |
| E2E (Playwright) | 6 suites | Auth, public pages, personalized feed, responsive, social actions, snapshots |
| Backend tests passing | 67+ (unit) + 200+ (integration) | All 33 files green, zero failures |
| E2E tests passing | All 6 suites | Desktop Chrome + Pixel 7 mobile |

---

## 2. How Tests Work

### 2.1 Unit Tests (Mocked — No DB Required)

**6 files** use `vi.fn()` to mock `PrismaService` + `ConfigService` (and external SDKs like Stripe). No database connection is needed — these run in any environment.

**Pattern (from Phase 5 modules):**

```typescript
// apps/api/src/creator/creator.service.spec.ts

const mockPrisma = {
  referralCode: { findUnique: vi.fn(), create: vi.fn() },
  transaction: { findMany: vi.fn() },
};

beforeEach(async () => {
  const module = await Test.createTestingModule({
    providers: [
      CreatorService,
      { provide: PrismaService, useValue: mockPrisma },
    ],
  }).compile();
  service = module.get(CreatorService);
});
```

**Mocked modules:**
- `PaymentsService` — mocks `stripe` SDK (`vi.mock('stripe')`) + PrismaService + ConfigService
- `PublisherService` — mocks PrismaService
- `CreatorService` — mocks PrismaService
- `PartnerService` — mocks PrismaService + ConfigService
- `EventsService` — mocks PrismaService
- `MarketplaceService` — mocks PrismaService + EventBus

### 2.2 Integration Tests (Supertest — Requires DB)

**27 files** use `supertest` to make real HTTP requests against a NestJS application booted via `Test.createTestingModule()`. Each test suite:

1. **Imports** real modules (`PrismaModule`, `AuthModule`, `EventBusModule`, `NotificationsModule`, target module)
2. **Creates** a test app via `createTestApp()` helper (`apps/api/src/test/create-test-app.ts`)
3. **Registers** test users via `registerTestUser()` helper (`apps/api/src/test/register-test-user.ts`)
4. **Uses unique suffixes** (`Date.now()`) on emails, slugs, and studio names to prevent collisions
5. **Cleans up** in `afterAll()` by deleting all created records

**Key test helpers (`apps/api/src/test/`):**
- `create-test-app.ts` — boots NestJS + returns app module + httpServer
- `register-test-user.ts` — creates user via API, returns session cookie
- `mock-email-service.ts` — `MockEmailModule` that swallows all emails (no Resend needed)

**Example (from games.controller.spec.ts):**

```typescript
const SUFFIX = `g-${Date.now()}`;
const OWNER_EMAIL = `owner_${SUFFIX}@example.com`;

beforeAll(async () => {
  const result = await createTestApp(
    Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule, UsersModule, AuthModule,
        EventBusModule, NotificationsModule,
        MockEmailModule, ScheduleModule.forRoot(),
        StudiosModule, GamesModule,
      ],
    }),
  );
  prisma = result.app.get(PrismaService);
  const owner = await registerTestUser(httpServer, prisma, OWNER_EMAIL, PASSWORD);
  ownerToken = owner.sessionCookie;
});

afterAll(async () => {
  await prisma.game.deleteMany({ where: { slug: GAME_SLUG } });
  await prisma.studio.deleteMany({ where: { slug: STUDIO_SLUG } });
  await prisma.user.deleteMany({ where: { email: { in: [...] } } });
});
```

### 2.3 E2E Tests (Playwright)

**6 suites** test the Next.js frontend against a real server using:
- **Desktop Chrome** (1440×900 viewport)
- **Mobile Pixel 7** (emulated device)
- `reuseExistingServer: false` — Playwright always starts its own server
- `PLAYWRIGHT_DEV=1` flag for fast iteration mode (hot reload, no production build)
- `UPDATE_SNAPSHOTS=1` for visual snapshot tests (snapshot tests excluded from default run)
- Artifacts uploaded on failure (trace, screenshot, video)

---

## 3. CI Pipeline (`ci.yml`)

Three parallel jobs, triggered on push + PR to `main`:

```
┌─────────────────────────────────────────────────┐
│                    CI Pipeline                    │
├───────────────┬──────────────┬──────────────────┤
│   quality     │   backend    │       e2e        │
│ Lint+Typecheck│ Tests+PG16   │  Playwright      │
│ + audit       │              │  desktop+mobile  │
└───────────────┴──────────────┴──────────────────┘
```

### quality Job
- `pnpm lint` — ESLint across all workspaces
- `pnpm typecheck` — `tsc --noEmit` across all workspaces
- `pnpm audit --prod --audit-level=critical` — dependency vulnerability check (warning only)

### backend Job
1. Provisions `postgres:16` service container with health check (`pg_isready`)
2. Builds `@playmorrow/api` + workspace dependencies via turbo (`--filter=@playmorrow/api...`)
3. Applies Prisma migrations (`pnpm --filter @playmorrow/database db:deploy`)
4. Runs backend tests (`pnpm --filter @playmorrow/api test`)
5. Env vars: `TEST_DATABASE_URL`, `DATABASE_URL`, `JWT_SECRET`, OAuth + CSRF secrets

### e2e Job
1. Builds `@playmorrow/web` + workspace dependencies
2. Installs Chromium browser for Playwright
3. Runs Playwright test suite (desktop + mobile)
4. Uploads report artifact on failure (`playwright-report/`, `test-results/`, 7-day retention)

### Concurrency
- Grouped by `${{ github.ref }}` — only one CI run per branch at a time
- `cancel-in-progress: true` — new pushes cancel older in-flight runs

---

## 4. Local Test DB Setup

### Option A: Docker (recommended)

```bash
# Start the isolated test Postgres on port 5433
pnpm --filter @playmorrow/api test:db:up

# Push schema to the test DB
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/playmorrow_test?schema=public \
  pnpm --filter @playmorrow/database db:push

# Run tests against the isolated DB
pnpm --filter @playmorrow/api test:with-db

# Stop when done
pnpm --filter @playmorrow/api test:db:down
```

### Option B: Neon Branch

```bash
TEST_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/playmorrow-test?sslmode=require \
  pnpm --filter @playmorrow/api test
```

### Option C: Direct dev DB (NOT recommended)

```bash
pnpm --filter @playmorrow/api test
```

This runs tests against the connection string in `.env`. The `vitest.setup.ts` guard will block this if it detects a production-like URL (Neon patterns without `test`/`5433`/`localhost:543`).

### Docker Compose Reference

```yaml
# docker-compose.yml (root)
services:
  postgres-test:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: playmorrow_test
    ports:
      - "5433:5432"       # Host port 5433 → container port 5432
    tmpfs: /var/lib/postgresql/data   # Ephemeral storage (data lost on stop)
```

**Key detail:** `tmpfs` mount means the test DB is **ephemeral** — all data is lost when the container stops. This is intentional to prevent test data accumulation.

---

## 5. Vitest Configuration

```typescript
// apps/api/vitest.config.ts
export default defineConfig({
  css: false,
  test: {
    globals: true,                    // No imports needed for describe/it/expect
    environment: 'node',              // Server-side tests only
    include: ['src/**/*.spec.ts'],    // Only spec files in source tree
    setupFiles: ['./vitest.setup.ts'], // DB URL override + safety guard
    coverage: {
      provider: 'v8',                 // Native V8 coverage
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: ['src/test/**', '**/*.spec.ts', '**/node_modules/**'],
    },
  },
  plugins: [
    swc.vite({                        // SWC for NestJS decorators + TypeScript
      jsc: {
        target: 'es2022',
        parser: { syntax: 'typescript', decorators: true, dynamicImport: true },
        transform: { decoratorMetadata: true, legacyDecorator: true },
      },
    }),
  ],
});
```

### vitest.setup.ts — Safety Guard

```typescript
// Detects production-like Neon URLs and blocks tests unless
// ALLOW_PROD_DB_FOR_TESTS=1 is explicitly set.
const isLikelyProd = /neon\.tech|playmorrow-prod|ep-aged-darkness/i.test(dbUrl)
  && !/test|5433|localhost:543/i.test(dbUrl);
if (isLikelyProd && !process.env.ALLOW_PROD_DB_FOR_TESTS) {
  throw new Error("🛑 TEST SAFETY: Refusing to run tests against production...");
}
```

This was added after 70+ test games and 1600 test users were accidentally created in the production DB during early development.

---

## 6. Phase 5 Test Architecture

All 6 Phase 5 modules (Marketplace, Payments, Publisher, Creator, Partner, Events) use the **unit test pattern** with mocked dependencies:

| Module | Tests | Mocked Dependencies |
|---|---|---|
| PaymentsService | 9 | `stripe` SDK, PrismaService, ConfigService |
| CreatorService | 10 | PrismaService |
| EventsService | 12 | PrismaService |
| PartnerService | 9 | PrismaService, ConfigService |
| PublisherService | 6 | PrismaService |
| MarketplaceService | 4 | PrismaService, EventBus |
| **Total** | **50** | |

**Design decision:** Phase 5 modules were written as unit tests with mocks (no DB dependency) to:
1. Run in CI without additional database provisioning
2. Run locally without `test:db:up`
3. Test business logic in isolation from database state

This means Phase 5 modules **do not** have integration/E2E tests yet. See [Gaps](#8-gaps).

---

## 7. Test Helper Suite

Located at `apps/api/src/test/` (excluded from production build via `tsconfig.build.json` exclude list):

| File | Purpose |
|---|---|
| `create-test-app.ts` | Boots a NestJS `INestApplication` for supertest, returns `{ app, httpServer }` |
| `register-test-user.ts` | Registers a user via HTTP, returns session cookie for authenticated requests |
| `mock-email-service.ts` | Mock email module that replaces real `EmailService` (no Resend API key required) |

These helpers are used by all 27 integration test files. They are excluded from the production build in `apps/api/tsconfig.json`:
```json
"exclude": ["node_modules", "dist", "**/*.spec.ts", "src/scripts", "src/test"]
```

---

## 8. Gaps

### 8.1 No E2E Coverage for Phase 5 Pages

**Status:** The 6 Playwright E2E spec files cover core pages (auth, public pages, feed, responsive design, social actions, snapshots). None cover Phase 5 marketplace, events, creator dashboard, partner CRM, or publisher revenue pages.

**Impact:** UI regressions in marketplace/events would be caught only by manual testing.

**Recommendation:** Add 2–3 E2E spec files for Phase 5 pages: `marketplace.spec.ts`, `events.spec.ts`, `dashboard-commerce.spec.ts`.

### 8.2 No Integration Tests for Phase 5 Modules

**Status:** All 6 Phase 5 modules have unit tests with mocks (50 tests). They lack supertest-based integration tests that exercise the full HTTP layer.

**Impact:** HTTP-level concerns (guards, validation pipes, serialization, error formatting) for Phase 5 endpoints are untested.

**Recommendation:** Add 1 integration spec per Phase 5 module following the existing `games.controller.spec.ts` pattern.

### 8.3 No Seed Scripts for Test Fixtures

**Status:** Tests create their own data in `beforeAll()` using unique `Date.now()` suffixes. There is no shared seed script for test fixtures.

**Impact:** Each test suite is self-contained, which is good for isolation, but adds boilerplate. No issue at current scale (33 files).

**Recommendation:** Low priority. If test files grow beyond 50, consider a shared `seed-for-tests.ts` script.

### 8.4 Coverage Thresholds Not Enforced

**Status:** Vitest coverage is configured (`v8` provider, `text/html/lcov` reporters) but no minimum threshold is set in CI. Coverage reports are generated but not checked.

**Impact:** Coverage can silently regress. The `test:coverage` script exists in `package.json` but is not run in CI.

**Recommendation:** Add `thresholds: { lines: 60, branches: 50, functions: 60, statements: 60 }` to vitest config and a `test:coverage` step in the CI `backend` job.

### 8.5 Local Dev Requires Manual TEST_DATABASE_URL Setup

**Status:** Running integration tests locally requires either Docker (`test:db:up`) or manually configuring `TEST_DATABASE_URL`. There is no automatic fallback.

**Impact:** New contributors may run `pnpm test` and encounter the production DB safety guard error without understanding the setup needed.

**Recommendation:** Add a `scripts/setup-test-db.sh` that automates `docker compose up`, `db:push`, and sets up `.env.test` automatically.

---

## 9. Test Scripts Reference

```bash
# From apps/api/package.json:
pnpm --filter @playmorrow/api test              # vitest run (all specs)
pnpm --filter @playmorrow/api test:watch        # vitest (watch mode)
pnpm --filter @playmorrow/api test:coverage     # vitest run --coverage
pnpm --filter @playmorrow/api test:db:up        # Start postgres-test container
pnpm --filter @playmorrow/api test:db:down      # Stop postgres-test container
pnpm --filter @playmorrow/api test:with-db      # Run tests with isolated DB on :5433

# From apps/web/package.json:
pnpm --filter @playmorrow/web test:e2e          # Playwright (full suite, desktop+mobile)

# Pre-push hook (via simple-git-hooks):
pnpm verify                                      # lint + typecheck + build
```

---

## 10. Summary

| Dimension | Status |
|---|---|
| Backend test files | 33 (all passing) |
| Phase 5 test coverage | 6/6 modules (100%), 50 tests |
| Unit test pattern | `vi.fn()` mocks for PrismaService + ConfigService |
| Integration test pattern | `Test.createTestingModule()` + supertest + real Postgres |
| E2E test files | 6 Playwright suites (desktop + mobile) |
| CI pipeline | 3 parallel jobs (quality, backend, e2e) |
| Test DB isolation | Docker postgres:16 on :5433, ephemeral tmpfs |
| Production DB guard | `vitest.setup.ts` regex check + `ALLOW_PROD_DB_FOR_TESTS` bypass |
| Coverage | Configured but not enforced (no CI threshold) |
| Gaps | Phase 5 E2E, Phase 5 integration tests, coverage thresholds, seed scripts |
