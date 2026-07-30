# M18 — Funding Platform: Scope Decision

**Date:** 2026-07-30
**Status:** Final

## Legal Context

"Investment Requests", "Investor Profiles", and "Funding Campaigns" with equity/return connotations are regulated as securities in most jurisdictions (Reg CF in the US, ECSP in the EU). Operating a marketplace connecting "investors" to "studios seeking funding" without proper registration is illegal in those jurisdictions.

## Decision

M18 will be implemented as **reward-based crowdfunding** (Kickstarter model), NOT equity/debt crowdfunding:

| Model | Status | Why |
|-------|--------|-----|
| Reward-based crowdfunding | ✅ Prossegue | Apoiador contribui, recebe recompensa não-financeira (cópia do jogo, acesso antecipado, item cosmético). Isso é comércio comum. |
| Grants/Sponsorships | ✅ Prossegue | Grants (dinheiro sem expectativa de retorno) e sponsorships (troca por visibilidade) são comercialmente simples. |
| Equity crowdfunding | ❌ Bloqueado | Exige registro/licença — não implementar até consulta jurídica explícita. |
| Investment profiles | ❌ Bloqueado | Mesma razão. |

## Encaminhamento

1. M18 re-escopo será detalhado em spec próprio quando chegar a vez na sequência (último milestone)
2. Nenhuma referência a "investidor", "equity", "retorno financeiro" será incluída em modelo de dado ou UI
3. Grants/sponsorships podem prosseguir com cautela normal
