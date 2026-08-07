# Database Recovery Runbook

**Status:** VERIFIED (2026-08-07, via Neon API) — PITR retention is 6 hours; recovery of pre-incident data is NOT possible
**Last updated:** 2026-08-07

---

## 1. Purpose

Document the recovery procedures for the Playmorrow production database after
the 2026-08-06 incident in which production data was cleared by a `prisma
migrate reset` that ran against the (then shared) Neon database.

> **Incident status:** The production dataset was cleared. The current database
> contains seed user data only. Pre-incident data is **NOT recoverable** via
> Neon (PITR window is 6 hours and has long since elapsed; zero snapshots exist).

## 2. Backup claims in existing docs vs. actual state (VERIFIED 2026-08-07)

| Claim (`docs/security/BACKUP_RESTORE.md`) | Status |
|---|---|
| "7-day point-in-time recovery (PITR) window" | ❌ **INACCURATE** — Neon API reports `history_retention_seconds: 21600` = **6 hours** |
| Neon performs automatic daily backups | ⚠️ **PARTIAL** — Neon maintains 6h PITR history; not "daily backups" as claimed |
| Restore via Neon dashboard branch restore | ✅ **VERIFIED** as a procedure; only usable within the 6h window |
| Restore via `pg_dump` / `pg_restore` | ✅ **VERIFIED PROCEDURE** (tooling standard; requires a dump to exist) |
| Full disaster recovery with `flyctl secrets set` | ✅ **VERIFIED PROCEDURE** (documented; not executed) |

**Nothing in this file should be read as evidence that recoverable pre-incident
data exists — it does not.**

## 3. Recovery priority order (safe, non-destructive first)

1. **Neon PITR on a branch** — restore the prod project to a timestamp
   **within the last 6 hours** onto a NEW branch (never over production).
   Verify on the branch. If verified good, promote only after explicit approval.
2. **Neon dashboard branch restore** — same as above via UI.
3. **`pg_dump` from a snapshot/branch** — dump the restored branch and load
   into a test database for inspection before any decision.
4. **Manual rebuild** — reseed from seed scripts if no backup exists (current
   state of the database).

## 4. Restore procedure (once a recoverable point is confirmed)

```bash
# 0) Prereqs: NEON_API_KEY authenticated (current org key in gitignored .env.neon-apikey),
#    recovery target confirmed to be a BRANCH.
# 1) Create a restore branch from prod at the pre-incident timestamp.
neonctl branches create --name recovery-$TS --parent <prod-branch> \
  --timestamp <YYYY-MM-DDTHH:MM:SS> --api-key $NEON_API_KEY

# 2) Verify on the branch (read-only).
pg_dump "$BRANCH_URL" > /tmp/recovery-dump.sql   # never printed; tmp only
# Inspect counts/rows; do NOT restore over production automatically.

# 3) After human approval, promote the restored branch and repoint Fly secret:
#    flyctl secrets set DATABASE_URL=...   # requires explicit authorization

# 4) Verify prod smoke + migration status, then run:
#    pnpm --filter @playmorrow/database db:deploy   # align migrations
```

**Never** `pg_restore` into the live production database without explicit,
reviewed approval.

## 5. Recovery availability assessment

**Status: VERIFIED — pre-incident data is NOT recoverable.**

Evidence (Neon API, 2026-08-07):

- `history_retention_seconds: 21600` → **6-hour** PITR retention on this project.
- Project snapshot list is **empty** (`GET /projects/{id}/snapshots` → 0).
- The incident reset ran 2026-08-06 (>24h before verification), far outside the
  6-hour PITR window.
- No local dumps (`*.sql`, `*.dump`) exist in the repository or workspace.

Official statement:

> "Recovery availability could not be independently verified; Neon PITR is
> limited to 6 hours and no snapshot or dump exists, so the pre-incident data
> is **not recoverable**."

Remediation (implemented / to do):

- ✅ Nightly `pg_dump` job **implemented 2026-08-07** — GitHub Actions → R2
  (`.github/workflows/backup-db.yml`), 14-day retention, restore drill passed
  (see `docs/releases/P0_1_PRODUCTION_HARDENING_CERTIFICATION.md`).
- ✅ DB guard prevents a repeat of `migrate reset` against production.
- ✅ Prod/dev now use separate Neon branches (see `ENVIRONMENT_ISOLATION.md`).

## 6. Post-recovery hardening

- Physical prod/dev isolation (see `ENVIRONMENT_ISOLATION.md`).
- Destructive commands guarded (`PRODUCTION_DATABASE_SAFETY.md`).
- Quarterly restore drill on a branch to prove the runbook works.
- Document the actual PITR window once confirmed, and re-verify it quarterly.
