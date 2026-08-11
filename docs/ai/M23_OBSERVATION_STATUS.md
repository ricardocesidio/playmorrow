# M23 — Observation Status: Kill Switch, North Star, 25% Decision

**Date:** 2026-08-10 (day 1 of observation freeze)
**Status:** Active observation — no toggles performed this sprint (freeze policy §11)

---

## 1. Kill Switch Re-Verification (Evidence-Based, No Toggling)

Per `M23_OBSERVATION_FREEZE.md` §11, the kill switch is verified **without**
repeatedly toggling production. Evidence:

| Requirement | Evidence | Status |
|---|---|---|
| `RECOMMENDATIONS_ENABLED=false` → M23 → legacy/fallback | Verified in production 2026-08-10 (Session 29): `GET /for-you` returned `method:"legacy"` after flag set; unit test `returns legacy result when rollout is disabled` | ✅ |
| `RECOMMENDATIONS_ENABLED=true` → restores M23 | Verified 2026-08-10: normal operation restored; flag currently `true` (confirmed via `flyctl secrets list`) | ✅ |
| Config source of truth | `ai.config.ts:70` — `config.get('RECOMMENDATIONS_ENABLED','true') !== 'false'` | ✅ |
| Zero-deploy | Env change on Fly.io host; no code deploy needed | ✅ |
| Rollout gate fallback | `ROLLOUT_PCT=0` also disables hybrid (secondary kill) | ✅ |

**Decision:** Kill switch remains functional per existing evidence. No toggle
performed during the freeze — avoids unnecessary production churn.

---

## 2. AI North Star Preservation

**North Star:** *"Playmorrow always finds the game I didn't even know I wanted."*

### Observation framing (per freeze §12)

The gate question is NOT "did users interact with AI?" — it is
**"did M23 improve game discovery?"** Evaluation dimensions mapped to metrics:

| Dimension | Metric | Measure |
|---|---|---|
| Relevance | CTR | Clicked impressions share |
| Discovery (new games) | Diversity | Unique games ÷ impressions |
| Wishlist intent | Wishlist conversion | WISHLISTED ÷ impressions (expected INSUFFICIENT DATA — frontend not wired) |
| Satisfaction proxies | Repeat usage, opt-in | % bucket opting in |
| Dismissal behavior | Dismissal rate | DISMISSED ÷ impressions |
| Serendipity | Hidden-gem/fresh reason share | `reasonType=hidden-gem|fresh` share of items |

**Rule:** Engagement alone (clicks) is insufficient proof of discovery value. A
promotion decision requires signals of *relevance + breadth*, not just clicks.

### Current evidence status

| Evidence | Status |
|---|---|
| Architecture supports North Star | ✅ (NORTH_STAR_EVIDENCE.md — engineering PASS) |
| Production discovery evidence | ⬜ PENDING — catalog empty (0 games); **INSUFFICIENT DATA** expected at gate unless games published |
| Catalog root cause | 🔴 Identified (2026-08-10): **no product path sets `Game.isPublished=true`** — no publish workflow exists in the product. See [`M23_CATALOG_READINESS.md`](M23_CATALOG_READINESS.md) §4. Classified as a **product/platform issue**, NOT an M23 defect. Fix is outside M23 (publish-workflow feature), not by altering the recommendation engine. |

---

## 3. 25% Decision Definition (Applied at 2026-08-17)

Per freeze §13, exactly one outcome:

| Outcome | Trigger |
|---|---|
| 🟢 **PROMOTE → 25%** | Production stable + security clean + cost in governance + instrumentation trustworthy + no blocking finding + sufficient behavioral data + **objective product metrics meet predefined criteria** (CTR threshold, diversity, dismissal, opt-in) |
| 🟡 **EXTEND 5% OBSERVATION** | System healthy but metrics inconclusive / sample insufficient / control inadequate / more observation needed. **Do NOT promote on engineering metrics alone.** |
| 🔴 **ROLLBACK / PAUSE** | Security/privacy risk / reliability degradation / abnormal cost / UX harm / data quality unreliable / governance violation |

**Expected outcome (honest forecast):** Given the empty production catalog,
the likely 25% decision on 2026-08-17 is **🟡 EXTEND 5% OBSERVATION** with
INSUFFICIENT DATA on discovery metrics — unless games are published during the
window. This is the correct, evidence-honest outcome.

---

## 4. Next Milestone Policy

Per freeze §14, **no next AI milestone begins** (M22/M24/M25/M26) until the 25%
gate is evaluated. The next capability is selected **using M23 evidence**, not
the previous roadmap alone.
