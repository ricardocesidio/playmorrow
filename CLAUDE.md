# Playmorrow — Project Overview for Claude

**Status:** Beta • 911+ commits • M5 code entregue • 272 tests (19 files)
**Frontend:** https://playmorrow.vercel.app (Vercel) — ✅ UptimeRobot (5min)
**Backend:** https://playmorrow-api-aged-mountain-9542.fly.dev/api/health (Fly.io) — ✅ UptimeRobot (5min)
**Storage:** Cloudflare R2 (uploads públicos)
**DB:** PostgreSQL (Neon)

**⚠️ NOT enterprise-certified.** `docs/ENTERPRISE_AUDIT.md` veredito: 76/100, 4 itens críticos não resolvidos. Não usar claim "76/100" como selo de aprovação.

---

## Pendências Críticas

| # | Item | Status | Quem faz |
|---|------|--------|----------|
| 1 | **Domínio próprio** (playmorrow.com) — Blocking for public launch | 🔴 Não comprado | Equipe |
| 2 | **E2E Tests** — 7 spec files, build timeout nesta máquina | 🔴 Não executado | Equipe (CI) |
| 3 | **3670e91 no git** — R2 env vars ainda no histórico (já rotacionadas, sem risco ativo) | 🔴 Não reescrito | Equipe (git-filter-repo) |
| 4 | **Secrets scanning em CI** — gitleaks workflow criado | 🟡 Não testado | Equipe |

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

## Features

| Milestone | Foco | Status |
|-----------|------|--------|
| M1 | Support Center | ✅ |
| M2 | Help Center | ✅ |
| M3 | Studio Analytics | ✅ |
| M3.5 | Intelligence (Event Bus, Goals) | ✅ |
| M4 | Verification (6 tiers, Trust Score) | ✅ |
| **M5** | **Discovery Platform** | **✅ Código entregue** |

### Milestone 5 — Discovery Platform

| Sub-fase | Entregue | Detalhes |
|----------|----------|----------|
| 5.1 — Recommendation Engine | ✅ | 5 scorers (tag, follow, trending, wishlist, interaction), API com cursor pagination, explainability, cache in-memory Redis-ready |
| 5.2 — Search 2.0 | ✅ | 6 filtros (genre, status, tag, engine, isFree), 4 sorts, full-text |
| 5.3 — Discover Page | ✅ | 3 seções (Trending, Popular, Newest) com dados reais da API |
| 5.4 — Similar Games + Homepage | ✅ | Similar Games na game detail, Trending Now convertido para Server Component (SSR), Feed com filtros |

Verificação completa: `docs/MILESTONE5_VERIFICATION_v2.md`

## Estrutura do Monorepo

```
playmorrow/
├── apps/
│   ├── web/          # Next.js frontend (73 rotas)
│   │   ├── app/      # App Router pages
│   │   └── components/  # Shared components
│   └── api/          # NestJS backend (37+ módulos, 162+ rotas)
│       └── src/
│           ├── auth/, common/, games/, studios/, devlogs/,
│           ├── feed/, comments/, notifications/, analytics/,
│           ├── goals/, support/, help/, verification/,
│           ├── recommendations/  # M5: Recommendation Engine
│           ├── upload/ (R2)
│           └── search/  # M5: Search 2.0
├── packages/
│   └── database/     # Prisma schema (51 modelos)
└── docs/
    ├── ENTERPRISE_AUDIT.md   # Auditoria — NOT enterprise-certified
    ├── MILESTONE5_VERIFICATION_v2.md
    └── PHASE1_FINAL_VERIFICATION_v3.md
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
- **Secrets scanning (CI):** Workflow gitleaks criado (`.github/workflows/gitleaks.yml`) — não testado
- **Monitoramento:** UptimeRobot (API + Frontend, 5min) ✅

## Para Desenvolvimento Local

```bash
pnpm install && pnpm dev
pnpm typecheck        # 6/6
pnpm --filter @playmorrow/web lint  # 0 errors
pnpm --filter @playmorrow/api test  # 272 pass, requer TEST_DATABASE_URL
```
