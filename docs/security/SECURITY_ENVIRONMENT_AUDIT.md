# Playmorrow — Environment Variable Security Audit

**Date:** 2026-08-11
**Scope:** All `process.env.*` and `NEXT_PUBLIC_*` variables in the project
**Verdict:** 🟢 **PASS — No secrets exposed to client**

---

## NEXT_PUBLIC_ Variables (Client-Exposed)

| Variable | Default | Classification | Assessment |
|----------|---------|----------------|------------|
| `NEXT_PUBLIC_API_URL` | `/api` | C — CLIENT-SAFE | API path, safe to expose |
| `NEXT_PUBLIC_SITE_URL` | `https://playmorrow.vercel.app` | C — CLIENT-SAFE | Public site URL |
| `NEXT_PUBLIC_SENTRY_DSN` | (from env) | C — CLIENT-SAFE | Sentry DSN is designed for browser exposure |
| `NEXT_PUBLIC_USE_MOCKS` | `false` | C — CLIENT-SAFE | Boolean dev flag |
| `NEXT_PUBLIC_PLAUSIBLE_URL` | `https://plausible.io` | C — CLIENT-SAFE | Public analytics URL |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | `playmorrow.co` | C — CLIENT-SAFE | Domain name |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | (from env) | C — CLIENT-SAFE | VAPID public key — designed to be public per Web Push spec |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` (placeholder) | C — CLIENT-SAFE | Stripe publishable key — designed for browser |

**All 8 `NEXT_PUBLIC_` variables are legitimate public configuration. Zero secrets leaked.**

---

## Server-Side Secrets (Class A — Must Never Be Client-Side)

| Variable | Access Pattern | Status |
|----------|---------------|--------|
| `DATABASE_URL` | ConfigService + `main.ts` required check | ✅ Server-only |
| `JWT_SECRET` | ConfigService | ✅ Server-only |
| `SESSION_SECRET` | ConfigService | ✅ Server-only |
| `CSRF_SECRET` | ConfigService (`getOrThrow` in prod) | ✅ Server-only |
| `RESEND_API_KEY` | ConfigService + raw fallback | ✅ Server-only |
| `AWS_ACCESS_KEY_ID` | ConfigService | ✅ Server-only |
| `AWS_SECRET_ACCESS_KEY` | ConfigService | ✅ Server-only |
| `REDIS_URL` | ConfigService | ✅ Server-only |
| `VAPID_PRIVATE_KEY` | Raw `process.env` | ✅ Server-only |
| `OPENAI_API_KEY` | ConfigService | ✅ Server-only |
| `ANTHROPIC_API_KEY` | ConfigService | ✅ Server-only |
| `STRIPE_SECRET_KEY` | ConfigService | ✅ Server-only |
| `STRIPE_WEBHOOK_SECRET` | ConfigService | ✅ Server-only |
| `SENTRY_AUTH_TOKEN` | ConfigService | ✅ Server-only |
| `GOOGLE_CLIENT_SECRET` | ConfigService | ✅ Server-only |
| `GITHUB_CLIENT_SECRET` | ConfigService | ✅ Server-only |

---

## .env File Protection

| Check | Result |
|-------|--------|
| `.gitignore` pattern | `.env` + `.env.*` excluded, `!.env.example` allowed |
| `.env` files tracked? | **No** — only `.env.example` (4 files) are in git |
| Local `.env` files exist? | **Yes** — gitignored and untracked |
| Sensitive local files permissions? | `.env.backup-*`, `.env.neon-apikey`, `.env.prod-dburl` → `chmod 600` |
| `.env.example` contain real values? | **No** — all placeholders (`change-me-in-production`, `sk-xxx`, `""`, `your_private_key`) |
| Any `.env` ever committed? | **No** — verified across all branches via `git log --all --diff-filter=A` |

---

## Production Startup Guards (`main.ts:56-96`)

The API fails fast at startup if required env vars are missing:
- `DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET`, `CSRF_SECRET`
- `RESEND_API_KEY`, `WEB_ORIGIN`, `STORAGE_PROVIDER`, `S3_BUCKET`, `CDN_URL`
- Conditional: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `R2_ENDPOINT` (only if S3/R2 storage)

**Prevents running with missing critical configuration.**

---

## Notes

1. **`process.env` bypass**: ~50% of backend env lookups use raw `process.env` instead of `ConfigService`. No security impact — all server-side. Minor architectural inconsistency.
2. **Production URL exposure**: `playmorrow-api-aged-mountain-9542.fly.dev` hardcoded in `next.config.ts`, `middleware.ts`, and `sitemap.ts`. Already publicly discoverable via DNS. Low risk.
3. **No credential files committed**: Zero `.pem`, `.key`, `.crt`, `.p12`, `.pfx`, or `credentials.*` files in git history.

**Overall: No environment secret is exposed to the client. All sensitive variables remain server-side.**
