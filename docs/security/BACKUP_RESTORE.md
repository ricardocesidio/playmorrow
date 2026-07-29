# Backup & Restore Runbook

**Version:** 1.0 (2026-07-29)
**Owner:** Platform Team

---

## Database (Neon PostgreSQL)

### Automated Backups
Neon performs automated daily backups with 7-day point-in-time recovery (PITR).

### Manual Backup
```bash
pg_dump "$DATABASE_URL" > playmorrow-backup-$(date +%Y%m%d).sql
```

### Restore Procedure

#### Option 1: Point-in-Time Recovery (Neon Dashboard)
1. Go to https://console.neon.tech → project → Branches
2. Click "Restore" → select timestamp
3. Wait for branch creation (~1-5min)
4. Copy new DATABASE_URL

#### Option 2: Manual Restore
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
# 1. Restore database
# Get new DATABASE_URL from Neon dashboard (point-in-time or recent backup)

# 2. Set new URL in Fly.io
flyctl secrets set DATABASE_URL=<new-url>

# 3. Redeploy API
flyctl deploy

# 4. Verify
curl -f https://playmorrow-api...fly.dev/api/health
curl -f https://playmorrow...fly.dev/api/games?pageSize=1
```

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
| Database restore to Neon branch | Quarterly | ⏳ Not yet performed |
| Full recovery drill (DB + API) | Bi-annual | ⏳ Not yet performed |
| R2 backup sync | Monthly | ⏳ Not yet performed |

---

## References
- `docs/BACKUP.md` — Backup strategy overview
- `docs/security/INCIDENT_RESPONSE.md` — Incident response playbook
- `docs/security/SECRET_ROTATION.md` — Secret rotation procedures
