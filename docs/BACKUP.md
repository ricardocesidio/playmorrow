# Backup Strategy

## Database
- Neon PostgreSQL handles automated daily backups
- Point-in-time recovery available (7 days)
- Manual backup: `pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql`

## File Uploads
- Currently stored on local disk (Render ephemeral storage)
- **TODO:** Migrate to Cloudflare R2 or AWS S3 with bucket versioning

## Recommended Production Setup
- Scheduled pg_dump via cron or GitHub Actions
- Backup to cloud storage (R2/S3)
- Test restore monthly
