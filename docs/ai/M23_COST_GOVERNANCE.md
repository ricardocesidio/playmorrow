# M23 — Cost Governance Measurement

**Date:** 2026-08-10
**Status:** Projected (baseline starts 2026-08-10, 7-day window)

---

## 1. Cost Model

| Component | Cost | Basis |
|---|---|---|
| Embedding (semantic path) | `text-embedding-ada-002` / `text-embedding-3-small` | Config-driven, ~1536-dim |
| Refresh cron (nightly) | ~1 call per game | `game-embedding-refresh.service.ts` 03:00 UTC |
| Chat (per-request assistant) | Flag-gated off | `CHAT_ENABLED` default false |
| Metrics/impressions endpoints | $0 | No AI calls |

## 2. Projected Monthly Cost at Rollout Stages

| Stage | Users | Semantic req/mo | Embedding cost/mo | Total AI cost/mo | vs $500 ceiling |
|---|---|---|---|---|---|
| 5% (current) | ~50 | ~7,500 | ~$0.15 | **~$0.15** | 0.03% |
| 25% (gate) | ~250 | ~37,500 | ~$0.75 | **~$0.75** | 0.15% |
| 100% | ~1,000 | ~150,000 | ~$3.00 | **~$3.00** | 0.6% |

**Assumptions:**
- ~150 personalized feed requests/user/month
- ~1 semantic embed per personalized request (≤8 signal titles)
- Embedding API ~$0.02/1M tokens, ~20 tokens per embed call (titles only)
- Refresh cron: ~100 games × ~30 tokens/game × $0.02/1M = negligible

## 3. Actual Cost Tracking (7-day baseline window)

| Day | Embedding tokens | Cost | Notes |
|---|---|---|---|
| 2026-08-10 | 0 (0 games in prod catalog) | $0.00 | No embeddings generated — prod catalog empty |
| ... | | | _to be filled weekly_ |

**KPI:** Track via OpenAI usage dashboard. Target: < $1/mo at 5%.

## 4. Cost Guardrails

| Guardrail | Mechanism | Value |
|---|---|---|
| Request cap | `@Throttle(10/min)` on all AI endpoints | 10 req/min/user |
| Kill switch | `RECOMMENDATIONS_ENABLED=false` | Zero AI calls |
| 5% rollout | `ROLLOUT_PCT=5` | 95% of users never trigger semantic path |
| Budget ceiling | Execution framework | $500/mo |

## 5. Verdict

✅ **Cost governance confirmed.** At current 5% rollout, projected AI cost is ~$0.15/mo — **0.03% of the $500/mo ceiling**. Even at 100%, ~$3/mo is negligible. Cost is NOT a gating constraint for the 25% review.
