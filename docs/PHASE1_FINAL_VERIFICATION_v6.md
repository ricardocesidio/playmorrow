# Playmorrow — Phase 1 Final Verification v6

**Date:** 2026-07-28
**Revisão:** Sexta passagem — M5 status real em produção, FULL_SCAN reconciliado, CLAUDE.md sincronizado

---

## 1. 🔴 M5 em Produção: Recommendations 404

### Antes do deploy

```bash
$ curl -s "https://playmorrow-api-aged-mountain-9542.fly.dev/api/recommendations?type=trending&limit=3"
{"statusCode":404,"message":"Cannot GET /api/recommendations","error":"Not Found"}

$ curl -s "https://playmorrow-api-aged-mountain-9542.fly.dev/api/recommendations?type=similar-games&gameId=test&limit=6"
{"statusCode":404,"message":"Cannot GET /api/recommendations","error":"Not Found"}

$ curl -s "https://playmorrow-api-aged-mountain-9542.fly.dev/api/search?q=void"
{"games":{"items":[{...}],"total":1},"studios":{...},"devlogs":{...}}
```

**Resultado:**
- `/api/search` ✅ **Funciona** — Search 2.0 está deployado e retorna dados reais
- `/api/recommendations` ❌ **404** — Module está em `app.module.ts:98` mas **nunca foi deployado no Fly.io**

### Bloqueador do deploy

```bash
$ which flyctl
flyctl not found
```

O `flyctl` CLI não está instalado nesta máquina. O deploy precisa ser feito de uma máquina com `flyctl` configurado, ou via CI/CD. Comando necessário:

```bash
cd apps/api && flyctl deploy
```

### Impacto em produção

| Funcionalidade | Impacto |
|----------------|---------|
| Homepage — Trending Now | ❌ Não aparece (server component recebe 404, retorna null) |
| Discover Page — Trending/Popular/Newest | 🟡 Newest funciona (via `/games`), Trending/Popular vazios |
| Game Detail — Similar Games | ❌ Não aparece |
| Search 2.0 | ✅ Funciona normalmente |

---

## 2. 🔴 FULL_SCAN_REPORT.md (92/100) vs ENTERPRISE_AUDIT.md (76/100) — Reconciliado

**FULL_SCAN_REPORT.md** (92/100):
- Auditoria **operacional**: "o sistema funciona hoje?"
- Testou endpoints, flows, build — tudo funciona
- Não avaliou: CSP, Railway, deploy gaps, enterprise readiness
- Nota alta porque olhou só o que está rodando

**ENTERPRISE_AUDIT.md** (76/100):
- Auditoria de **enterprise readiness**: "está pronto para escala e produção?"
- Avaliou: CSP, secrets, deploy, monitoring, testing, a11y, docs
- Nota mais baixa porque o critério é mais rigoroso

**Não são contraditórios** — medem coisas diferentes. Ambos são válidos no contexto deles.

**Correções aplicadas no FULL_SCAN_REPORT.md:**
- Adicionado banner NOTÍCIA IMPORTANTE no topo explicando a diferença
- Corrigida classificação de "domínio próprio" (era "Phase 2, short-term" → agora alinhado com ENTERPRISE_AUDIT como bloqueante)
- Nota: números desatualizados (263→273, 17→19)

---

## 3. 🟡 Testes M5 — 9 confirmados

```bash
$ vitest run --reporter=verbose src/recommendations/ src/search/

 ✓ search/search.service.spec.ts > SearchService > should return empty results for empty query
 ✓ search/search.service.spec.ts > SearchService > should return results for a search query
 ✓ search/search.service.spec.ts > SearchService > should filter by genre
 ✓ search/search.service.spec.ts > SearchService > should sort by popularity
 ✓ search/search.service.spec.ts > SearchService > should sort by newest
 ✓ recommendations/recommendations.service.spec.ts > RecommendationsService > should return trending recommendations
 ✓ recommendations/recommendations.service.spec.ts > RecommendationsService > should respect limit parameter
 ✓ recommendations/recommendations.service.spec.ts > RecommendationsService > should include explainable reasons
 ✓ recommendations/recommendations.service.spec.ts > RecommendationsService > should have cursor pagination

 Tests  9 passed (9)  — 5 search + 4 recommendations
```

---

## 4. 🟡 CLAUDE.md — Sincronizado com a situação real

| Item | Antes | Depois |
|------|-------|--------|
| M5 status | "✅ Código entregue" | "🟡 Código completo — backend não deployado" |
| Test count | 272 (19 files) | 273 (19 files) |
| Docs tree | `v3.md` | `v6.md` |
| Pendências | 4 itens | 5 itens — M5 deploy adicionado como 🔴 #1 |
| FULL_SCAN | Não mencionado | Explicado: 92/100 operacional ≠ 76/100 enterprise |

---

## Status Consolidado

| Item | Status | Evidência |
|------|--------|-----------|
| M5 Recommendations deployado | ❌ 404 | curl contra Fly.io confirma |
| M5 Search deployado | ✅ | curl confirma dados reais |
| CSP sem Railway | ✅ | grep vazio nos 2 pacotes |
| JSON-LD nas 3 rotas | ✅ | Literal `<script>` em layouts |
| Rate limit register test | ✅ | Escrito e passando (273/273) |
| Railway comments removidos | ✅ | grep vazio |
| Trending SSR (código) | ✅ | Componente server-side |
| trending-section.tsx | ✅ | |
| devlog.tags @default | ✅ | Migration criada |
| Domínio próprio | ❌ | Bloqueante — não comprado |
| E2E Tests | ❌ | Não executados |
| 3670e91 git history | ❌ | Ainda existe |
| Gitleaks CI | 🟡 | Workflow criado, não testado |
| M5 deploy | ❌ | flyctl não disponível |

**Test suite:** 273 passed (19 files)
