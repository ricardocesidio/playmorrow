# ARCHIVED — DO NOT USE
# This document is superseded by docs/handoff/HANDOFF.md
# Last updated: 2026-08-05
# Reason: Contains obsolete infrastructure references (Fly.io), incorrect module counts (37+ vs actual 55+), incorrect model counts (54 vs actual 63), and references to deleted documents (PHASE2_CERTIFICATION.md).
# Kept for historical reference only.

# Playmorrow — Project Overview for Claude (ARCHIVED)

**Status:** Beta • 1000+ commits • M1-M5 ✅ • M8 ✅ • M9 ✅ • M11 ✅ • M12 ✅ • **318 tests (27 files)**
**Frontend:** https://playmorrow.co (Vercel) — ✅ UptimeRobot (5min)
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
| 2 | **Domínio próprio** (playmorrow.co) | ✅ Resolvido — DNS apontado, HTTPS 200 | `dig playmorrow.co` → 76.76.21.21 |
| 3 | **E2E Tests** — 6 spec files + 318 unit/integration | 🔴 Não executado (E2E) | `next build` timeout local — executar em CI |
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
| M5 | Discovery Platform | ✅ |
| **M8** | **Moderation Center** | **✅ Complete** |
| **M9** | **Email Automation Platform** | **✅ Complete** |
| **M11** | **Public API** | **✅ Complete** |
| **M12** | **JavaScript SDK + CLI** | **✅ Complete** |

### Milestone 8 — Moderation Center

| Feature | Status | Endpoints |
|---------|--------|-----------|
| Reports Dashboard | ✅ | `GET /api/admin/reports` |
| Report Detail + Resolution | ✅ | `GET /api/admin/reports/:id` |
| User Suspension | ✅ | `POST/GET /api/admin/moderation/suspend` |
| Shadow Ban | ✅ | `POST/GET /api/admin/moderation/shadow-ban` |
| Appeals | ✅ | `POST /api/admin/moderation/appeals` |
| User Moderation Status | ✅ | `GET /api/admin/moderation/users/:id` |
| Moderation Dashboard UI | ✅ | `/dashboard/admin/moderation/` |
| Report Detail UI | ✅ | `/dashboard/admin/moderation/reports/[id]` |
| User Detail UI | ✅ | `/dashboard/admin/moderation/users/[id]` |
| Tests | ✅ | 318 (27 files) |

Ver módulo completo em `apps/api/src/moderation/` + frontend em `apps/web/app/dashboard/admin/moderation/`.

### Milestone 9 — Email Automation Platform

| Feature | Status | Endpoints/Pages |
|---------|--------|-----------------|
| Email Templates CRUD | ✅ | `GET/POST/PATCH /api/admin/email-templates` |
| Email Render Engine | ✅ | `EmailTemplatesService.render()` |
| Email Sender (Resend) | ✅ | `EmailSenderService.sendTemplate/Raw()` |
| Email Logging | ✅ | `EmailLog` model + `getLogs()` |
| Transactional Emails | ✅ | Welcome, verify, password-reset via templates |
| Email Preferences API | ✅ | `GET/PATCH /api/email-preferences` |
| Unsubscribe (token-based) | ✅ | `POST/GET /api/unsubscribe/:token` |
| Weekly Digest (cron) | ✅ | `@Cron('0 12 * * 1')` — Monday 12:00 UTC |
| Admin Dashboard UI | ✅ | `/dashboard/admin/email-templates/` |
| Tests | ✅ | 318 (27 files) |

DB models: `EmailTemplate`, `EmailLog`, `EmailPreference`. Módulos em `apps/api/src/email-templates/`, `apps/api/src/email/`, `apps/api/src/email-preferences/`, `apps/api/src/digest/`.

### Milestone 11 — Public API

| Feature | Status | Endpoints |
|---------|--------|-----------|
| API Key CRUD | ✅ | `POST/GET/DELETE /api/api-keys` |
| Key Validation | ✅ | SHA-256 hash lookup |
| Frontend Dashboard | ✅ | `/dashboard/api-keys/` |
| Tests | ✅ | 5 tests |

### Milestone 12 — JavaScript SDK + CLI

| Package | Status | Description |
|---------|--------|-------------|
| `@playmorrow/sdk` | ✅ | `PlaymorrowClient` — games, studios, search, trending, collections |
| `@playmorrow/cli` | ✅ | CLI: `playmorrow search`, `games`, `trending`, `collections` |

### M8 Extra — Features Adicionais

| Feature | Status | Description |
|---------|--------|-------------|
| Strike System | ✅ | 3 strikes → auto-suspend 24h |
| Bounce Handling | ✅ | `isBounced` check, `markBounced`, Resend webhook |
| Delivery Analytics | ✅ | Open/click/bounce rates per template |
| Escalation Workflow | ✅ | Auto-escalate reports after 48h (cron 2h) |
| Spam Detection | ✅ | Keywords, short URLs, ALL CAPS, rate-limit |
| Moderator Dashboard | ✅ | Metrics cards + recent reports |
| DMCA Workflow | ✅ | Takedown filing + counter-notification + 14-day timer |

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
│   └── database/     # Prisma schema (54 modelos)
├── docs/
    ├── releases/                   # 11 certificações + relatórios
    │   ├── PHASE2_CERTIFICATION.md
    │   ├── PHASE3_ROADMAP.md
    │   ├── PHASE3_PREFLIGHT_CERTIFICATION.md
    │   ├── PHASE3_COMPLETION_REPORT.md
    │   ├── PHASE3_VERIFICATION.md
    │   ├── SECURITY_CERTIFICATION_v1.1.md
    │   ├── SECURITY_CERTIFICATION_CHANGELOG.md
    │   ├── SECURITY_CERTIFICATION_v1_AUDIT.md
    │   ├── SECURITY_HARDENING.md
    │   ├── SOFTWARE_ENGINEERING_CERTIFICATION_v1.md
    │   └── FINAL_RELEASE_CERTIFICATION.md
    ├── MILESTONE5_STATUS.md
    ├── security/                   # 7 runbooks + 2 docs complementares
    ├── handoff/                    # Histórico de sessões
    ├── archive/                    # Docs antigos (superseded)
    ├── ENTERPRISE_AUDIT.md
    ├── MILESTONE5_VERIFICATION_v2.md
    └── BACKUP.md
```

## URLs Públicas

| Serviço | URL |
|---------|-----|
| Frontend | https://playmorrow.co |
| API Health | https://playmorrow-api-aged-mountain-9542.fly.dev/api/health |
| API Search | https://playmorrow-api-aged-mountain-9542.fly.dev/api/search?q=void (✅ funciona) |
| API Recommendations | https://playmorrow-api-aged-mountain-9542.fly.dev/api/recommendations?type=trending&limit=3 (✅ funciona) |
| R2 Bucket | https://pub-8e4503584d934d1b8cd18803fdc34ecc.r2.dev |

## Configuração de Produção

Todas as variáveis no Fly.io secrets. Rotacionadas em 28/07 após incidente.

## Segurança

- **CSRF:** HMAC-SHA256 stateless, global APP_GUARD ✅
- **CSP:** Nonce-based, `connect-src` aponta para Fly.io (sem Railway) ✅
- **Rate limit:** 60/min global, 5/min register, 10/min login ✅ (testado: 318/318)
- **Upload:** MIME + magic bytes + dimensão (4096px) + 20MB ✅
- **Pre-commit hook:** Bloqueia secrets em texto claro ✅
- **Dependency Review:** `.github/workflows/dependency-review.yml` — bloqueia dependências vulneráveis em PRs ✅
- **CodeQL:** `.github/workflows/codeql.yml` — SAST scanning semanal + PRs ✅
- **npm audit:** Incluído no CI (`ci.yml`) — audit-level high ✅
- **Incident Response:** `docs/security/INCIDENT_RESPONSE.md` — playbook completo com severidades, procedimentos, templates ✅
- **Semgrep (SAST):** `.github/workflows/semgrep.yml` — regras automáticas da comunidade, toda PR ✅
- **Trivy (container + deps):** `.github/workflows/trivy.yml` — scan de filesystem em toda PR ✅
- **SBOM:** `.github/workflows/sbom.yml` — CycloneDX gerado em cada push para main ✅
- **Secrets scanning (CI):** `.github/workflows/gitleaks.yml` — testado localmente, detecta `AWS_SECRET_ACCESS_KEY` ✅
- **Git history:** `3670e91` reescrito via `git-filter-repo` (29/07) — secrets removidos do histórico ✅
- **Docker:** `.dockerignore` criado — evita vazamento de `.env` no build ✅
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
pnpm --filter @playmorrow/api test  # 318 pass, requer TEST_DATABASE_URL
```
