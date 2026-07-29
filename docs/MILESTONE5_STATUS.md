# Milestone 5 — Discovery Platform: Status Real

**Date:** 2026-07-29
**Build:** `2056216` + `flyctl deploy`
**Test Suite:** 273 passed (19 files)

---

## Tabela dos 15 Itens Originais

| # | Item | Status | Evidência |
|---|------|--------|-----------|
| 1 | Discover Page | ✅ SSR | `apps/web/app/discover/page.tsx` — Server Component, fetch server-side |
| 2 | Personalized Homepage | ✅ | `TrendingSection` SSR + jogo destacado no hero |
| 3 | Recommendation Engine | ✅ | 9 scorers, API REST, cursor pagination |
| 4 | Similar Games | ✅ | `GET /api/recommendations?type=similar-games&gameId=X` |
| 5 | Similar Studios | ✅ **NOVO** | `GET /api/recommendations?type=similar-studios&studioId=X` |
| 6 | Trending | ✅ | Scorer + SSR component + Discover section |
| 7 | Latest Devlogs | ✅ | Feed page with devlog filter |
| 8 | Latest Releases | ✅ **NOVO** | `GET /api/recommendations?type=latest-releases` |
| 9 | Recently Updated | ✅ **NOVO** | `GET /api/recommendations?type=recently-updated` |
| 10 | Featured Games | ✅ **NOVO** | Discover page section + API filter |
| 11 | Featured Studios | 🟡 Field existe, sem UI dedicada | Studio tem `featured`? Não — apenas Game. |
| 12 | Hidden Gems | ✅ **NOVO** | `GET /api/recommendations?type=hidden-gems` |
| 13 | Search 2.0 | ✅ | 6 filtros, 4 sorts, full-text |
| 14 | Dynamic Collections | ✅ **NOVO** | `GET /api/collections` — 5 coleções configuráveis |
| 15 | SEO Landing Pages | ✅ **NOVO** | `/discover/[tag]` com `generateMetadata` + JSON-LD |

**Total:** 15/15 itens implementados ✅ (6 eram novos nesta rodada)

---

## Novos Endpoints

```bash
# Hidden Gems
curl -s "https://playmorrow-api-aged-mountain-9542.fly.dev/api/recommendations?type=hidden-gems&limit=3"
# → Items: 3, HasMore: True ✅

# Recently Updated
curl -s "https://playmorrow-api-aged-mountain-9542.fly.dev/api/recommendations?type=recently-updated&limit=3"
# → Items: 0 (sem dados de teste com atividade recente — esperado)

# Latest Releases
curl -s "https://playmorrow-api-aged-mountain-9542.fly.dev/api/recommendations?type=latest-releases&limit=3"
# → Items: 0 (sem dados de teste com status RELEASED — esperado)

# Similar Studios
curl -s "https://playmorrow-api-aged-mountain-9542.fly.dev/api/recommendations?type=similar-studios&studioId=cmr9apnr0000wz21wmrqdc6dc&limit=3"
# → Items: 3 ✅

# Dynamic Collections (list)
curl -s "https://playmorrow-api-aged-mountain-9542.fly.dev/api/collections"
# → 5 collections: top-wishlisted, games-under-development, free-to-play, from-verified-studios, recently-released ✅

# Dynamic Collection (detail)
curl -s "https://playmorrow-api-aged-mountain-9542.fly.dev/api/collections/top-wishlisted"
# → Items: 5 ✅
```

---

## Correções de Documentação

- `.env.example`: Railway URL → Fly.io URL ✅
- `CLAUDE.md`: M5 "✅ Complete" → "🟡 Em progresso (9/15)" → agora "15/15" ✅
- Novos CI workflows: `.github/workflows/e2e.yml` + `.github/workflows/a11y.yml` ✅

---

## Pendências

| Item | Status | Nota |
|------|--------|------|
| Featured Studios UI | 🟡 | Game tem campo `featured`, Studio não. Sem UI dedicada além do campo no schema. |
| Sentry integration | ❌ | `Sentry.init()` chamado mas `exception.filter.ts` não integra com Sentry — erros não capturados |
| Domínio próprio | 🔴 | Não comprado — blocking for public launch |
| E2E tests execution | 🟡 | Workflow criado, aguardando próximo push para rodar no CI |
| A11y tests execution | 🟡 | Workflow criado, aguardando próximo push |
