# Backup & Restore Runbook

**Version:** 1.1 (2026-08-07)
**Owner:** Platform Team

---

## Database (Neon PostgreSQL)

### Automated Backups (VERIFIED 2026-08-07 via Neon API)

**PITR retention: 6 hours** (`history_retention_seconds: 21600`) on the current
plan. This is a **correction** to the earlier "7-day PITR" claim, which was
inaccurate and is **not** supported by the Neon API for this project.

Consequences:

- Data can be recovered to any point within the **last 6 hours** only.
- Older data is **not** recoverable via Neon PITR or snapshots (zero snapshots
  exist on the project).
- After the 2026-08-06 incident (which cleared production data), pre-incident
  data is **beyond the 6-hour window and NOT recoverable via Neon**.
- Verify the retention window on the Neon dashboard (Billing → plan) and
  re-check `history_retention_seconds` quarterly; free/paid plan changes alter it.
- If longer retention is required, upgrade the Neon plan (e.g. Launch tier with
  extended PITR) — a documented decision, not implemented.

### Manual Backup
```bash
pg_dump "$DATABASE_URL" > playmorrow-backup-$(date +%Y%m%d).sql
```

### Automated Nightly Backup (VERIFIED 2026-08-07)

**Implemented:** nightly `pg_dump` → Cloudflare R2 (off-machine), run by the
`Nightly Database Backup` GitHub Actions workflow (`.github/workflows/backup-db.yml`)
at 02:00 UTC daily (+ manual `workflow_dispatch`).

- **Read-only role:** `playmorrow_backup` (SELECT-only grants, direct
  non-pooler host). The backup credential cannot write — it is the single,
  deliberate exception to "no production credentials in CI" and is documented
  in `docs/infrastructure/PRODUCTION_DATABASE_SAFETY.md`.
- **Object layout:** `s3://<bucket>/db-backups/<YYYYMMDDTHHMMSSZ>.dump`
  + `.sha256` checksum + `MANIFEST.txt` (source, timestamp, sha, size).
- **Retention:** 14 days (configurable `KEEP_DAYS`), pruned by the workflow.
- **Integrity:** `pg_restore --list` runs before upload; a full restore test
  (dump → disposable Postgres 18 → 65 tables, row counts match) was performed
  2026-08-07 and is documented in `docs/releases/P0_1_PRODUCTION_HARDENING_CERTIFICATION.md`.
- **Neon-only schema excluded:** `--exclude-schema=neon_auth` (Neon-managed
  built-in auth; not Playmorrow data).
- **Manual trigger:** `gh workflow run backup-db.yml --repo ricardocesidio/playmorrow`.
- **Secrets:** `BACKUP_DATABASE_URL`, `R2_ENDPOINT`, `R2_BUCKET`,
  `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`. Local bootstrap:
  `scripts/setup-backup-secrets.sh <backup-url-file> <fly-app>` (writes the
  gitignored `.env.backup-secrets` + prints the `gh secret set` commands).
- **Ad-hoc local dump:** `BACKUP_DATABASE_URL=... packages/database/scripts/db-backup.sh [--upload]`.

### Restore Procedure

#### Option 1: Point-in-Time Recovery (Neon Dashboard/API)
Only works for timestamps **within the last 6 hours**.
1. Go to https://console.neon.tech → project → Branches
2. Click "Restore" → select timestamp (or via API:
   `POST /projects/{id}/branches` with `parent_id` + `parent_timestamp`)
3. Restore to a **NEW branch** (never over production directly)
4. Verify data on the branch, then promote/repoint after approval
5. Copy new DATABASE_URL

#### Option 2: Manual Restore (from pg_dump)
```bash
# Create a new database
createdb playmorrow_restore

# Restore from dump
psql playmorrow_restore < playmorrow-backup-20260728.sql

# Verify data
psql playmorrow_restore -c "SELECT COUNT(*) FROM games;"
psql playmorrow_restore -c "SELECT COUNT(*) FROM users;"
```

#### Option 3: Full Disaster Recovery
```bash
# 1. Restore database (PITR ≤6h, or latest pg_dump)
# Get new DATABASE_URL from Neon dashboard (point-in-time or recent backup)

# 2. Set new URL in Fly.io
flyctl secrets set DATABASE_URL=<new-url>

# 3. Redeploy API
flyctl deploy

# 4. Verify
curl -f https://playmorrow-api...fly.dev/api/health
curl -f https://playmorrow...fly.dev/api/games?pageSize=1
```

> ⚠️ `DATABASE_URL` (with its embedded password) must never be committed or
> printed. Use `flyctl secrets set` and read-only extraction only.

---

## File Uploads (Cloudflare R2)

### Backup
```bash
# Requires AWS CLI configured with R2 credentials
aws s3 sync s3://playmorrow-uploads ./uploads-backup/ \
  --endpoint-url https://<r2-endpoint>
```

### Restore
```bash
aws s3 sync ./uploads-backup/ s3://playmorrow-uploads/ \
  --endpoint-url https://<r2-endpoint>
```

**Note:** R2 does not support bucket versioning on the free plan. Objects are overwritten on upload.

---

## Recovery Testing Schedule

| Test | Frequency | Status |
|------|-----------|--------|
| Database restore to Neon branch | Quarterly | ⏳ Not yet performed (PITR verified ≤6h) |
| Nightly pg_dump to off-machine storage | Daily | ✅ **Implemented 2026-08-07** — GitHub Actions → R2 (14-day retention) |
| Full restore drill (pg_dump → disposable PG) | Verified 2026-08-07 | ✅ 65/65 tables, row counts match |
| R2 backup sync | Monthly | ⏳ Manual full-bucket sync not yet scheduled |

---

## References
- `docs/BACKUP.md` — Backup strategy overview
- `docs/security/INCIDENT_RESPONSE.md` — Incident response playbook
- `docs/security/SECRET_ROTATION.md` — Secret rotation procedures
