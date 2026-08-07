# Secret Rotation Runbook

**Version:** 1.0 (2026-07-29)
**Owner:** DevOps Team

---

## Overview

Playmorrow has 17 production secrets stored in Fly.io secrets. This document describes how to rotate each one.

---

## Rotation Process (Generic)

```bash
# 1. Generate new value
# For cryptographic secrets:
openssl rand -hex 32

# 2. Set new value in Fly.io
flyctl secrets set SECRET_NAME=<new-value>

# 3. Redeploy to apply
flyctl deploy

# 4. Verify the app starts correctly
curl -f https://playmorrow-api...fly.dev/api/health

# 5. Verify functionality
curl -f https://playmorrow...fly.dev/api/games?pageSize=1

# 6. Deploy Vercel if frontend env vars changed
git push origin main
```

---

## Individual Secrets

| Secret | Type | Rotation Method | Last Rotated | Notes |
|--------|------|----------------|--------------|-------|
| DATABASE_URL | Connection string | Neon dashboard → Settings → Reset password | 2026-08-07 (P0.1.1) | Must update Fly.io + Vercel simultaneously |
| JWT_SECRET | Cryptographic (32 bytes hex) | `openssl rand -hex 32` | 2026-07-28 | Invalidates existing JWTs |
| SESSION_SECRET | Cryptographic (32 bytes hex) | `openssl rand -hex 32` | 2026-07-28 | Invalidates existing sessions |
| CSRF_SECRET | Cryptographic (32 bytes hex) | `openssl rand -hex 32` | 2026-07-28 | Invalidates existing CSRF tokens |
| RESEND_API_KEY | Service key | Resend dashboard → API Keys | — | Create new key, revoke old |
| AWS_ACCESS_KEY_ID | IAM access key | Cloudflare R2 dashboard | 2026-07-29 | Rotate with SECRET_ACCESS_KEY |
| AWS_SECRET_ACCESS_KEY | IAM secret key | Cloudflare R2 dashboard | 2026-07-29 | Rotate with ACCESS_KEY_ID |
| R2_ENDPOINT | URL | Static (does not rotate) | — | Endpoint URL, not a secret |
| S3_BUCKET | Bucket name | Static (does not rotate) | — | Bucket name, not a secret |
| CDN_URL | URL | Static (does not rotate) | — | Public CDN URL |
| STORAGE_PROVIDER | Config value | Static (does not rotate) | — | 'r2' or 'local' |
| VAPID_PUBLIC_KEY | Cryptographic | Generate new VAPID key pair | — | Must update frontend push service |
| VAPID_PRIVATE_KEY | Cryptographic | Generate new VAPID key pair | — | Rotate with PUBLIC_KEY |
| SENTRY_DSN | Service key | Sentry dashboard → Settings → Client Keys | — | Can use same DSN for both client/server |
| NEON_API_KEY | Service key (org) | Neon console → Settings → API keys | 2026-08-07 (P0.1.1) | Old `playmorrow-key` revoked (exposed); replacement `playmorrow-key-v2` stored in gitignored `.env.neon-apikey` |
| WEB_ORIGIN | URL | Static (does not rotate) | — | Changes only with domain migration |
| COOKIE_DOMAIN | Domain | Static (does not rotate) | — | Changes only with domain migration |
| NODE_ENV | Config value | Static (does not rotate) | — | 'production' |

---

## Emergency Rotation (Compromised Secret)

```bash
# 1. Rotate ALL cryptographic secrets
for secret in JWT_SECRET SESSION_SECRET CSRF_SECRET; do
  NEW=$(openssl rand -hex 32)
  flyctl secrets set $secret=$NEW
  echo "$secret rotated"
done

# 2. Rotate cloud credentials (if compromised)
# Cloudflare R2 dashboard → generate new keys
flyctl secrets set AWS_ACCESS_KEY_ID=<new-key>
flyctl secrets set AWS_SECRET_ACCESS_KEY=<new-secret>

# 3. Redeploy
flyctl deploy

# 4. Notify team (see INCIDENT_RESPONSE.md)
```

---

## Schedule

| Rotation Type | Frequency | Next Due |
|---------------|-----------|----------|
| Full key rotation | Annually | 2027-07 |
| Emergency rotation | As needed | — |
| Post-incident rotation | Immediately after any compromise | ✅ Completed 2026-07-28/29 |
