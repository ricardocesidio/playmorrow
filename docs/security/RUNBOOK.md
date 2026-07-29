# Operations Runbook

**Version:** 1.0 (2026-07-29)
**Owner:** Platform Team

---

## Deploy API

```bash
cd apps/api
flyctl deploy
```

## Deploy Frontend

Push to `main` — Vercel auto-deploys.

## Rollback API

```bash
# List recent releases
flyctl releases

# Deploy a specific release
flyctl deploy --image registry.fly.io/playmorrow-api-aged-mountain-9542@sha256:<hash>
```

## Rollback Frontend

Vercel dashboard → Deployments → Find previous deployment → "Promote to Production"

## View Logs

```bash
# API logs (recent)
flyctl logs -a playmorrow-api-aged-mountain-9542

# API logs (streaming)
flyctl logs -a playmorrow-api-aged-mountain-9542 -t

# Vercel logs
# Vercel dashboard → Logs
```

## Health Checks

```bash
# API health
curl -f https://playmorrow-api-aged-mountain-9542.fly.dev/api/health

# Frontend
curl -f -o /dev/null -w "%{http_code}" https://playmorrow.vercel.app/

# Database
curl -s https://playmorrow-api-aged-mountain-9542.fly.dev/api/health | grep -q "ok"
```

## Scale

```bash
# Current: 2 machines
flyctl scale count playmorrow-api-aged-mountain-9542 2

# Scale up for load
flyctl scale count playmorrow-api-aged-mountain-9542 5

# Scale down
flyctl scale count playmorrow-api-aged-mountain-9542 1
```

## Database Migrations

```bash
# Apply pending migrations
cd packages/database
DATABASE_URL="<production-url>" npx prisma migrate deploy

# Check migration status
DATABASE_URL="<production-url>" npx prisma migrate status
```

## Restart

```bash
# Restart all machines
flyctl apps restart playmorrow-api-aged-mountain-9542
```
