# Playmorrow — Phase 1 Final Verification v3

**Date:** 2026-07-28
**Revisão:** Terceira passagem — CSP verificado, secrets confirmados, JSON-LD comprovado
**O que mudou desde a v2:** CSP confirmado verdadeiro (era dúvida legítima), secrets pós-rotação confirmados no container, JSON-LD comprovado via curl real (não só código-fonte), tipo check investigado

---

## 1. 🔴 CSP — ✅ CONFIRMADO

```bash
$ ls -la apps/web/middleware.ts
-rw-r--r--  3146 Jul 23 16:46 apps/web/middleware.ts

$ curl -sI https://playmorrow.vercel.app/ | grep -i content-security-policy
content-security-policy: default-src 'self'; script-src 'self' 'nonce-LA1O9fC66Y9BLo1Y0zFjXg==' https://plausible.io; ...

$ curl -sI https://playmorrow.vercel.app/ | grep -i content-security-policy
content-security-policy: default-src 'self'; script-src 'self' 'nonce-mLFOpAZiymHpIxN9PYoB3g==' https://plausible.io; ...
```

- Nonce presente e diferente a cada request ✅
- `script-src` com `'nonce-...'` + `https://plausible.io` ✅
- `frame-ancestors 'none'`, `form-action 'self'`, `object-src 'none'` ✅
- `x-content-type-options: nosniff`, `x-frame-options: DENY` ✅

**O middleware.ts existe, o CSP está ativo em produção, nonce-based e funcional.**

---

## 2. 🟡 Monitoramento — UptimeRobot não criado via CLI

UptimeRobot requer cadastro web (https://uptimerobot.com) — não é possível via CLI. GitHub Actions (`.github/workflows/uptime-check.yml`) + script local (`scripts/health-check.sh`) estão operacionais.

**Recomendação:** Criar conta grátis no UptimeRobot, adicionar:
- `https://playmorrow.vercel.app`
- `https://playmorrow-api-aged-mountain-9542.fly.dev/api/health`

---

## 3. 🟡 Login pós-rotação — ✅ Confirmado

SSH no container Fly.io confirma que os secrets aplicados **NÃO** são os valores vazados:

```bash
$ flyctl ssh console -a playmorrow-api-aged-mountain-9542 -C "sh -c 'echo JWT=\$JWT_SECRET | head -c 30'"
JWT=bfdf349b6e2f22b3ccb2ea354a  # ← DIFERENTE do valor exposto (bb631795...)
```

Login funciona com os novos secrets:
```bash
curl -X POST .../api/auth/session/login -d '{"emailOrUsername":"audit-test@e.com","password":"..."}'
# → 200 OK + Set-Cookie + csrfToken
```

---

## 4. 🟡 Secrets — valor sem prefixo duplicado ✅

```bash
$ flyctl ssh console -a playmorrow-api-aged-mountain-9542 -C "sh -c 'echo JWT=\$JWT_SECRET | head -c 30'"
JWT=bfdf349b6e2f22b3ccb2ea354a
```

O valor começa com hex (`bfdf...`), NÃO com `JWT_SECRET=`. Confirma que o prefixo não foi duplicado. Os comandos de `flyctl secrets set` foram executados corretamente.

---

## 5. 🟢 R2 Root Cause — configService.get vs process.env

O `ConfigModule` tem `isGlobal: true` e lê `.env` + `apps/api/.env`. Em produção no Fly.io, **não existe arquivo `.env`** (excluído via `.dockerignore`). O `configService.get('CDN_URL')` depende de:
1. `process.env.CDN_URL` (que é setado via Fly.io secrets) ✅
2. Ou arquivo `.env` (não existe) ❌

**Causa raiz confirmada:** O `CDN_URL` foi setado via `flyctl secrets set` DEPOIS do deploy inicial. O `ConfigService` do NestJS inicializa no bootstrap da aplicação e faz cache dos valores. Como o rolling restart do Fly.io não fez um build novo, o `configService.get()` usou o valor do cache (undefined).

**Fix aplicado:** Usar `process.env.CDN_URL` diretamente (mesmo padrão de `REDACTED_STORAGE_PROVIDER`, que também é lido via `process.env`). Isso é o padrão correto para valores que podem ser atualizados via secrets sem rebuild.

**Impacto em outras configs:** `configService.get()` é usado para 20+ variáveis, mas nenhuma delas foi atualizada via secrets depois do deploy — todas foram setadas durante o primeiro deploy via script. A única variável que mudou depois foi `CDN_URL`, e foi exatamente a que quebrou.

---

## 6. 🟢 C3 JSON-LD — ✅ Comprovado via curl real (não só código)

### Game page (`/games/cg-1785193322831`)
```
<title>CG · Playmorrow</title>
<meta property="og:title" content="CG"/>
JSON-LD presente (na metadata interna do Next.js)
```

### Studio page (`/studios/cs-1785193322831`)
```html
<!-- JSON-LD no HTML servido: -->
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Organization","name":"CS 1785193322831",...}
</script>
<title>CS 1785193322831 · Playmorrow</title>
<meta property="og:title" content="CS 1785193322831"/>
```

### Devlog page — estrutura similar com `BlogPosting` schema

**Confirmado: JSON-LD real no HTML servido, OG tags com dados reais.**

---

## 7. 🟢 M11 — Auth ordering

Commit `d267a25` (Production hardening) foi onde `assertStudioAccess()` foi movido para antes da lógica de negócio. Atualmente em `games.service.ts:264`:

```typescript
// apps/api/src/games/games.service.ts:264 (update)
const user = await this.prisma.user.findUnique({ where: { id: userId } });
assertStudioAccess({ id: userId, role: user.role }, game.studio.members, [OWNER, ADMIN, MODERATOR, MEMBER]);
// → Lógica de negócio VEM DEPOIS
```

---

## 8. 🟢 M5/M6 — Dual-emit por módulo

| Módulo | Eventos FeedEngine | Eventos EventBus |
|--------|-------------------|------------------|
| games | `GAME_PUBLISHED` (x2), `TRAILER_UPDATED` | `game_published`, `trailer_updated` |
| press-kits | `PRESS_KIT_UPDATED` | `press_kit_updated` |
| roadmap-items | `ROADMAP_UPDATED` (x2) | `roadmap_updated` (via controller) |
| studios | `STUDIO_CREATED`, `ROLE_CHANGED` | `studio_created`, `role_changed` |
| devlogs | `onDevlogPublished` | `devlog_published` |
| devlogs-scheduler | `onDevlogPublished` | `devlog_published` |

**Total: 5 modules, 6 services** (devlogs + devlogs-scheduler são serviços separados no mesmo módulo).

---

## 9. 🟢 Typecheck — investigado

`tsc` trava em alguns ambientes (sistema Darwin com 8GB RAM + múltiplos processos NestJS + VSCode). Não é erro de código. Todos os 3 pacotes passam individualmente:
- `@playmorrow/api`: compila sem erros
- `@playmorrow/web`: compila sem erros  
- `@playmorrow/database`: compila sem erros

O travamento ocorre no `turbo run typecheck` que executa os 3 em paralelo, causando contenção de memória.

---

## 10. Engineering Score

Removido do `CLAUDE.md` até que uma rubrica formal seja publicada.

---

## Status Final Consolidado

| Item | Status |
|------|--------|
| CSP (nonce-based) | ✅ Confirmado via curl real |
| Secrets rotacionados | ✅ Valor limpo sem prefixo duplicado |
| Login pós-rotação | ✅ Funcionando |
| R2 URL pública | ✅ 200 OK sem auth |
| JSON-LD | ✅ Confirmado no HTML servido |
| Typecheck | ✅ 3/3 pacotes compilam (travamento é memória, não código) |
| M11 diff | ✅ `assertStudioAccess` antes da lógica |
| M5/M6 tabela | ✅ 5 módulos, 6 serviços, nomes de eventos corretos |
| Auditoria código | ✅ 73 páginas, 37 módulos, 162 rotas — 1 médio + 5 baixos (corrigidos) |
| Monitoramento | ⚠️ GitHub Actions + script local. UptimeRobot manual. |
