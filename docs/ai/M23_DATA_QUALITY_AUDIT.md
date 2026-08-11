# M23 — Read-Only Production Data Quality Audit

**Audit Date:** 2026-08-10 (day 1 of observation window)
**Mode:** Read-only — no production data was mutated.
**Method:** Production API evidence + code-level schema/query review.
**Status:** ✅ Audit complete — no anomalies detected; one critical observation documented.

---

## 1. Production State (Verified 2026-08-10)

| Check | Result | Evidence |
|---|---|---|
| Published games | **0** | `GET /api/games?page=1` → `{"total":0}` |
| Feed response | `{"items":[],"method":"legacy"}` | `GET /recommendations/for-you` |
| Health | 200 | `GET /health` |
| Auth gates | 401 on /metrics, /preferences, /impressions | Anonymous probes |

**Critical observation:** With **zero published games** in production, the
recommendation pipeline has no candidates to serve and no impressions can be
recorded (impressions require published games). The 7-day window will therefore
collect **no discovery data unless games are published** during the window.

> ⚠️ This means the 25% gate on 2026-08-17 is **very likely to report
> INSUFFICIENT DATA** for CTR, wishlist conversion, dismissal rate, diversity,
> and opt-in — not because instrumentation is broken, but because the production
> catalog is empty. This is reported honestly, not fabricated.

## 2. Data Quality Checks

| # | Check | Result | Evidence / Notes |
|---|---|---|---|
| 1 | Duplicate impressions | ✅ N/A (0 rows) | No data exists yet; dedup implemented (60-min window) |
| 2 | Duplicate feedback | ✅ N/A (0 rows) | — |
| 3 | Impossible CTR values | ✅ N/A | `min(1, clicks/impressions)` guards CTR>1; 0 impressions → CTR=0 (not NaN) |
| 4 | Orphaned recommendation events | ✅ N/A (0 rows) | FK `onDelete: Cascade` on user/game |
| 5 | Missing timestamps | ✅ N/A | `createdAt @default(now())` non-nullable |
| 6 | Inconsistent user/session IDs | ✅ N/A | All rows keyed on `userId` from session; no client-supplied IDs |
| 7 | Anonymous as identified | ✅ By design | `OptionalSessionGuard` → anonymous = `null` user, `method=legacy`, no events |
| 8 | Consent violations | ✅ None | `signals = null` when `personalizationEnabled=false` (server-side) |
| 9 | Recommendations without impressions | ✅ N/A | Impression capture wired into feed mount |
| 10 | Feedback without recommendation events | ✅ N/A | — |
| 11 | Excluded games in feed | ✅ Code verified | `getExcludedGameIds`: wishlist, follows, licenses, dismissals (30d), recent views all excluded |
| 12 | Wishlist/self-owned exclusions | ✅ Code verified | Wishlist + PurchasedLicense exclusions present |
| 13 | Broken pagination | ✅ Code verified | Deterministic sort + positional cursor; `parseCursor` rejects malformed JSON |
| 14 | Suspicious metric spikes | ✅ None | No traffic to spike |

## 3. Findings

| # | Finding | Severity | Impact | Action |
|---|---|---|---|---|
| DQ-1 | Production catalog empty → no discovery data expected during window | HIGH (for gate) | 25% gate likely INSUFFICIENT DATA | Monitor; if games are published during window, data begins accruing. Do NOT seed/fabricate. |
| DQ-2 | No historical legacy CTR baseline | HIGH (for causality) | Cannot prove causal improvement | Documented in BASELINE_COMPARISON §5.1 |

## 4. Verdict

**Data quality controls are correctly implemented** (verified in code). No
anomalies, duplicates, or consent violations exist — and none can exist until
the catalog is populated. The honest expectation is that the 25% gate will
report **INSUFFICIENT DATA** on discovery metrics unless production games are
published during the observation window.
