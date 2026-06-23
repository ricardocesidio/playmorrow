# Playmorrow — Plano de Ação: Dev → Produção → Empresa

Status atual: **v0.7 — MVP funcional, pré-produção.** Build, lint, typecheck, testes tudo verde.
31/34 issues resolvidos, segurança implementada (session auth, CSP, rate limiting, Argon2).

---

## Fase 0: Legal & Fundação (1-2 semanas)
**Objetivo: existir legalmente antes de ter usuários reais.**

- [ ] **Registrar empresa**
  - Brasil: MEI (se faturamento ≤ R$81k/ano) — ~R$70/mês, 1 semana
  - Portugal: Unipessoal Lda — ~€500, 2-4 semanas
  - UK: Ltd via Companies House — £12, 24h (recomendado para SaaS global)
  - Alternativa: Stripe Atlas (US Delaware C-Corp) — $500, 1-2 semanas

- [ ] **Abrir conta bancária empresarial**
  - Wise Business / Revolut Business / Neon (Brasil)

- [ ] **Contratar contador** (essencial para emissão de notas fiscais)

- [ ] **Publicar Termos de Serviço + Política de Privacidade**
  - Arquivos rascunho em `docs/legal/formalization-plan.md`
  - Precisa de advogado especialista em LGPD/GDPR
  - Serviços online: Termly, iubenda, ou Fivem para freelancer jurídico

- [ ] **Registrar domínio** (playmorrow.com, playmorrow.games, ou similar)
  - Namecheap, Cloudflare Domains, ou Porkbun (~$10-15/ano)

- [ ] **Registrar marca "Playmorrow"**
  - INPI (Brasil): ~R$300/classe 9 e 42
  - EUIPO (UE): ~€850
  - UKIPO (Reino Unido): ~£200

---

## Fase 1: Infraestrutura de Produção (1 semana)
**Objetivo: ambiente seguro e escalável.**

### Frontend (Next.js)
- [ ] **Deploy na Vercel** (gratuito para começAR)
  - Conectar repositório GitHub
  - Configurar `NEXT_PUBLIC_API_URL` para produção
  - Configurar `NEXT_PUBLIC_SITE_URL` com o domínio
  - Configurar variáveis de ambiente no Vercel Dashboard (nunca no .env)

### Backend (NestJS)
Opção A: **Render.com** (mais simples, ~$7-15/mês)
Opção B: **Railway.app** (~$5-20/mês)
Opção C: **Fly.io** (~$2-10/mês)
Opção D: **DigitalOcean App Platform** (~$12/mês)

- [ ] Criar Dockerfile para a API (multistage build)
- [ ] Configurar variáveis de ambiente no dashboard
- [ ] Configurar domínio customizado + HTTPS

### Banco de Dados
- [ ] **Neon** (PostgreSQL serverless, ~$0-19/mês) — recomendado
  - Alternativa: Supabase (gratuito até 500MB)
- [ ] Rodar `pnpm db:migrate` no banco de produção
- [ ] Configurar backup automático

### Email
- [ ] **Resend** (gratuito até 100 emails/dia) — recomendado
  - Alternativa: SendGrid, Mailgun, Amazon SES
- [ ] Configurar domínio para envio de emails (SPF, DKIM, DMARC)
- [ ] Testar: verificação de email, password reset

### Monitoramento
- [ ] **Sentry** (gratuito até 5k eventos/mês) — erro tracking
- [ ] **Better Stack** (gratuito) — uptime monitoring

---

## Fase 2: Preparação do Site (1-2 semanas)
**Objetivo: site pronto para receber usuários.**

- [ ] **Configurar domínio no Vercel** + SSL/HTTPS automático
- [ ] **Robots.txt + Sitemap.xml** (SEO)
  - Instalar `next-sitemap` ou criar manualmente
- [ ] **Configurar analytics** (Plausible, Umami, ou Google Analytics 4)
- [ ] **Testar fluxo completo de cadastro**:
  - Registro → email de verificação → login → criar studio → criar game → criar devlog
- [ ] **Testar fluxo de password reset**
- [ ] **Testar em mobile + desktop** responsivo
- [ ] **Corrigir últimos erros do audit** (opcional mas recomendado):
  - E2E mocks: remover localStorage JWT seeding
  - Adicionar `apple-touch-icon` + `favicon.ico`

### Ambiente de staging (opcional)
- [ ] Criar branch `staging` no GitHub
- [ ] Deploy separado (staging.playmorrow.com) para testes
- [ ] Testar migrations antes de rodar em produção

---

## Fase 3: Conteúdo & Presença (2-4 semanas)
**Objetivo: construir credibilidade antes de chamar estúdios.**

- [ ] **Criar perfil do Playmorrow na plataforma**
  - Studio "Playmorrow" com descrição
  - Game "Playmorrow" — devlog contando a história do desenvolvimento

- [ ] **Publicar 3-5 devlogs** sobre:
  1. "Why we built Playmorrow" — visão e propósito
  2. "Tech stack" — o que usamos e por que
  3. "Roadmap" — o que está por vir

- [ ] **Criar presença no Twitter/X** (@playmorrow)
  - Postar 1x/dia sobre jogos indie, devlogs, etc.
  - Seguir estúdios indie, game devs, publishers

- [ ] **Criar página de landing/pricing** (se for monetizar)
  - Plano gratuito: 1 studio, 3 games
  - Plano Pro: múltiplos studios, analytics, prioridade

---

## Fase 4: Aquisição de Estúdios (contínuo)
**Objetivo: 10 estúdios ativos no primeiro mês.**

### Abordagem manual (mais efetiva no começo)
- [ ] **Listar 50 estúdios indie** que você admira / conhece
  - Itch.io, Steam próximos lançamentos, Twitter/Bluesky
- [ ] **Abordar individualmente** por DM/email:
  ```
  "Oi [Nome], sou founder do Playmorrow — uma plataforma social
  para estúdios indie compartilharem devlogs e roadmaps.
  Admiro o trabalho de vocês em [jogo] e adoraria ter vocês
  como early adopters. É gratuito, sem compromisso.
  Posso te mandar o link?"
  ```
- [ ] **Oferecer benefício exclusivo** para primeiros usuários:
  - "Plano Premium gratuito para sempre" para os 10 primeiros
  - Destaque na homepage do Playmorrow

### Marketing de conteúdo
- [ ] **Postar devlogs do Playmorrow** no Twitter/Reddit/Bluesky
- [ ] **Participar de game jams** (Ludum Dare, GMTK, Global Game Jam)
  - Oferecer o Playmorrow como ferramenta para participantes
- [ ] **Criar "Best of indie devlogs"** — curadoria semanal dos melhores devlogs

### Parcerias
- [ ] **Game jams** — patrocinar ou apoiar com divulgação
- [ ] **Publishers pequenos** — oferecer plataforma para seus estúdios
- [ ] **Faculdades de game design** — plataforma gratuita para alunos

---

## Fase 5: Métricas & Iteração (contínuo)
**Objetivo: entender o que funciona e melhorar.**

- [ ] **Definir métricas chave**:
  - Usuários registrados / ativos por semana
  - Studios cadastrados
  - Devlogs publicados
  - Follows / reações / comentários

- [ ] **Coletar feedback dos estúdios** semanalmente
  - O que está faltando?
  - O que está confuso?
  - O que está quebrado?

- [ ] **Priorizar features com base no feedback**
  - Ex: analytics para estúdios, embed para sites próprios, API pública

---

## Timeline estimada

| Fase | Duração | Custo estimado |
|------|---------|----------------|
| Fase 0 — Legal | 1-2 semanas | £12-500 (empresa) + ~R$300-2000 (marcas) + ~R$2000-5000 (advogado ToS) |
| Fase 1 — Infra | 1 semana | $0-20/mês (Vercel + Neon + Resend) |
| Fase 2 — Site | 1-2 semanas | $10-15/ano (domínio) |
| Fase 3 — Presença | 2-4 semanas | $0 (Twitter, devlogs) |
| Fase 4 — Aquisição | Contínuo | $0 (abordagem manual) |

**Custo total para começar:** ~$50-200 + honorários advocatícios
**Custo mensal de operação:** ~$0-30/mês (pode rodar free tier)

---

## Risco zero

Você pode começar pelas **Fases 1 e 2** (infra + site) sem gastar nada, usando:
- Vercel free tier
- Neon free tier (0.5GB)
- Resend free tier (100 emails/dia)
- Domínio .com (~$10/ano)

Isso já te dá um site funcional em produção. As fases 3 e 4 você faz no seu ritmo.

Quer começar pela **Fase 1 — Deploy em produção?** Posso ajudar com o Dockerfile, config da Vercel e setup do Neon.
