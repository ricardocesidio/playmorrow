# Database Migration Policy

**Status:** Live policy
**Scope:** All Prisma schema changes on all Playmorrow databases (production, development, test).
**Last verified:** 2026-08-07

---

## 1. The one rule

**Production migrations run only `prisma migrate deploy`** (via `pnpm --filter @playmorrow/database db:deploy`).

Production **never** runs:

- `prisma migrate reset`
- `prisma migrate dev`
- `prisma db push`
- `prisma db seed`
- any manual `DROP`/`TRUNCATE`/destructive SQL

Every destructive command is blocked automatically by the safety guard
(`packages/database/scripts/db-guard.mjs`) when `DATABASE_URL` points at the
production database (see `PRODUCTION_DATABASE_SAFETY.md`). A migration or DDL
change is "destructive" if it can drop or irreversibly alter data (drop
column/table, reset, push with `--accept-data-loss`, seed, delete).

## 2. Official workflows

### New schema change (development)

```bash
# 1. Edit packages/database/prisma/schema.prisma
# 2. Create the migration against the DEV database (guard refuses prod):
pnpm db:migrate                 # == prisma migrate dev (guarded)
# 3. Review the generated migration.sql
# 4. Run the test suite against the local test DB:
pnpm --filter @playmorrow/api test:db:up
pnpm --filter @playmorrow/api test:with-db
```

### Deploy a schema change (production)

```bash
# 1. Review migration.sql in packages/database/prisma/migrations/<name>/
# 2. Deploy the API image (migration files ship with the image), then run:
pnpm --filter @playmorrow/database db:deploy   # == prisma migrate deploy (guarded, safe)
# 3. Verify:
pnpm --filter @playmorrow/database db:status   # == prisma migrate status
pnpm --filter @playmorrow/database db:seed     # NEVER on production — guard blocks it
```

`db:deploy` applies only **pending** migrations and records them in
`_prisma_migrations`. It never replays applied migrations.

## 3. Migrations are immutable once deployed

- Once a migration has run on any non-disposable database, **do not edit its
  `migration.sql`**. If a fix is needed, add a NEW migration.
- Editing an already-applied migration changes its SHA-256 checksum; `migrate
  deploy` will then report a checksum mismatch for that migration in every
  environment, blocking future deploys.
- Exception: a migration that was **never** deployed to a non-disposable
  database may be edited (this happened for `20260806000000_add_missing_enum_types`,
  which was fixed before the dev/prod database was reconciled).

## 4. The Neon advisory-lock workaround (documented)

### Why normal migration execution can fail on Neon

Neon's **pooled** endpoint (`...-pooler.neon.tech`) routes traffic through
PgBouncer-style transaction pooling. `prisma migrate deploy`, `migrate dev`,
and `migrate resolve` acquire a PostgreSQL **session advisory lock**
(`pg_advisory_lock(72707369)`). Session-level features cannot be held across
pooled connections, so the acquire call times out:

```
P1002 — Timed out trying to acquire a postgres advisory lock (SELECT pg_advisory_lock(72707369)).
```

On the **direct** endpoint (same host without `-pooler`) the Neon network proxy
may still block the advisory lock on some projects/regions, so `migrate deploy`
can also time out there.

### What is allowed

| Operation | Command | Allowed | Notes |
|---|---|---|---|
| Apply pending migrations | `prisma migrate deploy` | ✅ Prefer | Fails with P1002 on blocked endpoints |
| Inspect state | `prisma migrate status` | ✅ | Does not need the advisory lock |
| Diff / drift check | `prisma migrate diff` | ✅ | Does not need the advisory lock |
| Apply a single migration SQL | `prisma db execute --file ...` | ✅ Fallback | Runs in one transaction |
| Record an applied migration | manual `INSERT INTO "_prisma_migrations"` | ✅ Fallback | Only after `db execute` succeeded |
| Reset / push / dev | any | ❌ | Dev/test only, via the guard |

### The `db execute` + checksum-record procedure (fallback)

When `migrate deploy` times out, apply the migration manually and record it:

```bash
# 1. Apply the migration SQL (single transaction; rollback on any failure)
cd packages/database
export DATABASE_URL="<direct-or-pooled-url>"
pnpm exec prisma db execute --url "$DATABASE_URL" \
  --file prisma/migrations/<migration-name>/migration.sql

# 2. Record it so migrate status stays clean (checksum = SHA-256 of the file)
CHK=$(shasum -a 256 prisma/migrations/<migration-name>/migration.sql | cut -d' ' -f1)
pnpm exec prisma db execute --url "$DATABASE_URL" --stdin <<SQL
INSERT INTO "_prisma_migrations" ("id","checksum","finished_at","migration_name","logs","rolled_back_at","started_at","applied_steps_count")
VALUES (gen_random_uuid(), '$CHK', now(), '<migration-name>', NULL, NULL, now(), 1);
SQL

# 3. Verify state and drift
pnpm exec prisma migrate status                 # "up to date"
pnpm exec prisma migrate diff --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma    # "No difference detected"
```

**Safety rules for the fallback:**

- Run `db execute` only after code review of `migration.sql`.
- Insert into `_prisma_migrations` **only if** `db execute` fully succeeded
  (the whole file runs in one transaction, so a failure means nothing applied).
- Never insert a checksum for SQL that was not actually applied — `migrate
  deploy` would then skip it forever.
- Local Postgres (Docker `postgres-test`/`postgres-dev`, CI container) supports
  advisory locks, so the fallback is only needed for Neon.

## 5. Rollback / recovery

Schema changes are **not** rolled back by running an old migration. Rollback
means:

1. **New corrective migration** — the standard path (reverse the DDL).
2. **Neon PITR / branch restore** — restore the database to a timestamp before
   the bad migration on a branch, verify, then promote. See
   `DATABASE_RECOVERY_RUNBOOK.md`.
3. `prisma migrate resolve --rolled-back <migration>` marks a migration as not
   applied in an environment (used only when a failed migration left no
   partial state).

Destructive rollbacks against production require
`ALLOW_PROD_DB_OPERATIONS=1` AND a reviewed, explicit plan (never automatic).

## 6. Environment matrix

| Environment | Database | Command | Guard |
|---|---|---|---|
| Production | Neon `neondb` (prod) | `db:deploy` only | blocks everything else |
| Staging | Neon staging branch | `db:deploy` | blocks reset/push/dev/seed |
| Development | Neon dev branch (or local `postgres-dev`) | `db:migrate`, `db:push`, `db:reset`, `db:seed` | allowed (non-prod) |
| Test | local `postgres-test` :5433 / CI container | `db:deploy` | allowed |
| CI | ephemeral Postgres 16 container | `db:deploy` | allowed |

See `ENVIRONMENT_ISOLATION.md` for connection targets.
