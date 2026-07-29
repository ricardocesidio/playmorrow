# Playmorrow — Project Overview for Claude

**Status:** Beta • 930+ commits • M5: **em progresso (9/15 itens verificados — ver MILESTONE5_STATUS.md)** • 273 tests (19 files)
**Frontend:** https://playmorrow.vercel.app (Vercel) — ✅ UptimeRobot (5min)
**Backend:** https://playmorrow-api-aged-mountain-9542.fly.dev/api/health (Fly.io) — ✅ UptimeRobot (5min)
**Storage:** Cloudflare R2 (uploads públicos)
**DB:** PostgreSQL (Neon)

**⚠️ NOT enterprise-certified.** `docs/ENTERPRISE_AUDIT.md` veredito: 76/100. Não usar como selo de aprovação. `docs/FULL_SCAN_REPORT.md` (92/100) é auditoria operacional (sistema funciona hoje), não enterprise readiness.

**Histórico reescrito:** `3670e91` (R2 env vars) removido via `git-filter-repo` em 29/07. Colaboradores precisam clonar fresco.

---

## Pendências Críticas

| # | Item | Status | Detalhe |
|---|------|--------|---------|
| 1 | **M5 backend** — `/api/recommendations` e `/api/search` | ✅ Deployado e funcionando | `flyctl deploy` executado em 29/07. Trending, Similar Games, Search OK. |
| 2 | **Domínio próprio** (playmorrow.com) — Blocking for public launch | 🔴 Não comprado | Ação manual |
| 3 | **E2E Tests** — 6 spec files | 🔴 Não executado | `next build` timeout (2min+) nesta máquina — executar em CI |
| 4 | **3670e91 no git** — R2 env vars no histórico | ✅ Reescrito via git-filter-repo em 29/07 | Colaboradores: clonar fresco |
| 5 | **Secrets scanning em CI** — gitleaks workflow | ✅ Configurado (`on: [push, pull_request]`) | Testado localmente + workflow ativo. CI em fila (free tier). |
| 6 | **Prisma migrate deploy no Neon** | ✅ Aplicada em 29/07 | `devlog.tags @default` no ar |

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
| **M5** | **Discovery Platform** | **🟡 Em progresso (9/15)** |

### Milestone 5 — Discovery Platform

Status real: `docs/MILESTONE5_STATUS.md` — 9/15 itens implementados.

| Sub-fase | Status | Detalhes |
|----------|--------|----------|
| 5.1 — Recommendation Engine | ✅ | 9 scorers (tag, follow, trending, wishlist, interaction, hidden-gems, similar-studios, recently-updated, latest-releases) |
| 5.2 — Search 2.0 | ✅ | 6 filtros, 4 sorts, full-text |
| 5.3 — Discover Page | ✅ | SSR, 4 seções (Featured, Trending, Popular, Newest) |
| 5.4 — Similar Games + Homepage | ✅ | Similar Games, Trending SSR, Feed com filtros |
| 5.5 — Collections | ✅ | 5 coleções dinâmicas (top-wishlisted, in-development, free, verified, released) |
| 5.6 — SEO Landing Pages | ✅ | `/discover/[tag]` com generateMetadata + JSON-LD |

Verificação: `docs/MILESTONE5_VERIFICATION_v2.md` | Status real: `docs/PHASE1_FINAL_VERIFICATION_v6.md`

## Estrutura do Monorepo

```
playmorrow/
├── apps/
│   ├── web/          # Next.js frontend (73 rotas)
│   │   ├── app/      # App Router pages
│   │   └── components/  # Shared components
│   └── api/          # NestJS backend (37+ módulos, 162+ rotas)
│       └── src/      # auth, common, games, studios, devlogs,
│                      # feed, comments, notifications, analytics,
│                      # goals, support, help, verification,
│                      # recommendations (M5), search (M5), upload
├── packages/
│   └── database/     # Prisma schema (51 modelos)
└── docs/
    ├── ENTERPRISE_AUDIT.md
    ├── FULL_SCAN_REPORT.md       # 92/100 — operacional (sistema funciona)
    ├── ENTERPRISE_AUDIT_FOLLOWUP.md
    ├── MILESTONE5_VERIFICATION_v2.md
    └── PHASE1_FINAL_VERIFICATION_v6.md
```

## URLs Públicas

| Serviço | URL |
|---------|-----|
| Frontend | https://playmorrow.vercel.app |
| API Health | https://playmorrow-api-aged-mountain-9542.fly.dev/api/health |
| API Search | https://playmorrow-api-aged-mountain-9542.fly.dev/api/search?q=void (✅ funciona) |
| API Recommendations | https://playmorrow-api-aged-mountain-9542.fly.dev/api/recommendations?type=trending&limit=3 (✅ funciona) |
| R2 Bucket | https://pub-8e4503584d934d1b8cd18803fdc34ecc.r2.dev |

## Configuração de Produção

Todas as variáveis no Fly.io secrets. Rotacionadas em 28/07 após incidente.

## Segurança

- **CSRF:** HMAC-SHA256 stateless, global APP_GUARD ✅
- **CSP:** Nonce-based, `connect-src` aponta para Fly.io (sem Railway) ✅
- **Rate limit:** 60/min global, 5/min register, 10/min login ✅ (testado: 273/273)
- **Upload:** MIME + magic bytes + dimensão (4096px) + 20MB ✅
- **Pre-commit hook:** Bloqueia secrets em texto claro ✅
- **Secrets scanning (CI):** `.github/workflows/gitleaks.yml` — testado localmente, detecta `AWS_SECRET_ACCESS_KEY` ✅
- **Git history:** `3670e91` reescrito via `git-filter-repo` (29/07) — secrets removidos do histórico ✅
- **Monitoramento:** UptimeRobot (API + Frontend, 5min) ✅

## Release Process

Every major release follows engineering validation. The first public release requires completion of the **Final Release Certification**:

📄 [`docs/releases/FINAL_RELEASE_CERTIFICATION.md`](docs/releases/FINAL_RELEASE_CERTIFICATION.md)

This mandatory process validates the real production system (not just code) before launch. It includes: automated + manual testing, security audit, performance benchmarks, SEO validation, closed beta with real studios, and a final go/no-go decision.

Phase 2 Certification: [`docs/releases/PHASE2_CERTIFICATION.md`](docs/releases/PHASE2_CERTIFICATION.md)

## Para Desenvolvimento Local

```bash
pnpm install && pnpm dev
pnpm typecheck        # 6/6
pnpm --filter @playmorrow/web lint  # 0 errors
pnpm --filter @playmorrow/api test  # 273 pass, requer TEST_DATABASE_URL
```
