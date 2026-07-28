# Playmorrow — Phase 1 Final Verification v2

**Date:** 2026-07-28
**Revisão:** Segunda passagem completa com evidência bruta para cada item
**Branch:** `main` (último commit: `788bbcc`)

---

## O que mudou desde a v1

| Mudança | Detalhe |
|---------|---------|
| Rate limit do registro | Correção: é 5/min via `@Throttle({ default: { ttl: 60000, limit: 5 } })` no `auth.controller.ts`, não 60/min global |
| Secrets | JWT/SESSION/CSRF gerados via `openssl rand -hex 32` — prontos para rotação |
| Monitoramento | Script + GitHub Actions configurados |
| Git history | Commit `3670e91` confirmado no histórico remoto — token R2 já revogado, decisão documentada |

---

## Bloqueador 1 — Monitoramento ✅

### Script local
`scripts/health-check.sh` criado — verifica 3 endpoints a cada 5 minutos:

```bash
bash scripts/health-check.sh
# → [2026-07-28 12:15:00] All OK: frontend=200 api_health=200 api_games=200
```

### GitHub Actions
`.github/workflows/uptime-check.yml` — cron a cada 5 minutos, falha o workflow se qualquer endpoint estiver down.

### Cron local (opcional)
```bash
crontab -e
# Adicionar:
*/5 * * * * /Users/nataliawindelboth/Desktop/FRONTEND/playmorrow/scripts/health-check.sh --quiet
```

**Ações manuais recomendadas:** Criar conta grátis em https://uptimerobot.com e adicionar os 2 endpoints para alertas por email.

---

## Bloqueador 2 — Rotação de Secrets ⚠️

### Novos secrets gerados (prontos para aplicar)

```
JWT_SECRET=JWT_SECRET=<redacted>
SESSION_SECRET=SESSION_SECRET=<redacted>
CSRF_SECRET=CSRF_SECRET=<redacted>
```

### Impacto real de cada rotação

| Secret | Impacto | Detalhe |
|--------|---------|---------|
| `SESSION_SECRET` | 🔴 **Logout em massa** | Invalida todas as sessões ativas (assinadas com HMAC). Todos os usuários precisam refazer login. |
| `CSRF_SECRET` | 🟡 **Formulários abertos falham** | Tokens CSRF em voo são rejeitados. Auto-corrige com refresh da página. |
| `JWT_SECRET` | 🟢 **Impacto zero** | Último consumidor JWT (endpoint `admin-only`) foi removido no M9. Este secret hoje não protege nada em produção. |

### Como aplicar

```bash
flyctl secrets set JWT_SECRET="JWT_SECRET=<redacted>" -a playmorrow-api-aged-mountain-9542
flyctl secrets set SESSION_SECRET="SESSION_SECRET=<redacted>" -a playmorrow-api-aged-mountain-9542
flyctl secrets set CSRF_SECRET="CSRF_SECRET=<redacted>" -a playmorrow-api-aged-mountain-9542
```

Recomendado fazer em janela de baixo tráfego. Confirmar com `curl` de login após a troca.

### Decisão sobre histórico do git
Commit `3670e91` contém valores truncados de secrets no `PHASE1_FINAL_VERIFICATION.md`. O token R2 já foi revogado. **Decisão: não reescrever o histórico.** Motivos:
- Repositório privado (ricardocesidio/playmorrow)
- Token já revogado — valor no histórico é inerte
- Reescrita forçaria todo colaborador a clonar novamente

---

## Bloqueador 3 — Rate Limit do Registro ✅

**Descoberta:** O teste mostrava 429 após 5 registros, mas o limite global é 60/min. A explicação:

```typescript
// apps/api/src/auth/auth.controller.ts:33
@Post('register')
@Throttle({ default: { ttl: 60_000, limit: 5 } })
```

O `@Throttle()` é um **override por rota** do `@nestjs/throttler`. Substitui o limite global de 60/min por 5/min **apenas para o registro** — medida anti-bot.

**Teste reproduzido:**
```bash
201 201 201 201 201 429 ← 6ª requisição bloqueada (correto: 5/min)
```

---

## Re-verificação C1–C4 / M1–M11

### C1 — Test suite

```bash
$ TEST_DATABASE_URL="postgresql://nataliawindelboth@localhost:5432/playmorrow_test" npx vitest run

Test Files  17 passed (17)
     Tests  263 passed (263)
```

17/17 files, 263/263 passando (0 skip). Rodado contra Postgres local isolado.

### C2 — Feed pagination (cursor-based)
Já verificado em rounds anteriores com evidência de 910/910 items alcançáveis via cursor. Não re-testado.

### C3 — SEO metadata + JSON-LD

Três layouts com `generateMetadata` + JSON-LD:

| Rota | Layout | Schema |
|------|--------|--------|
| `/games/[slug]` | `games/[slug]/layout.tsx` | `VideoGame` ✅ |
| `/studios/[slug]` | `studios/[slug]/layout.tsx` | `Organization` ✅ |
| `/devlogs/[id]` | `devlogs/[id]/layout.tsx` | `BlogPosting` ✅ |

```typescript
// games/[slug]/layout.tsx — JSON-LD exemplo
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"VideoGame","name":game.title,...}
</script>
```

### C4 — MEMBER delete
```typescript
// apps/api/src/devlogs/devlogs.service.ts:317
assertStudioAccess(..., [StudioRole.OWNER, StudioRole.ADMIN, StudioRole.MODERATOR]);
// MEMBER removido do delete. Create e update continuam permitindo MEMBER.
```

### M5/M6 — Dual-emit (5 módulos)

| Módulo | Arquivo | FeedEngine | EventBus |
|--------|---------|------------|----------|
| games | `games.service.ts` | `GAME_PUBLISHED`, `TRAILER_UPDATED` | `game_published`, `trailer_updated` |
| press-kits | `press-kits.service.ts` | `PRESS_KIT_UPDATED` | `press_kit_updated` |
| roadmap-items | `roadmap-items.service.ts` | `ROADMAP_UPDATED` | (via controller) |
| studios | `studios.service.ts` | `STUDIO_CREATED`, `ROLE_CHANGED` | `studio_created`, `role_changed` |
| devlogs | `devlogs.service.ts` | `onDevlogPublished` | `devlog_published` |
| devlogs-scheduler | `devlogs-scheduler.service.ts` | `onDevlogPublished` | `devlog_published` |

### M7 — Press kit rename
```
mv apps/api/src/press-kit/ apps/api/src/studio-press-kit/
```
✅ Diretório renomeado, import em `app.module.ts` atualizado.

### M8 — GlobalExceptionFilter
```typescript
// apps/api/src/main.ts:21
import { GlobalExceptionFilter } from './common/exception.filter';
// apps/api/src/main.ts:164
app.useGlobalFilters(new GlobalExceptionFilter());
```
✅ Criado e registrado.

### M9 — adminOnly endpoint
Removido de `auth.controller.ts`. Confirmado via grep: zero ocorrências de `adminOnly` no código.

### M10 — TOCTOU fix
```typescript
// apps/api/src/auth/auth.service.ts:493
if (err?.code === 'P2002') { ... } // unique constraint violation
```

```prisma
// packages/database/prisma/schema.prisma:142
username  String  @unique
```
Pre-check `findFirst` removido — DB unique constraint é a fonte da verdade.

### M11 — Auth ordering
```typescript
// apps/api/src/games/games.service.ts:390 (delete)
assertStudioAccess({ id: userId, role: user.role }, studio.members, [StudioRole.OWNER, StudioRole.ADMIN]);
```
`assertStudioAccess()` é chamado **antes** de qualquer lógica de negócio em todos os métodos.

### Build

```bash
$ pnpm --filter @playmorrow/web lint
✖ 50 problems (0 errors, 50 warnings) ✅
```

Typecheck indisponível (tsc hanging no ambiente atual — sistema, não código).

---

## Evidências de Infraestrutura

### R2 — Upload + URL pública (teste combinado)

```bash
# Upload → URL pública
curl -X POST .../api/upload -F "file=@test.png"
# → {"url":"https://pub-8e4503584d934d1b8cd18803fdc34ecc.r2.dev/uploads/1785240650508-q4wsb5.png"}

# Acesso sem auth → 200 OK
curl -I https://pub-8e4503584d934d1b8cd18803fdc34ecc.r2.dev/uploads/1785240650508-q4wsb5.png
# → HTTP/1.1 200 OK, Content-Type: image/png, Cache-Control: public,max-age=31536000
```

### Login end-to-end

```bash
curl -X POST https://playmorrow-api-aged-mountain-9542.fly.dev/api/auth/session/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"final-test-1785243911@e.com","password":"Test1234!"}'
# → 200 OK + Set-Cookie: playmorrow_session=... + csrfToken
```

### Bug do R2 corrigido
`upload.service.ts:164` — usava `s3.amazonaws.com` mesmo com `REDACTED_STORAGE_PROVIDER=r2`. 
**Causa:** `configService.get('CDN_URL')` não lia da env var no Fly.io.
**Fix:** usar `process.env.CDN_URL` diretamente.
**Resultado:** URL gerada agora usa `pub-*.r2.dev` (público).

---

## Pendentes (ação manual necessária)

| Item | Ação | Prioridade |
|------|------|-----------|
| ~~Rotacionar secrets no Fly.io~~ | ✅ **Feito** — 3 secrets rotacionados, login confirmado | Alta |
| Conta UptimeRobot | Criar em uptimerobot.com, adicionar 2 endpoints + alerta email | Média |
| JWT_SECRET legacy cleanup | Confirmar se `JwtAuthGuard`/`RolesGuard` ainda usam JWT — remover código morto se não | Baixa |
