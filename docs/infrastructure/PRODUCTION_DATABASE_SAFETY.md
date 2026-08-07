# Production Database Safety

**Status:** Live policy
**Last verified:** 2026-08-07

---

## 1. Incident context

On 2026-08-06 the development database was reset with `prisma migrate reset`
as part of a dev-database reconciliation task. Production and development were
discovered to share the **same Neon database** (`neondb` on
`ep-orange-bird-abpuzipk-pooler.eu-west-2.aws.neon.tech`). The reset therefore
cleared the production dataset. This document exists to guarantee that never
happens again, and describes the layered controls now in place.

## 2. What is "production" for the database guard

The safety guard identifies production by the `DATABASE_URL` hostname
(`ep-orange-bird-abpuzipk.eu-west-2.aws.neon.tech` and its `-pooler` variant),
which can be overridden with `PROD_DB_HOST`. It also blocks when
`PLAYMORROW_DB_ROLE=production|prod` or `NODE_ENV=production` is set,
regardless of hostname.

Production **must** be a physically separate Neon database from development
after the isolation remediation. A Neon branch has a different endpoint
hostname, so dev databases are never mistaken for production.

## 3. The guard

`packages/database/scripts/db-guard.mjs` is a zero-dependency Node script run
**before** every database command in `packages/database/package.json` and
`apps/api/package.json`:

| Command | Guarded as | Against production |
|---|---|---|
| `db:migrate` (`prisma migrate dev`) | `migrate-dev` | ❌ blocked |
| `db:push` (`prisma db push`) | `push` | ❌ blocked |
| `db:reset` (`prisma migrate reset`) | `reset` | ❌ blocked |
| `db:seed` / `db:seed` (api) / `seed:model-games` | `seed` | ❌ blocked |
| `db:studio` | `studio` | ⚠️ warning only |
| `db:deploy` (`prisma migrate deploy`) | `deploy` | ✅ allowed (safe) |
| `db:status` / `db:generate` / `migrate diff` | safe | ✅ allowed |

The guard prints only the host and database name — never the connection string
or password. A blocked command exits non-zero with remediation instructions.

### Explicit override

```bash
ALLOW_PROD_DB_OPERATIONS=1 pnpm db:reset   # ONE command, then unset
```

Setting the override is the only way to run a destructive command against
production. It must never remain set in a shell or be added to any `.env` file.
Production deploys never set it.

## 4. Layered controls

1. **Physical isolation** — separate Neon branches for prod/dev (see
   `ENVIRONMENT_ISOLATION.md`).
2. **Hostname guard** — destructive commands auto-blocked when they target the
   prod hostname.
3. **Fail-closed unknown environments** — destructive commands against any host
   that is neither the known prod host nor a known dev/test host (localhost,
   `DEV_DB_HOST`) are **blocked**. An accidental repoint to another Neon/RDS/cloud
   endpoint cannot proceed without an explicit override.
4. **Role guard** — `PLAYMORROW_DB_ROLE=production` blocks even a local/other
   hostname.
5. **Policy** — `DATABASE_MIGRATION_POLICY.md` mandates `migrate deploy` only
   for production.
6. **CI isolation** — GitHub Actions has no production credentials and no Neon
   access (ephemeral Postgres only).
7. **Credentials discipline** — prod `DATABASE_URL` lives only in Fly.io
   secrets; local `.env` files point at dev/test databases.

## 7. Verification checklist (re-run quarterly or after infra changes)

```bash
# Guard blocks production
cd packages/database
node scripts/db-guard.mjs reset; echo "expect exit 1: $?"

# Dev/test allows reset
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/playmorrow_test" \
  node scripts/db-guard.mjs reset; echo "expect exit 0: $?"

# Unknown (fail-closed) host blocks reset
DATABASE_URL="postgresql://u:p@ep-some-unknown-project.eu-west-2.aws.neon.tech/neondb" \
  node scripts/db-guard.mjs reset; echo "expect exit 1: $?"

# Migrations healthy (all environments)
pnpm --filter @playmorrow/database db:status
pnpm --filter @playmorrow/database db:deploy
```

## 8. Recurring risks

- **Bare `prisma` CLI**: invoking `npx prisma migrate reset` (not the guarded
  script) bypasses the guard. Developers must use the packaged scripts.
- **Hostname drift**: if the prod database is ever moved to a different Neon
  project, `PROD_DB_HOST` must be updated before the old hostname is retired.
- **New dev branches**: a newly-created Neon dev branch is an unknown host until
  it is added as `DEV_DB_HOST` (or `PLAYMORROW_DB_ROLE=dev` is set). Destructive
  commands on it will fail closed — by design.
- **`ALLOW_PROD_DB_OPERATIONS` leakage**: CI should assert this variable is
  never set (see `ci.yml`).
