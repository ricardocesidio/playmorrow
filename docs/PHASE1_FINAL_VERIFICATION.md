# Playmorrow — Phase 1 Final Verification

**Date:** 2026-07-28
**Status:** ✅ Merged em `main` • 830+ commits
**API:** https://playmorrow-api-aged-mountain-9542.fly.dev (Fly.io, Amsterdam)
**Frontend:** https://playmorrow.vercel.app (Vercel)
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
| Cloudflare R2 | ✅ Ativo (uploads vão para o bucket, URL com domínio R2) |
| Fly.io | ✅ API no ar, health 200, 2 machines |
| Vercel | ✅ Frontend no ar, API_URL aponta para Fly.io |
| Test DB isolation | ✅ Postgres.app local (playmorrow_test) |
| VAPID keys | ✅ Setados no Fly.io |
| Monitoramento | ❌ Não configurado — recomendado UptimeRobot |

---

## Hosting — Fly.io

**API:** https://playmorrow-api-aged-mountain-9542.fly.dev
**Custo:** Free tier (512MB RAM, 1 CPU, 2 machines, 24/7) — zero enquanto dentro do limite.
**Cartão:** Adicionado pelo usuário na página de billing do Fly.io.
**Reversível:** Código não mudou — roda em qualquer host Node.js/Docker.

### Login end-to-end confirmado

```bash
curl -X POST https://playmorrow-api-aged-mountain-9542.fly.dev/api/auth/session/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"final-test-1785243911@e.com","password":"Test1234!"}'
# → 200 OK + Set-Cookie: playmorrow_session=... + csrfToken no body
```

---

## Cloudflare R2 — Bug Encontrado e Corrigido

### Diagnóstico

Confirmei via `flyctl ssh console` que `REDACTED_STORAGE_PROVIDER=r2` estava correto no container. O bug era no código:

**`apps/api/src/upload/upload.service.ts:164` (antes):**
```ts
const publicUrl = this.configService.get('CDN_URL') || `https://${this.s3Bucket}.s3.amazonaws.com`;
// ↑ Ignorava o R2 — sempre montava URL no formato S3
```

**Depois da correção:**
```ts
const r2Endpoint = this.configService.get('REDACTED_R2_ENDPOINT');
const publicUrl = this.configService.get('CDN_URL')
  || (REDACTED_STORAGE_PROVIDER === 'r2' && r2Endpoint ? `${r2Endpoint}/${this.s3Bucket}` : `https://${this.s3Bucket}.s3.amazonaws.com`);
// ↑ Quando REDACTED_STORAGE_PROVIDER=r2, usa o endpoint do R2
```

### Upload confirmado

```bash
curl -X POST https://playmorrow-api-aged-mountain-9542.fly.dev/api/upload \
  -F "file=@test-image.png" \
  -H "Cookie: playmorrow_session=..." \
  -H "X-CSRF-Token: ..."
# → URL: https://6b62141bc0748171281c4ca9cbc53c4d.r2.cloudflarestorage.com/playmorrow-uploads/uploads/...
```

A URL contém `r2.cloudflarestorage.com` (não `s3.amazonaws.com`).

### Bucket público — ✅ Ativo

```bash
curl -I https://pub-8e4503584d934d1b8cd18803fdc34ecc.r2.dev/uploads/1785240096038-ahh3pb.png
# → 200 OK, Content-Type: image/png
```

O bucket está público e acessível sem autenticação. CDN_URL configurado no Fly.io para usar o domínio público do R2.

---

## Incidentes

### API Offline (24/07 a 27/07)
**Causa:** Trial do Railway expirou. Sem monitoramento de uptime.
**Duração:** ~3 dias.
**Resolução:** Migração para Fly.io.

### Credenciais R2 Expostas (corrigido)
**Ocorrência:** Commit `3670e91` incluiu valores truncados de secrets no relatório.
**Ação:** Token revogado, novo gerado, Railway atualizado, arquivo limpo.
**Regra:** Adicionada ao `CLAUDE.md` — nunca expor secrets, nem truncados.

---

## Secrets + Rate Limiting

| Secret | Status |
|--------|--------|
| `JWT_SECRET` | ✅ Pre-existente, não rotacionado |
| `SESSION_SECRET` | ✅ Pre-existente, não rotacionado |
| `CSRF_SECRET` | ✅ Pre-existente, não rotacionado |

**Rate limiting testado:**
```bash
# Login (10/min)
401 401 401 401 401 401 401 401 401 401 429 429 429 429 429
# Register (60/min global)
201 201 201 201 201 429 ← após 5 registros
```

---

## Build

- Typecheck: 6/6 ✅
- Lint: 0 errors, 50 warnings ✅
- Testes: 17/17 files, 263 pass, 1 skip ✅
