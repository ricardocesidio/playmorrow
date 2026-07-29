# Backup Strategy

**Last updated:** 2026-07-29

## Database (Neon PostgreSQL)

Neon provides automatic backups with point-in-time recovery:

- **Automated daily backups:** Enabled by default on all Neon plans
- **Point-in-time recovery (PITR):** 7-day window for the free tier, longer on paid plans
- **How to restore:** https://console.neon.tech → project → Branches → Restore
- **Manual backup:**
  ```bash
  pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql
  ```
- **Test restore (recommended monthly):**
  ```bash
  # Create a new branch in Neon dashboard
  # Get its DATABASE_URL
  pg_restore -d "$NEW_URL" backup.sql
  # Run queries to verify data integrity
  psql "$NEW_URL" -c "SELECT COUNT(*) FROM games;"
  psql "$NEW_URL" -c "SELECT COUNT(*) FROM users;"
  ```

## File Uploads (Cloudflare R2)

- **Storage:** Cloudflare R2 (S3-compatible, bucket `playmorrow-uploads`)
- **Public URL pattern:** `https://pub-8e4503584d934d1b8cd18803fdc34ecc.r2.dev/<key>`
- **Versioning:** R2 does NOT support bucket versioning on the free plan. Objects are overwritten on upload.
- **Recommended:** Set up lifecycle rules or periodic sync to backup R2 contents to a secondary bucket.
- **Manual backup:**
  ```bash
  # Requires AWS CLI configured with R2 credentials
  aws s3 sync s3://playmorrow-uploads ./uploads-backup/ --endpoint-url https://<r2-endpoint>
  ```

## Logs Retention

| Source | Retention | Access |
|--------|-----------|--------|
| Fly.io (API) | ~7 days (free tier) | `flyctl logs` or Fly.io dashboard |
| Vercel (frontend) | ~30 days (pro tier) | Vercel dashboard → Logs |
| GitHub Actions | 90 days | GitHub → Actions tab |
| Neon (database) | 7 days PITR | Neon dashboard |

**Note:** Logs on the free tier have limited retention. For production/audit needs,
export logs periodically to persistent storage (e.g., R2):
```bash
flyctl logs -a playmorrow-api-aged-mountain-9542 > fly-logs-$(date +%Y%m%d).log
```

## Recovery Runbook

1. **Database corruption/accident:**
   - Go to Neon dashboard → Branches → Create branch from point in time
   - Get new DATABASE_URL
   - `flyctl secrets set DATABASE_URL=<new-url>`
   - `flyctl deploy`
2. **File loss:**
   - R2 is the primary — if files are deleted, they're gone (no versioning)
   - Restore from manual backup: `aws s3 sync ./uploads-backup/ s3://playmorrow-uploads/ --endpoint-url <r2-endpoint>`
3. **Full disaster (region outage):**
   - Neon has multi-region replicas on paid plans
   - Vercel deploys globally
   - Fly.io machines can be redeployed in another region
