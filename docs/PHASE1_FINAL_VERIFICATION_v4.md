# Playmorrow — Phase 1 Final Verification v4

**Date:** 2026-07-28
**Revisão:** Quarta passagem — duplicações corrigidas (C3, M11), JSON-LD corrigido, Server Component SSR

---

## Corrigido nesta versão

| Problema | v3 | v4 |
|----------|----|----|
| C3 aparecia 2x | Seções 6 e 10 | Consolidado em uma seção |
| M11 aparecia 2x | Seções 7 e 11 | Consolidado em uma seção |
| "JSON-LD via metadata interna" | Impreciso — game tem literal `<script>` | ✅ Corrigido |
| Engineering Score numerado 2x | Seção 10 vs 10 | Removido |

---

## 1. CSP — Confirmado

```bash
$ grep "connect-src" apps/web/middleware.ts
connect-src 'self' https://playmorrow-api-aged-mountain-9542.fly.dev https://plausible.io http://localhost:*
```

Nonce presente e diferente a cada request. `connect-src` sem Railway. Zero resultados Railway em código web.

---

## 2. JSON-LD — Confirmado nas 3 rotas

### Game (`/games/[slug]`)
```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"VideoGame","name":"...",...}
</script>
```
Fonte: `apps/web/app/games/[slug]/layout.tsx:46-58` — literal, não metadata.

### Studio (`/studios/[slug]`)
```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Organization","name":"...",...}
</script>
```

### Devlog (`/devlogs/[id]`)
```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BlogPosting","headline":"...",...}
</script>
```

---

## 3. M11 — Auth Ordering

`assertStudioAccess()` é chamado **antes** de qualquer lógica de negócio em todos os métodos de `games.service.ts`.

```typescript
// games.service.ts:264 (update)
const user = await this.prisma.user.findUnique({ where: { id: userId } });
assertStudioAccess({ id: userId, role: user.role }, game.studio.members, [OWNER, ADMIN, MODERATOR, MEMBER]);
// → Lógica de negócio VEM DEPOIS
```

Confirmado: `d267a25` (Production hardening) + refatorações posteriores mantêm o padrão.

---

## 4. Trending Section → Server Component (SSR)

**Antes:** `useEffect` + `api.get()` client-side.
**Depois:** `components/trending-section.tsx` — async Server Component, `fetch()` direto, `next.revalidate: 120`.

```typescript
// components/trending-section.tsx
export default async function TrendingSection() {
  const games = await fetchTrendingGames();
  if (games.length === 0) return null;
  return <section>...</section>;
}
```

---

## 5. `@default([])` em devlog.tags

Adicionado ao `schema.prisma:615`:
```prisma
tags  String[] @default([])
```

---

## 6. Test count — M5

Recommendations: 4 tests ✅
Search: 4 tests ✅
Total: **8** (não 9 como documentado anteriormente — corrigido)

---

## 7. Test Suite

```bash
Test Files  19 passed (19)
     Tests  272 passed (272)
```

---

## 8. Rate Limit `.skip`

O arquivo `security-auth.spec.ts` NÃO contém `.skip`. Linhas 183-186 são um comentário explicando que o teste de rate limit de registro não foi escrito por falta de per-route `@Throttle`. O rate limit foi confirmado funcional via curl manual.

---

## 9. Secrets Scanning CI

Workflow criado em `.github/workflows/gitleaks.yml` — roda gitleaks action em push/PR para main.

---

## 10. Status Consolidado

| Item | Status | Evidência |
|------|--------|-----------|
| CSP (nonce-based, sem Railway) | ✅ | grep confirmado |
| Railway URLs removidas do código | ✅ | grep vazio |
| JSON-LD nas 3 rotas | ✅ | Código + curl confirmados |
| M11 auth ordering | ✅ | assertStudioAccess antes da lógica |
| Trending em Server Component | ✅ | `trending-section.tsx` SSR |
| devlog.tags @default | ✅ | schema.prisma atualizado |
| Gitleaks CI | 🟡 | Workflow criado, não testado |
| Domínio próprio | ❌ | Não comprado (ação manual) |
| E2E Tests | ❌ | Não executados (timeout) |
| 3670e91 git history | ❌ | Ainda existe |
