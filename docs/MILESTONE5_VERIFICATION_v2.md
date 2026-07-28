# Playmorrow — Milestone 5 Verification v2

**Date:** 2026-07-28
**Commits:** 852+
**Correção:** A v1 tinha "5.4 Pendente" por erro de não atualização — o código já estava implementado. Corrigido nesta versão.

---

## 0. Contradição Resolvida

**Documento errado:** `MILESTONE5_VERIFICATION.md` v1 — continha "5.4 Pendente" mesmo após o código ter sido implementado e commitado.

**Causa:** A seção "Pendente" foi escrita no rascunho inicial e nunca atualizada quando a 5.4 foi implementada.

**Evidência de que 5.4 existe:**

```typescript
// apps/web/app/games/[slug]/page.tsx — Similar Games Section
function SimilarGamesSection({ gameId, slug }) {
  useEffect(() => {
    api.get(`/recommendations?type=similar-games&gameId=${gameId}&limit=6`)
      .then(...)  // Renderiza grid de jogos similares
  }, [gameId]);
}

// apps/web/app/page.tsx — Trending Now Section
function TrendingSection() {
  useEffect(() => {
    api.get('/recommendations?type=trending&limit=6')
      .then(...)  // Renderiza grid de trending
  }, []);
}

// apps/web/app/feed/page.tsx — Filters
const [activeType, setActiveType] = useState('all');
// type filter tabs: all | devlogs | roadmap
```

---

## 1. Build Verification

```bash
$ pnpm typecheck
# Tasks: 6 successful, 6 total ✅

$ pnpm --filter @playmorrow/web lint
# 0 errors, 52 warnings (all pre-existing token unused-var) ✅

$ pnpm --filter @playmorrow/api test
# Test Files  19 passed (19)
#      Tests  272 passed (272)  ← +9 novos testes M5
```

---

## 2. CSP Verification

```bash
$ curl -sI https://playmorrow.vercel.app/ | grep content-security-policy
content-security-policy: default-src 'self'; script-src 'self' 'nonce-zad6nUSF+FnmQB8MHdm/IQ==' https://plausible.io; ...
```

Nonce presente no header CSP (`'nonce-...'`). Nonces diferentes por request (confirmado via múltiplos curls). `connect-src` aponta para Fly.io (`playmorrow-api-aged-mountain-9542.fly.dev`). Sem referência a Railway.

---

## 3. Recommendation API

```bash
$ curl -s "http://localhost:4000/api/recommendations?type=trending&limit=3" | python3 -m json.tool
{
    "items": [
        { "gameId": "cmr9apo1r0010z21wadu...", "score": 0.15, "reasons": ["Trending now"] }
    ],
    "hasMore": true,
    "nextCursor": { "score": 0.0, "gameId": "cmr9apvvd003cz21wzzk..." }
}
```

- ✅ Items com `score` e `reasons` populados
- ✅ Cursor pagination (`nextCursor` presente)
- ✅ `hasMore` verdadeiro

---

## 4. Search 2.0

```bash
$ curl -s "http://localhost:4000/api/search?q=void&sort=popularity" | python3 -c "
import sys,json; d=json.load(sys.stdin)
print(f'Games: {d[\"games\"][\"total\"]}, Studios: {d[\"studios\"][\"total\"]}, Devlogs: {d[\"devlogs\"][\"total\"]}')"
# Games: 1, Studios: 1, Devlogs: 2
```

- ✅ Text search returns games + studios + devlogs
- ✅ Genre/status/tag/engine/isFree filters implemented
- ✅ Sort: relevance, popularity, newest, most_wishlisted

---

## 5. Trending Formula

```typescript
// trending.scorer.ts
// score = (views_7d * 1 + wishlist_adds_7d * 3 + follows_7d * 2 + comments_7d * 2) / age_decay
// age_decay = ln(days_since_publish + 2)
```

**O que é:** Volume em janela de 7 dias com decaimento por idade do jogo. Eventos DENTRO da janela não têm peso diferenciado (flat).

**O que não é:** "Velocity" com decaimento temporal intra-janela. O nome "trending" é mais preciso que "momentum" para essa fórmula.

---

## 6. Cache Interface

```typescript
// cache-provider.interface.ts
export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}
```

`InMemoryCacheProvider` implementa `CacheProvider` via `Map<string, { value, expiresAt }>`.
Um `RedisCacheProvider` futuro implementaria a mesma interface. A claim "Redis-ready" é precisa — a abstração permite trocar sem mudar consumidores.

---

## 7. Testes do M5

| Módulo | Testes | Status |
|--------|--------|--------|
| recommendations.service.spec.ts | 4 (trending, limit, reasons, cursor) | ✅ |
| search.service.spec.ts | 4 (empty, search, genre filter, sorts) | ✅ |
| **Total** | **9 novos** | **263 → 272** |

---

## 8. Summary

| Sub-fase | Status | Evidência |
|----------|--------|-----------|
| 5.1 — Recommendation Engine | ✅ | 5 scorers, cursor pagination, explainability, cache |
| 5.2 — Search 2.0 | ✅ | 6 filters, 4 sorts, full-text search |
| 5.3 — Discover Page | ✅ | 3 sections with real API data |
| 5.4 — Similar Games + Homepage | ✅ | Code confirmed in 3 files |

**Build:** Typecheck 6/6, Lint 0 errors, Tests 272/272 (19 files)
