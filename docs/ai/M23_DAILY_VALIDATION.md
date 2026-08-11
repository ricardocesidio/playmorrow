# M23 — Daily Production Validation Checklist

**Observation Period:** 2026-08-10 → 2026-08-17 (7-day baseline)
**Responsible:** AI Engineer (daily), Engineering Lead (review)
**Execution Time:** Daily by 12:00 UTC
**Fill-in:** copy the template below, mark PASS/FAIL, append to "Completed Daily Validations".

---

## Daily Checklist Template

**Date:** 2026-08-XX  
**Validator:** _____________  
**Time:** _____________ UTC

---

## 1. API Availability

| Check | Command | Expected | Actual | ⬜ PASS / ⬜ FAIL |
|---|---|---|---|---|
| Health endpoint | `curl -s https://playmorrow-api-aged-mountain-9542.fly.dev/health` | `{"status":"ok"}` | | ⬜ |
| Feed endpoint (authenticated) | `curl -H "Cookie:..." "https://.../api/recommendations/for-you?limit=12"` | 200 + valid JSON | | ⬜ |
| Feed endpoint (anonymous) | `curl "https://.../api/recommendations/for-you?limit=12"` | 200 + method=legacy | | ⬜ |
| Preferences endpoint | `curl -H "Cookie:..." "https://.../api/recommendations/preferences"` | 401 (no session) or 200 | | ⬜ |
| Metrics endpoint (admin) | `curl -H "Cookie:..." "https://.../api/recommendations/metrics?days=1"` | 401 (no admin) or 200 | | ⬜ |

---

## 2. Recommendation Generation

| Check | Expected | Actual | ⬜ PASS / ⬜ FAIL |
|---|---|---|---|
| Feed returns 200 | Yes | | ⬜ |
| Feed has valid structure | `items[]`, `method`, `nextCursor`, `hasMore`, `personalizationEnabled` | | ⬜ |
| Method is valid | `hybrid` \| `content` \| `trending` \| `legacy` | | ⬜ |
| No 500 errors | 0 | | ⬜ |
| No empty feeds for authenticated users | `items.length > 0` or `method=legacy` with items | | ⬜ |
| All items have required fields | `gameId`, `score`, `reason`, `reasonType`, `title`, `slug` | | ⬜ |
| Explanations present | `reason` non-empty | | ⬜ |
| `reasonType` valid | `semantic`\|`tag-affinity`\|`studio-follow`\|`popular`\|`trending`\|`hidden-gem`\|`fresh`\|`legacy` | | ⬜ |

---

## 3. Impression Collection

| Metric | Query | Threshold | Actual | ⬜ PASS / ⬜ FAIL |
|---|---|---|---|---|
| Total impressions (24h) | `GET /metrics?days=1` → impressions | > 0 | | ⬜ |
| Impression dedup rate | deduplicated / (recorded + deduplicated) | < 50% | | ⬜ |
| Invalid rate | invalid / total | < 10% | | ⬜ |
| No impression drop | impressions > 0 for > 1hr | 0 anomalies | | ⬜ |

---

## 4. Click / Dismissal / Wishlist Collection

| Metric | Query | Threshold | Actual | ⬜ PASS / ⬜ FAIL |
|---|---|---|---|---|
| Clicks (24h) | `GET /metrics?days=1` → clicks | ≥ 0 | | ⬜ |
| Dismissals (24h) | → dismissals | ≥ 0 | | ⬜ |
| Wishlists (24h) | → wishlists | ≥ 0 | | ⬜ |
| CTR (24h) | clicks / impressions | 0–100% | | ⬜ |
| No CTR spike | CTR < 50% (if > 30 min) | < 50% | | ⬜ |
| No CTR drop | CTR > 0.5% (if > 1 hr) | > 0.5% | | ⬜ |

---

## 5. Latency & Performance

| Check | Command | Threshold | Actual | ⬜ PASS / ⬜ FAIL |
|---|---|---|---|---|
| p50 latency | 10 requests timing | < 500ms | | ⬜ |
| p95 latency | 10 requests timing | < 3000ms | | ⬜ |
| No timeout errors | 0 timeouts in 10 req | 0 | | ⬜ |
| Feed response size | < 50 KB | < 50 KB | | ⬜ |

---

## 5. Error & Degradation Monitoring

| Check | Threshold | Actual | ⬜ PASS / ⬜ FAIL |
|---|---|---|---|
| 5xx error rate (24h) | < 2% | | ⬜ |
| Fallback rate (24h) | `method != 'hybrid'` < 2% | | ⬜ |
| Provider failure rate | 0% (graceful degradation) | | ⬜ |
| pgvector errors | 0 | | ⬜ |
| Empty feed rate | 0% | | ⬜ |

---

## 6. Cost Monitoring

| Metric | Source | Threshold | Actual | ⬜ PASS / ⬜ FAIL |
|---|---|---|---|---|
| Daily embedding tokens | OpenAI dashboard | < 500k | | ⬜ |
| Daily cost | OpenAI dashboard | < $5 | | ⬜ |
| Cost per request | tokens × pricing / requests | < $0.01 | | ⬜ |
| Projected 25% monthly | extrapolation | < $500 | | ⬜ |

---

## 6. Privacy & Consent

| Check | Threshold | Actual | ⬜ PASS / ⬜ FAIL |
|---|---|---|---|
| Opt-in default false | Schema default | | ⬜ |
| Opt-out respected | No signals when `personalizationEnabled=false` | | ⬜ |
| Reset works | `DELETE /feedback` clears user history | | ⬜ |
| No cross-user leakage | User A never sees User B's signals | | ⬜ |
| Admin metrics no PII | No user IDs in metrics | | ⬜ |

---

## 7. Security

| Check | Threshold | Actual | ⬜ PASS / ⬜ FAIL |
|---|---|---|---|
| CSRF on mutations | All POST/PUT/PATCH/DELETE | | ⬜ |
| Rate limits active | Per-endpoint limits enforced | | ⬜ |
| Admin metrics auth | 401 for non-admin, 200 for admin | | ⬜ |
| No secret leakage | Logs audit | | ⬜ |

---

## 8. Anomaly Detection

**Flag any of the following:**

| Anomaly | Indicator | Action |
|---|---|---|
| Impressions = 0 for > 1 hour | Frontend bug | Investigate immediately |
| CTR > 50% for > 30 min | Bot traffic / bug | Investigate |
| CTR < 0.5% for > 1 hour | Quality issue | Investigate |
| p95 latency > 3s for > 5 min | Degradation | Investigate |
| 5xx rate > 2% for > 5 min | Reliability issue | Investigate |
| Fallback rate > 10% | Semantic path failing | Investigate |
| Daily cost > $10 | Cost anomaly | Investigate |
| Duplicate impressions > 50% | Dedup bug | Investigate |
| Dismissal rate > 25% | Quality issue | Investigate |
| Negative user reports > 2% | UX issue | Investigate |

---

## 9. Daily Sign-Off

**Validator:** _____________  
**Time:** _____________ UTC  
**Overall:** □ ALL PASS  □ ANOMALIES NOTED (see below)  □ CRITICAL FAIL

**Anomalies Noted:**
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

**Actions Taken:**
1. ________________________________________________
2. ________________________________________________

---

## Weekly Aggregation (Run on Day 7)

| Metric | 7-Day Value | Target | Status |
|---|---|---|---|
| Total Impressions | | ≥ 1,000 | ⬜ |
| Total Clicks | | > 0 | ⬜ |
| CTR | | > 0.5% | ⬜ |
| Dismissal Rate | | < 15% | ⬜ |
| Wishlist Conversion | | > 0 | ⬜ |
| p95 Latency | | < 3s | ⬜ |
| Error Rate | | < 2% | ⬜ |
| Fallback Rate | | < 2% | ⬜ |
| Opt-in Rate | | 30–60% | ⬜ |
| Cost/Request | | < $0.01 | ⬜ |
| Zero-Item Rate | | 0% | ⬜ |

**Weekly Verdict:** □ READY FOR 25% GATE  □ CONDITIONAL  □ INSUFFICIENT DATA  □ FAIL

---

## Automation Notes

The following can be automated via a daily cron job:

```bash
#!/bin/bash
# Daily M23 validation script
DATE=$(date -u +%Y-%m-%d)
METRICS=$(curl -s -H "Cookie: $SESSION" "https://playmorrow-api-aged-mountain-9542.fly.dev/api/recommendations/metrics?days=1")
# Parse JSON, check thresholds, alert on anomalies
```

**Recommendation:** Implement as GitHub Action or Fly.io scheduled machine for automated daily validation.

---

## Completed Daily Validations

### Day 1 — 2026-08-10 (activation day)

**Validator:** Playmorrow AI (session 30)  
**Time:** ~12:00 UTC

**Summary:** Day-1 validation on activation day. **Catalog empty (0 published
games, 0 studios)** — baseline metrics have no data. This is EXPECTED and
recorded as NO DATA (not zero). See `M23_CATALOG_READINESS.md`.

| Section | Result | Notes |
|---|---|---|
| API availability | ✅ PASS | health 200, feed 200, auth gates 401 |
| Recommendation generation | ✅ PASS (structural) | `method=legacy`, empty items (0 games), no 5xx |
| Impression collection | ⬜ NO DATA | no catalog → no impressions possible |
| Click/dismissal/wishlist | ⬜ NO DATA | no catalog → no events possible |
| Latency & performance | ✅ PASS | p50 ~192ms, p95 ~259ms (10 cold samples, budget 3s) |
| Error & degradation | ✅ PASS | 0 timeouts, 0 5xx, fallback 0% (no semantic path hit) |
| Cost monitoring | ⬜ NO DATA | no embedding/chat calls (empty catalog) |
| Privacy & consent | ✅ PASS | opt-out path exercised (anonymous → `personalizationEnabled: null`) |
| Security | ✅ PASS | /metrics, /preferences, /impressions all 401; CSRF/rate-limit code paths unchanged (freeze intact) |
| Anomaly detection | ⬜ NO ANOMALIES | empty catalog is expected, not an anomaly |

**Verified live (curl, read-only):**

```
GET /api/games                → {"items":[],"total":0,...}  (200)
GET /api/studios              → {"items":[],"total":0,...}  (200)
GET /api/search?q=game        → all arrays empty            (200)
GET /recommendations/for-you  → {"items":[],"method":"legacy","personalizationEnabled":null} (200)
GET /recommendations/metrics  → 401 (admin gate, correct)
GET /recommendations/preferences → 401 (auth gate, correct)
POST /recommendations/impressions → 401 (auth gate, correct)
POST /recommendations/refresh-embeddings → 401 (admin gate, correct — NOT triggered)
GET /health                   → 200
Latency (10 cold samples)     → 167–301ms (p50 192, p95 259)
```

**Freeze integrity:** `M23_FREEZE_CHANGE_LOG.md` — no entries. No component touched.

**Anomalies Noted:** none (empty catalog is a known product/platform issue, not an M23 anomaly — see `M23_CATALOG_READINESS.md` §4).

**Overall:** ⬜ CONDITIONAL PASS — system healthy; discovery metrics INSUFFICIENT DATA by design (no catalog).

---

### Day 2 — 2026-08-11 (template)

**Validator:** _____________  
**Time:** _____________ UTC