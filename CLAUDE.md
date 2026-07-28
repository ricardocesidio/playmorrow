# Playmorrow — Project Overview for Claude

## O que é
Playmorrow é uma plataforma social de descoberta de jogos indie. Estúdios compartilham devlogs, roadmaps e comunidades; players descobrem jogos antes do lançamento.

**Status:** Beta • 846+ commits • Enterprise Audit: 76/100
**Frontend:** https://playmorrow.vercel.app (Vercel)
**Backend:** https://playmorrow-api-aged-mountain-9542.fly.dev (Fly.io, Amsterdam)
**Storage:** Cloudflare R2 (uploads públicos)
**DB:** PostgreSQL (Neon)

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
| Monitor | GitHub Actions (5min cron) + script local |

## Estrutura do Monorepo

```
playmorrow/
├── apps/
│   ├── web/          # Next.js frontend
│   │   ├── app/      # App Router pages (73 rotas)
│   │   └── components/  # Componentes compartilhados
│   └── api/          # NestJS backend (37 módulos, 162 rotas)
│       └── src/
│           ├── auth/        # Auth, OAuth, JWT
│           ├── common/      # Guards, decorators, EventBus
│           ├── games/       # CRUD de jogos
│           ├── studios/     # CRUD de estúdios
│           ├── devlogs/     # Devlogs com editor rich text
│           ├── feed/        # Feed engine + cursor pagination
│           ├── comments/    # Comentários e reações
│           ├── notifications/  # Notificações SSE + push + email
│           ├── analytics/   # Event tracking + dashboards
│           ├── goals/       # Metas + achievements
│           ├── support/     # Sistema de tickets
│           ├── help/        # Central de ajuda CMS
│           ├── verification/ # Verificação de estúdio
│           └── upload/      # Upload com R2
├── packages/
│   └── database/     # Prisma schema + migrations
└── docs/
    ├── handoff/      # Documentos de handoff históricos
    └── PHASE1_FINAL_VERIFICATION_v2.md  # Relatório final
```

## Features (5 Milestones)

### M1: Suporte — Tickets, admin queue, email
### M2: Central de Ajuda — CMS, categorias, busca full-text
### M3: Analytics — Event tracking, dashboards recharts
### M3.5: Inteligência — Event Bus, Activity Timeline, Goals, Achievements, Health Score
### M4: Verificação — 6 tiers, Trust Score, Company Profile, Press Kit, Brand Kit

## URLs Públicas

| Serviço | URL |
|---------|-----|
| Frontend | https://playmorrow.vercel.app |
| API Health | https://playmorrow-api-aged-mountain-9542.fly.dev/api/health |
| R2 Bucket | https://pub-8e4503584d934d1b8cd18803fdc34ecc.r2.dev |

## Configuração de Produção

| Variável | Onde está |
|----------|-----------|
| `JWT_SECRET` | Fly.io secrets (rotacionado 28/07) |
| `SESSION_SECRET` | Fly.io secrets (rotacionado 28/07) |
| `CSRF_SECRET` | Fly.io secrets (rotacionado 28/07) |
| `DATABASE_URL` | Fly.io secrets (Neon) |
| `REDACTED_STORAGE_PROVIDER` | `r2` no Fly.io |
| `REDACTED_AWS_KEY` | Fly.io secrets (R2) |
| `REDACTED_AWS_SECRET` | Fly.io secrets (R2) |
| `REDACTED_R2_ENDPOINT` | `https://6b62141bc0748171281c4ca9cbc53c4d.r2.cloudflarestorage.com` |
| `CDN_URL` | `https://pub-8e4503584d934d1b8cd18803fdc34ecc.r2.dev` |
| `REDACTED_S3_BUCKET` | `playmorrow-uploads` |
| `VAPID_PUBLIC_KEY` | Fly.io secrets |
| `VAPID_PRIVATE_KEY` | Fly.io secrets |
| `SENTRY_DSN` | Fly.io secrets |
| `RESEND_API_KEY` | Fly.io secrets |

## Segurança

- **CSRF:** HMAC-SHA256 stateless, global APP_GUARD
- **CSP:** Nonce-based no middleware Next.js
- **Rate limit:** 60/min global, 5/min register, 10/min login
- **Upload:** MIME + magic bytes + dimensão (4096px) + 20MB
- **Pre-commit hook:** Bloqueia secrets em texto claro no git

## Regra de Segurança — Secrets

**Nenhum documento, relatório ou resposta deve conter valores reais de secret.** Nem truncados. Sempre placeholder + referência a onde o valor real está.

## Para Desenvolvimento Local

```bash
pnpm install
pnpm dev              # api:4000 + web:3000 em paralelo
pnpm typecheck        # typecheck dos 3 pacotes
pnpm --filter @playmorrow/web lint
pnpm --filter @playmorrow/api test  # requer TEST_DATABASE_URL local
```
