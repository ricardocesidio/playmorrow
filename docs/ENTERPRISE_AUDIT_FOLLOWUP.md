# Playmorrow — Enterprise Audit Follow-up

**Date:** 2026-07-28
**Base:** `docs/ENTERPRISE_AUDIT.md` (veredito: NOT enterprise-certified, 76/100)

---

## Resolução dos 4 Itens Críticos

### 1. Railway URLs no CSP — RESOLVIDO

**Antes:** `middleware.ts:57` tinha `connect-src` com Railway.
**Depois:** `middleware.ts:57` tem `connect-src 'self' https://playmorrow-api-aged-mountain-9542.fly.dev https://plausible.io http://localhost:*` — sem Railway.
**Evidência:**
```bash
$ grep "connect-src" apps/web/middleware.ts
connect-src 'self' https://playmorrow-api-aged-mountain-9542.fly.dev https://plausible.io http://localhost:*
$ grep -rn "railway" apps/web --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v "\.next"
# (vazio) ✅
```

### 2. Domínio Próprio — NÃO RESOLVIDO (bloqueado)

A compra de domínio (`playmorrow.com`) é uma ação manual que requer:
1. Compra em registrar (Namecheap, Porkbun, etc.)
2. Configuração de nameservers Vercel
3. Configuração de custom domain no Vercel dashboard
4. Atualização de CORS/WEB_ORIGIN no Fly.io
5. Atualização de COOKIE_DOMAIN

**Nenhuma ferramenta CLI permite isso.** O time de produto precisa fazer a compra.

### 3. E2E Tests — NÃO EXECUTADO

**Setup:** 7 spec files em `apps/web/e2e/`, Playwright config pronto, mocks isolados.
**Bloqueador:** Build do Next.js excede timeout (5min) nesta máquina. Necessário executar em CI ou máquina com mais recursos.

Comando a ser executado quando possível:
```bash
cd apps/web && pnpm build && pnpm test:e2e
# ou em modo dev:
PLAYWRIGHT_DEV=1 npx playwright test --reporter=list
```

### 4. Secrets Scanning em CI — PARCIALMENTE RESOLVIDO

**Workflow criado:** `.github/workflows/gitleaks.yml` — roda em push/PR para main.
**Não testado:** Commit com secret falso não foi feito para confirmar bloqueio.

---

## Git History — Secretos Ainda Presentes

| Commit | Conteúdo | Status |
|--------|----------|--------|
| `e118a93` | JWT/SESSION/CSRF vazados | ✅ Reescrito (6 Jul 2026) |
| `3670e91` | R2 env vars (5 secrets) | ❌ Ainda no histórico |

`3670e91` expõe: `REDACTED_AWS_KEY`, `REDACTED_AWS_SECRET`, `REDACTED_R2_ENDPOINT`, `REDACTED_S3_BUCKET`, `REDACTED_STORAGE_PROVIDER`.
Essas chaves foram rotacionadas (novas keys aplicadas via Fly.io secrets), então o vazamento histórico não representa risco ativo — mas o commit ainda existe.

---

## Itens Menores (Resolvidos)

| Item | Status | Detalhe |
|------|--------|---------|
| Test count 8→9 | ✅ | Tracking correcto: 9 tests M5 (4 rec + 4 search + 1 studios unknown) |
| JSON-LD game page | ✅ | `<script type="application/ld+json">` literal no `games/[slug]/layout.tsx:46-58` — não é "metadata interna" como a v3 report dizia |
| Duplicações v3 report | ✅ | C3 e M11 apareciam 2x cada — versão corrigida em `docs/PHASE1_FINAL_VERIFICATION_v4.md` |
| Rate limit `.skip` test | ✅ | Não existe `.skip` — o comentário (linha 183-186) explica que o teste não foi escrito por falta de per-route `@Throttle`. Não é um teste pulado. |
| `@default([])` em devlog.tags | ✅ | Adicionado ao schema.prisma (linha 615) |
| Trending → Server Component | ✅ | `components/trending-section.tsx` — busca dados no servidor, SSR |

---

## Status Consolidado dos Itens da Auditoria

| Item da Auditoria | Status Real |
|-------------------|-------------|
| CSP sem Railway | ✅ Resolvido |
| Domínio próprio | ❌ Não comprado |
| E2E tests executados | ❌ Não executados |
| Secrets scanning CI | 🟡 Workflow criado, não testado |
| Git history limpo | ❌ 3670e91 ainda existe |
| Server Component Trending | ✅ Convertido |
| Testes M5 | ✅ 272 (19 files) |
| JSON-LD | ✅ Confirmado nas 3 rotas |
| PHASE1 doc duplicações | ✅ Report consolidado |
| `@default([])` tags | ✅ Adicionado |
| Rate limit `.skip` | ✅ Não aplicável (não existe) |

**Interpretação correta da tabela:** A auditoria FOI FEITA (`docs/ENTERPRISE_AUDIT.md` existe). Os itens da auditoria NÃO FORAM todos resolvidos. Existência do documento não equivale a certificação enterprise.
