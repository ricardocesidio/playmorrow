# Environment Isolation

**Status:** Target architecture (implemented as of the isolation remediation)
**Last verified:** 2026-08-07

---

## 1. Target architecture

```
Production  → Neon project `playmorrow` (database neondb)         [prod-only]
Development → Neon branch of the prod project                     [dev-only]
Staging     → Neon branch of the prod project (later)             [staging-only]
Test        → local Postgres :5433 / ephemeral CI Postgres 16     [disposable]
```

Every Neon branch has its own endpoint hostname, so no two environments share
a connection string and the safety guard can distinguish them by hostname.

## 2. Before (incident state)

| Environment | Database target | Problem |
|---|---|---|
| Production (Fly.io secret) | Neon `neondb` @ `ep-orange-bird-abpuzipk-pooler` | **Shared with dev** |
| Development (`apps/api/.env`) | Same Neon `neondb` | **Shared with prod** |
| CI | ephemeral Postgres 16 container | Isolated ✅ |
| Test | local Postgres :5433 | Isolated ✅ |
| Staging | none (render.yaml scaffold only) | Not deployed |

## 3. Environment → database matrix (after)

| Environment | `DATABASE_URL` target | Guarded by |
|---|---|---|
| Production (Fly.io secret) | Neon prod `neondb` | `PROD_DB_HOST` + role |
| Development (`apps/api/.env`, root `.env`) | Neon dev branch | hostname ≠ prod |
| Staging (future) | Neon staging branch | role `staging` |
| Test (`TEST_DATABASE_URL`) | localhost:5433 `playmorrow_test` | hostname localhost |
| CI | localhost:5432 `playmorrow_test` container | hostname localhost |

## 4. Who can reach production

| Actor | Access to prod DB? | Evidence |
|---|---|---|
| Fly.io API (prod runtime) | ✅ Yes (only consumer) | `DATABASE_URL` secret |
| Vercel (frontend) | ❌ No DB code in `apps/web` | grep: zero `DATABASE_URL` refs |
| GitHub Actions | ❌ No prod secrets, no Neon access | workflows use ephemeral Postgres |
| Local dev machine | ❌ (dev `.env` → dev branch) | post-isolation |
| `neonctl` (operator) | ✅ via API key | credentials required to operate |

## 5. CI/CD isolation

- `ci.yml` provisions an ephemeral Postgres 16 service container and sets
  `TEST_DATABASE_URL`/`DATABASE_URL` to it. It never references Neon.
- No workflow deploys to Fly.io or sets production secrets.
- `smoke-test.yml` and `uptime-check.yml` only `curl` public URLs.
- Deploys are manual (`flyctl deploy`) by an authenticated operator, using the
  Fly app's own secrets.

## 6. Env variable references (no values)

| Env file / store | `DATABASE_URL` present | Target |
|---|---|---|
| `.env` (root) | yes | dev branch |
| `apps/api/.env` | yes | dev branch |
| `apps/web/.env.local` | no | n/a (frontend) |
| `packages/database/.env` | no (shell env used) | n/a |
| Fly.io secrets (`DATABASE_URL`) | yes | prod |
| Vercel env | not verifiable locally | n/a (no DB) |

## 7. Deferred

- **Staging environment**: scaffold exists in `render.yaml`
  (`playmorrow-api-staging`), no Neon staging branch yet. When created, its
  `DATABASE_URL` must target a dedicated branch and `PLAYMORROW_DB_ROLE=staging`.
- **Paid Neon plan**: if ever needed, a separate Neon project gives even
  stronger isolation (separate credentials + branch protection).
