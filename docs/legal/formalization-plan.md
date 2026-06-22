# Playmorrow — Legal & Formalização (Plano)

Este documento registra os passos necessários para formalizar o Playmorrow como
empresa. Nada aqui é vinculativo — é um plano de ação para quando o projeto
estiver pronto para produção.

---

## 1. Entidade legal

Opções recomendadas (escolher conforme localização):

| País | Estrutura | Custo | Tempo | Notas |
|------|-----------|-------|-------|-------|
| Brasil | MEI (individual) | ~R$70/mês | 1 semana | Faturamento ≤ R$81k/ano |
| Brasil | LTDA (Simples Nacional) | ~R$1.500 (contador) | 2-4 semanas | Melhor para startup com investimento |
| Portugal | Unipessoal Lda | ~€500 | 2-4 semanas | Precisa de contabilista certificado |
| Reino Unido | Ltd via Companies House | £12 | 24h | Mais rápido e barato, ideal para SaaS global |
| EUA | Delaware C-Corp via Stripe Atlas | $500 | 1-2 semanas | Padrão para startups com investidores |

**Recomendação inicial:** Reino Unido Ltd (rápido, barato, reconhecido globalmente)
ou MEI no Brasil (se o mercado for nacional).

## 2. Contratos essenciais (antes do lançamento)

### [ ] Terms of Service (ToS)
- Definição do serviço: "plataforma de descoberta e social para jogos indie"
- Direitos do usuário: criar perfil, publicar conteúdo, seguir estúdios
- Propriedade intelectual: usuário mantém direitos sobre o conteúdo que publica;
  Playmorrow mantém direitos sobre o código, marca e plataforma
- Restrições: spam, conteúdo ilegal, violação de direitos autorais
- Isenção de responsabilidade: Playmorrow não se responsabiliza por conteúdo de
  terceiros
- Rescisão: Playmorrow pode remover conteúdo e banir usuários que violarem os ToS
- Lei aplicável e foro

### [ ] Privacy Policy (LGPD / GDPR)
- Dados coletados: email, username, display name, avatar, bio, conteúdo publicado
- Base legal: consentimento (cadastro), execução contratual (operação da plataforma)
- Compartilhamento: não vendemos dados. provedores de infraestrutura (Vercel,
  Neon, etc.)
- Direitos do usuário: acesso, correção, exclusão, portabilidade
- Cookies: apenas o necessário para autenticação (httpOnly session cookie)
- Retenção: dados mantidos enquanto a conta estiver ativa + 90 dias após exclusão
- LGPD: direito de solicitar exclusão a qualquer momento (art. 18)

### [ ] Acceptable Use Policy (AUP)
- Proibido: spam, assédio, upload de malware, violação de direitos autorais
- Proibido: scraping, engenharia reversa, tentativa de acesso não autorizado
- Proibido: publicar keys de jogos, links de pirataria ou conteúdo adulto

## 3. Propriedade intelectual

### Marcas
- [ ] Registrar "Playmorrow" como marca de software (classe 9) e serviços (classe 42)
  - INPI (Brasil): ~R$300/classe
  - EUIPO (UE): ~€850
  - UKIPO (Reino Unido): ~£200
- [ ] Registrar domínio playmorrow.com (ou .games, .io)

### Código
- Licença atual: **All Rights Reserved** (proprietário)
- Ninguém pode usar, copiar, modificar ou distribuir o código sem autorização
- [ ] Contrato de cessão de direitos autorais se houver múltiplos desenvolvedores
- [ ] NDAs para contractors/freelancers

## 4. Infraestrutura (produção)

### Contas separadas (empresariais, não pessoais)
- [ ] Vercel (ou Cloudflare Pages) — hospedagem do frontend
- [ ] Neon / Supabase — banco de dados PostgreSQL
- [ ] Resend / SendGrid — email transacional (verificação, reset)
- [ ] Stripe — pagamentos (se houver planos premium no futuro)
- [ ] GitHub — repositório privado
- [ ] Domínio + DNS

### Segurança
- [ ] Remover .env do git (já feito parcialmente)
- [ ] Configurar secrets via Vercel/Neon dashboard, não via arquivos
- [ ] HSTS + CSP + HTTPS-only em produção
- [ ] Rate limiting reforçado (já implementado)
- [ ] Session httpOnly cookie (já implementado)
- [ ] Audit log de ações sensíveis

## 5. Antes do lançamento público

### Checklist
- [ ] Empresa registrada e CNPJ/NIF ativo
- [ ] Conta bancária empresarial
- [ ] ToS + Privacy Policy + AUP publicados no site
- [ ] Domínio próprio configurado com HTTPS
- [ ] Repositório GitHub privado
- [ ] Secrets de produção (não .env) configurados
- [ ] Remover dados de teste/placeholder do banco
- [ ] Contratar advogado para revisão dos contratos
- [ ] Configurar monitoramento e logging (Sentry, Logtail, etc.)
- [ ] Revisão de segurança por terceiro (pentest)

---

> **Status:** ⏳ Planejamento. Nenhuma ação legal foi tomada ainda.
> Este documento será ativado quando o projeto estiver pronto para produção.
