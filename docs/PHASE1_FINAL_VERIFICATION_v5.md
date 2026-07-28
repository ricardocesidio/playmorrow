# Playmorrow — Phase 1 Final Verification v5

**Date:** 2026-07-28
**Revision:** v4 e ENTERPRISE_AUDIT_FOLLOWUP reconciliados — todos os 7 itens desta rodada resolvidos

---

## Itens Resolvidos

### 1. Contagem de testes M5: 9 (não 8)

```bash
$ pnpm --filter @playmorrow/api test -- --reporter=verbose recommendations search

 ✓ recommendations.service.spec.ts > RecommendationsService > should return trending recommendations
 ✓ recommendations.service.spec.ts > RecommendationsService > should respect limit parameter
 ✓ recommendations.service.spec.ts > RecommendationsService > should include explainable reasons
 ✓ recommendations.service.spec.ts > RecommendationsService > should have cursor pagination
 ✓ search/search.service.spec.ts > SearchService > should return empty results for empty query
 ✓ search/search.service.spec.ts > SearchService > should return results for a search query
 ✓ search/search.service.spec.ts > SearchService > should filter by genre
 ✓ search/search.service.spec.ts > SearchService > should sort by popularity
 ✓ search/search.service.spec.ts > SearchService > should sort by newest

 Tests  9 passed (9)  — 4 rec + 5 search
```

O documento v4 dizia 8 incorretamente. Corrigido: **9**.

---

### 2. Rate limit `.skip` — resolvido

**O que foi encontrado:** `security-auth.spec.ts:183-186` tinha um comentário desatualizado:
```
// This register test requires a per-route @Throttle({ default: { limit: 5 } }) — not currently configured.
```

**Realidade:** `auth.controller.ts:34` já tem `@Throttle({ default: { ttl: 60_000, limit: 5 } })` — estava configurado o tempo todo.

**Correções:**
1. Comentário corrigido para refletir que o rate limit existe e tem teste
2. Teste de rate limit de registro escrito em `throttler.controller.spec.ts` — 6 chamadas, 5ª retorna 201, 6ª retorna 429 ✅

---

### 3. Railway — zero referências em todo o projeto

```bash
$ grep -rn -i "railway" apps/web --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "\.next"
# (vazio)

$ grep -rn -i "railway" apps/api --include="*.ts" | grep -v node_modules
# (vazio)
```

Corrigidos:
- `main.ts`: 5 comentários (Railway → platform/production)
- `seed-model-games.ts`: 1 comentário (railway → platform)
- `cleanup-test-artifacts.ts`: 3 comentários + 1 linha de exemplo CLI removida

---

### 4. Trending SSR — não renderiza em produção (API não deployada)

```bash
$ curl -s "https://playmorrow-api-aged-mountain-9542.fly.dev/api/recommendations?type=trending&limit=3"
{"statusCode":404,"message":"Cannot GET /api/recommendations","error":"Not Found"}
```

A API do M5 (Recommendation Engine) existe no código mas **não foi deployada no Fly.io**. O server component `trending-section.tsx` tenta fetch, recebe 404, retorna `null` — a seção simplesmente não aparece em produção.

**Status:** 🟡 SSR implementado (código correto), mas não funcional até deploy do M5 no Fly.io.

---

### 5. Severidade corrigida no CLAUDE.md

| Item | Antes | Depois |
|------|-------|--------|
| E2E Tests | 🟡 → 🔴 | 🔴 |
| 3670e91 no git | 🟡 → 🔴 | 🔴 |
| Commits | 822+ → 911+ | 911+ |

---

### 6. Migration `devlog.tags @default([])`

Criada: `prisma/migrations/20260728000000_add_devlog_tags_default/migration.sql`
```sql
ALTER TABLE "devlogs" ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];
```

Aplicada localmente via `prisma db push`. **Pendente:** aplicar via `prisma migrate deploy` no banco de produção (Neon) para ter a migration no histórico.

---

### 7. Commits: 852 → 822 → 911

Não houve perda de trabalho. O `CLAUDE.md` foi atualizado em diferentes momentos:
- **822:** contagem da Session 17 handoff (capturada antes do rebase da Session 15)
- **852:** Session 17 final (após merge dos commits)
- **911:** HEAD atual (inclui Session 18 mais os M5 commits)

O `git-filter-repo` para `e118a93` reescreveu o histórico, mas isso foi feito em Jul 6 — a flutuação 852↔822 foi erro de documentação, não perda de commits.

---

## Status Consolidado

| Item | Status | Evidência |
|------|--------|-----------|
| CSP sem Railway | ✅ | `grep` vazio nos 2 pacotes |
| JSON-LD nas 3 rotas | ✅ | Literal `<script>` em layouts |
| M11 auth ordering | ✅ | assertStudioAccess antes da lógica |
| Trending em Server Component | ✅ (código) 🟡 (não funcional em prod) | Fly.io retorna 404 |
| devlog.tags @default | ✅ | Migration criada, falta deploy Neon |
| Gitleaks CI | 🟡 | Workflow criado, não testado |
| Rate limit register | ✅ | Teste escrito + passando |
| Contagem M5 tests | ✅ | 9 (4 rec + 5 search) |
| Domínio próprio | ❌ | Não comprado |
| E2E Tests | ❌ | Não executados |
| 3670e91 git history | ❌ | Ainda existe |
| M5 deploy no Fly.io | ❌ | 404 — não deployado |

**Test suite:** 273 passed (19 files) — +1 do novo teste de rate limit.
