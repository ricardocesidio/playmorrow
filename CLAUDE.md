# Playmorrow — Project Overview for Claude

## O que é
Playmorrow é uma plataforma social de descoberta de jogos indie. Estúdios compartilham devlogs, roadmaps e comunidades; players descobrem jogos antes do lançamento.

**Status:** Beta • 822 commits • Eng. Score: 86/100

---

## Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 15 (App Router) + React 19 + Tailwind CSS v4 + TanStack Query |
| Backend | NestJS + TypeScript (porta 4000) |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Auth | Session-based (httpOnly cookies) + OAuth (Google, GitHub) |
| Security | CSRF HMAC global, CSP nonce, argon2id, rate limiting, DOMPurify |
| Monorepo | pnpm workspaces + Turborepo |
| Deploy | Vercel (frontend) + Railway (API) |

## Estrutura do Monorepo

```
playmorrow/
├── apps/
│   ├── web/          # Next.js frontend
│   │   ├── app/      # App Router pages (30+ rotas)
│   │   └── components/  # Componentes compartilhados
│   └── api/          # NestJS backend (27+ módulos)
│       └── src/
│           ├── auth/        # Auth, OAuth, JWT
│           ├── common/      # Guards, decorators, EventBus
│           ├── games/       # CRUD de jogos
│           ├── studios/     # CRUD de estúdios
│           ├── devlogs/     # Devlogs com editor rich text
│           ├── feed/        # Feed engine + eventos
│           ├── comments/    # Comentários e reações
│           ├── notifications/  # Notificações SSE + push + email
│           ├── analytics/   # Event tracking + dashboards
│           ├── goals/       # Metas + achievements
│           ├── support/     # Sistema de tickets
│           ├── help/        # Central de ajuda CMS
│           ├── verification/ # Verificação de estúdio
│           └── uploads/     # Upload de arquivos
├── packages/
│   └── database/     # Prisma schema + migrations
└── docs/
    ├── handoff/      # Documentos de handoff
    └── superpowers/  # Specs de design
```

## Features Completas (4 Milestones)

### M1: Suporte
- Sistema de tickets com status workflow
- Fila admin com busca e filtros
- Notificações por email
- Números sequenciais (PM-2026-XXXXXX)

### M2: Central de Ajuda
- Plataforma de documentação com CMS
- 8 categorias, 19 artigos seed
- Busca full-text
- Feedback de artigos

### M3: Analytics
- Event tracking (views, follows, wishlists)
- Dashboards com gráficos (recharts)
- Time-series 7d/30d/90d
- Fontes de tráfego + países

### M3.5: Inteligência
- Event Bus central (emit/on tipado)
- Activity Timeline (17 tipos de evento)
- 12 metas de estúdio + 4 achievements
- Health Score (0-100)
- Relatórios semanais (cron segunda 8AM)

### M4: Verificação
- 6 tiers (UNVERIFIED → FEATURED_STUDIO)
- Trust Score determinístico (0-100)
- Company Profile (15 campos)
- Press Kit + Brand Kit
- Perfil de estúdio redesenhado

## Arquivos Chave

| Propósito | Caminho |
|---|---|
| Schema Prisma (40+ modelos) | `packages/database/prisma/schema.prisma` |
| Event Bus | `apps/api/src/common/event-bus.ts` |
| CSRF Guard | `apps/api/src/common/csrf.guard.ts` |
| Feed Engine | `apps/api/src/feed/feed-events.service.ts` |
| Game Detail | `apps/api/src/games/games.service.ts` |
| Devlog Service | `apps/api/src/devlogs/devlogs.service.ts` |
| Game Page | `apps/web/app/games/[slug]/page.tsx` |
| Homepage | `apps/web/app/page.tsx` |
| Site Header | `apps/web/components/site-header.tsx` |
| API Hooks | `apps/web/lib/api/hooks.ts` |
| API Client | `apps/web/lib/api/client.ts` |
| Auth Context | `apps/web/lib/api/auth-context.ts` |
| Footer | `apps/web/components/site-footer.tsx` |
| Logo + Beta | `apps/web/components/playmorrow/hud.tsx` |
| Globals CSS | `apps/web/app/globals.css` |

## Rotas Principais (30+)

- `/` — Homepage
- `/games` — Browse jogos
- `/games/[slug]` — Detalhe do jogo
- `/studios` — Browse estúdios
- `/studios/[slug]` — Perfil do estúdio (com selo de verificação)
- `/feed` — Feed ao vivo (auto-refresh 30s)
- `/devlogs/[id]` — Devlog em layout blog
- `/dashboard` — Dashboard do player/estúdio
- `/about` — Sobre
- `/contact` — Contato
- `/terms` — Termos de serviço
- `/privacy` — Política de privacidade
- `/cookies` — Política de cookies
- `/community-guidelines` — Diretrizes da comunidade
- `/help` — Central de ajuda
- `/support` — Suporte (tickets)
- `/login`, `/register` — Auth

## Sessão 17 (últimas mudanças)

- **Documentação:** README, STATUS, SECURITY, ARCHITECTURE reescritos
- **Footer duplicado:** Removido de 10 páginas (já estava no layout root)
- **Borda neon (cian↔coral):** Adicionada a About, Contact, Terms, Privacy, Cookies, Community Guidelines
- **Email:** Todos `@playmorrow.com` → `playmorrow@hotmail.com`
- **Testes:** 258 passam, 0 falhas (EventBusModule/NotificationsModule adicionados)
- **Beta badge:** Pill coral "Beta" ao lado do logo
- **Typecheck:** 6/6 • **Lint:** 0 erros

## Para Desenvolvimento Local

```bash
pnpm install
pnpm dev        # roda api:4000 + web:3000 em paralelo
pnpm typecheck  # typecheck dos 3 pacotes
pnpm lint       # lint do frontend
```
