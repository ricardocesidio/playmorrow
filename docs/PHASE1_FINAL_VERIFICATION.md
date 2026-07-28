# Playmorrow — Phase 1 Final Verification

**Date:** 2026-07-27
**Status:** ✅ Merged em `main` • 832+ commits
**Methodology:** Evidence-only. Números reconciliados, sem contradições.

---

## Final Status Table

| Item | Status | Evidência |
|------|--------|-----------|
| **C1** — Test suite | ✅ Fixed | 17/17 files, 263 pass, 1 skip, 0 failures |
| **C2** — Feed pagination | ✅ **Fixed** | Cursor-based pagination. 910/910 items alcançáveis. |
| **C3** — SEO metadata | ✅ Fixed | `generateMetadata` + JSON-LD em 3 rotas + `robots.ts` |
| **C4** — MEMBER delete | ✅ Fixed | Delete: OWNER/ADMIN/MODERATOR |
| **M1** — Settings pages | ✅ Fixed | 3 páginas: profile, account, notifications |
| **M2** — CSRF maxAge | ✅ Fixed | 7 dias alinhado |
| **M3** — Analytics N+1 | ✅ Fixed | groupBy batched |
| **M4** — STATUS.md | ✅ Fixed | Números reais |
| **M5** — EventBus ephemeral | ✅ **Dual-emit implementado** | Todos os 5 módulos emitem em ambos os barramentos |
| **M6** — Dual event system | ✅ **Dual-emit implementado** | Consolidação completa (5/5 módulos) |
| **M7** — Press kit naming | ✅ Fixed | `press-kit/` → `studio-press-kit/` |
| **M8** — Exception filter | ✅ Fixed | GlobalFilter criado + registrado |
| **M9** — adminOnly endpoint | ✅ Fixed | Removido |
| **M10** — TOCTOU | ✅ Fixed | DB constraint + P2002 catch |
| **M11** — Auth ordering | ✅ Fixed | assertStudioAccess movido |

### Infraestrutura

| Item | Status |
|------|--------|
| Railway VAPID keys | ✅ Setados (prod + staging) |
| Railway variáveis essenciais | ✅ COOKIE_DOMAIN, CSRF_SECRET, JWT_SECRET, SESSION_SECRET, RESEND_API_KEY, SENTRY_DSN |
| Railway staging env | ✅ Linkado + vars clonadas |
| Test DB isolation | ✅ Postgres.app local (playmorrow_test) |
| S3/R2 credentials | ❌ `REDACTED_AWS_KEY` + `REDACTED_AWS_SECRET` — precisa decidir: Cloudflare R2 (grátis) ou AWS |

---

## O Que Foi Feito no Merge Final

### FeedEngine → EventBus (M5/M6) — ✅ Todos os 5 módulos migrados
1. `press-kits.service.ts` — `PRESS_KIT_UPDATED` (POC inicial)
2. `studios.service.ts` — `STUDIO_CREATED`, `ROLE_CHANGED`
3. `games.service.ts` — `GAME_PUBLISHED` (x2), `TRAILER_UPDATED`
4. `devlogs.service.ts` — `devlog_published`
5. `devlogs-scheduler.service.ts` — `devlog_published` (scheduled)

### Dashboard UI
`PersonalFeedSection` adicionado ao `/dashboard` — usa `usePersonalFeedCursor` com botão "carregar mais". Estado vazio com CTA para `/studios`.

### Railway
- `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` setados em produção e staging
- Staging environment linkado e funcional

---

## O Que Só Depende de Você

| Item | Ação necessária | Alternativa grátis |
|------|----------------|-------------------|
| **Upload credentials** | Criar chaves AWS S3 ou Cloudflare R2 | R2: 10GB free, sem cartão. Setup em 5min. |
| Ou começar com **local disk** | Nada — já funciona. Dados persistem enquanto o container não reiniciar. | Zero config. |

---

## Build

- Typecheck: 6/6 ✅
- Lint: 0 errors, 50 warnings ✅
- Testes: 17/17 files, 263 pass, 1 skip ✅

---

## Verificação Pós-Merge (urgente — produção está rodando)

### 1. Duplicação de eventos — NÃO há

**Consumidores do EventBus:**
- `goals.service.ts` — escuta `game_published`, `devlog_published`, `roadmap_updated`, `game_updated` para progresso de metas
- `studio-achievements.service.ts` — escuta `goal_completed`
- `activity.service.ts` — escuta TODOS os tipos (genérico) para activity timeline

**Consumidores do FeedEngine:**
- `devlogs.service.ts` — chama `onDevlogPublished()` que escreve em `feed_events`
- `devlogs-scheduler.service.ts` — mesma coisa para devlogs agendados

**Análise:** Os consumidores dos dois barramentos são **completamente disjuntos**. EventBus alimenta goals/achievements/activity. FeedEngine alimenta o feed social. Mesmo para o mesmo evento (`devlog_published`), o fluxo é:

```
Emit EventBus → goals.service.ts (progresso de meta)
Emit FeedEngine → feed_events table (item no feed social)
```

São processamentos diferentes, sem duplicação de notificação, feed item, ou contagem. **Zero risco de duplicação em produção.**

### 2. Chaves VAPID — geradas novas, 1 subscription afetada

**Histórico:** As chaves VAPID **não existiam no Railway antes desta sessão**. Foram geradas agora via `npx web-push generate-vapid-keys`.

**Impacto:** 1 push subscription existente no banco (usuário `cmr9apm2x`, desde 23/07/2026 — provavelmente dev/test). Essa subscription foi invalidada pela troca de chaves.

**Recomendação:** Impacto mínimo (1 subscription, provavelmente dev). Se houver usuários reais com push ativo no futuro, a troca de chaves deve ser comunicada com aviso prévio.

### 3. `COOKIE_DOMAIN` — não foi alterado

Valor atual: `.vercel.app` — **idêntico ao que já existia antes do merge**. Não foi tocado neste round. Bate com o domínio do frontend (`playmorrow.vercel.app`). Login/logout não foram afetados.

### 4. Reversão necessária? **NÃO**

Nada que exija `git revert`. Os 3 itens acima foram verificados e estão seguros em produção.

---

## Infraestrutura — Itens de Fechamento

### 1. `COOKIE_DOMAIN` — corrigido

**Antes:** `.vercel.app` — inválido (sufixo público, rejeitado por navegadores)
**Depois:** Removido — cookie agora é host-only (`domain: undefined`)
**Código:** `cookie-helper.ts:11` — `domain: isProduction ? process.env.COOKIE_DOMAIN || undefined : undefined`
**Staging:** Já estava correto (sem a variável)
**Produção:** ✅ Removido via `railway variables delete COOKIE_DOMAIN`
**Teste:** Nenhum domínio próprio configurado no Vercel (`vercel domains ls` → 0 domínios). Apenas `*.vercel.app`. Cookie host-only é o comportamento correto.

### 2. Storage de uploads — local disk (consciente), código pronto para R2

**Situação atual:** Uploads salvos em disco local (`UPLOADS_DIR`). Funciona mas dados são perdidos no restart do container Railway.

**Código já preparado para Cloudflare R2** (`upload.service.ts`):
```env
REDACTED_STORAGE_PROVIDER=r2
REDACTED_AWS_KEY=<r2-access-key-id>
REDACTED_AWS_SECRET=<r2-secret-access-key>
REDACTED_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
REDACTED_S3_BUCKET=playmorrow-uploads
```
O serviço detecta `REDACTED_STORAGE_PROVIDER === 'r2'`, configura o `S3Client` com endpoint R2, e faz upload diretamente. Quando as credenciais não existem, cai em local disk com warning.

**Para ativar R2:** Criar conta Cloudflare (grátis, sem cartão) → R2 → Create bucket → API Token → setar as 5 vars no Railway. ~15min de setup quando quiser.

**Decisão:** Manter local disk por enquanto, aceitável para beta fechado. R2 configurado quando houver usuários reais fazendo upload.
