# Playmorrow — Project Overview for Claude

**Status:** Beta • 847+ commits • Enterprise Audit: 76/100
**Frontend:** https://playmorrow.vercel.app (Vercel) — ✅ Monitorado via UptimeRobot (5min)
**Backend:** https://playmorrow-api-aged-mountain-9542.fly.dev/api/health (Fly.io) — ✅ Monitorado via UptimeRobot (5min)
**Storage:** Cloudflare R2 (uploads públicos)
**DB:** PostgreSQL (Neon)

---

## Evidências de Verificação (última rodada)

```bash
# CSP confirmado — sem Railway, com Fly.io
$ curl -sI https://playmorrow.vercel.app/ | grep content-security-policy
content-security-policy: ... connect-src 'self' https://playmorrow-api-aged-mountain-9542.fly.dev ...

# UptimeRobot — ambos Up
# - https://playmorrow.vercel.app → 200, checking every 5min
# - https://playmorrow-api-aged-mountain-9542.fly.dev/api/health → 200, checking every 5min
```

---

## Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 15 (App Router) + React 19 + Tailwind CSS v4 + TanStack Query |
| Backend | NestJS + TypeScript (porta 4000) |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Auth | Session-based (httpOnly cookies) + OAuth (Google, GitHub) |
| Security | CSRF HMAC global, CSP nonce, argon2id, rate limiting, DOMPurify |
| Storage | Cloudflare R2 (S3-compatible, bucket público) |
| Monorepo | pnpm workspaces + Turborepo |
| Deploy | Vercel (frontend) + Fly.io (API) |
| Monitor | UptimeRobot (2 monitores, 5min) + GitHub Actions + script local |

## Estrutura do Monorepo

```
playmorrow/
├── apps/
│   ├── web/          # Next.js frontend (73 rotas)
│   │   ├── app/      # App Router pages
│   │   └── components/  # Shared components
│   └── api/          # NestJS backend (37 módulos, 162 rotas)
│       └── src/
│           ├── auth/, common/, games/, studios/, devlogs/,
│           ├── feed/, comments/, notifications/, analytics/,
│           ├── goals/, support/, help/, verification/,
│           └── upload/ (R2)
├── packages/
│   └── database/     # Prisma schema (51 modelos)
└── docs/
    ├── ENTERPRISE_AUDIT.md   # Auditoria final (76/100)
    └── PHASE1_FINAL_VERIFICATION_v3.md  # Relatório final
```

## URLs Públicas

| Serviço | URL |
|---------|-----|
| Frontend | https://playmorrow.vercel.app |
| API Health | https://playmorrow-api-aged-mountain-9542.fly.dev/api/health |
| R2 Bucket | https://pub-8e4503584d934d1b8cd18803fdc34ecc.r2.dev |

## Configuração de Produção

Todas as variáveis no Fly.io secrets. Rotacionadas em 28/07 após incidente.

## Segurança

- **CSRF:** HMAC-SHA256 stateless, global APP_GUARD ✅
- **CSP:** Nonce-based, `connect-src` aponta para Fly.io (sem Railway) ✅
- **Rate limit:** 60/min global, 5/min register, 10/min login ✅
- **Upload:** MIME + magic bytes + dimensão (4096px) + 20MB ✅
- **Pre-commit hook:** Bloqueia `JWT_SECRET=`, `SESSION_SECRET=`, `CSRF_SECRET=`, `REDACTED_AWS_SECRET=` em texto claro ✅
- **Monitoramento:** UptimeRobot (API + Frontend, 5min) ✅

## Features (5 Milestones)

M1: Suporte | M2: Help Center | M3: Analytics | M3.5: Intelligence (Event Bus, Goals) | M4: Verification (6 tiers, Trust Score)

## Para Desenvolvimento Local

```bash
pnpm install && pnpm dev
pnpm typecheck        # 6/6
pnpm --filter @playmorrow/web lint  # 0 errors
pnpm --filter @playmorrow/api test  # 263 pass, requer TEST_DATABASE_URL
```
