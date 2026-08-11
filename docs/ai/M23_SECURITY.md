# M23 — Recommendation Engine Security Audit

**Audit date:** 2026-08-09 (updated by M23 Final Hardening pass)
**Scope:** `apps/api/src/ai/recommendations/*`, `recommendation.controller.ts`,
`SemanticSearchService`, `game_embeddings` table, `ForYouFeed.tsx`.
**Status:** 🟢 No vulnerabilities found. 2 hardening notes (1 closed in the
final hardening pass).

---

## Endpoints

| Endpoint | AuthZ | Rate limit | Notes |
|---|---|---|---|
| `GET /recommendations/for-you` | Optional session (public feed) | Global throttler (60/min) | Per-user bucket; no cross-user data; consent-gated personalization |
| `POST /recommendations/feedback` | Session auth | 60/min | Validates `gameId` exists + belongs to a published game |
| `POST /recommendations/impressions` | Session auth | 60/min | Validates games; dedup window 60 min; max 50 ids/request |
| `DELETE /recommendations/feedback` | Session auth | 10/min | **Session-scoped only** — resets that user's rows, nothing else |
| `GET /recommendations/preferences` | Session auth | Global throttler | Returns only `personalizationEnabled` for the session user |
| `PATCH /recommendations/preferences` | Session auth | 20/min | Boolean only; stamps `personalizationEnabledAt` consent audit trail |
| `GET /recommendations/metrics` | Session + **ADMIN role** | Global throttler | Aggregate CTR counts — no per-user data exposure |
| `GET /ai/recommendations` | Session auth | Global throttler | Content-level only (not per-user data) |
| `GET /ai/health` | Public | Global throttler | Provider status string only — no keys, no internals |

## Security Controls Verified

| Control | Status | Evidence |
|---|---|---|
| CSRF global guard | ✅ | All POST/PUT/PATCH/DELETE under global `CsrfGuard` (Session 10) |
| Input validation | ✅ | DTOs validated via `class-validator` (`@IsString`, `@IsEnum`, `@IsBoolean`, `@ArrayMaxSize(50)`) |
| IDOR / horizontal access | ✅ | Feed computed **from the authenticated user's own signals only**; impressions/feedback/reset are `WHERE userId = sessionUser` — cross-user reset impossible (test: `DELETE … only clears the session user's own history`) |
| Consent enforcement | ✅ | Personalization only runs when `personalizationEnabled === true` **and** user is in bucket — checked server-side per request; opted-out users have zero personal data read (test: `does not gather taste signals for opted-out users`) |
| Consent default | ✅ | `personalizationEnabled` defaults `false` (Constitution Art. 5 / Principle 3: consent-gated, never default-on) |
| Rate limiting | ✅ | Global throttler + per-endpoint limits (metrics 20/min patch, 10/min delete) |
| No secrets in responses | ✅ | Controllers never expose API keys, prompts, or embedding data |
| No prompt injection surface | ✅ | Feed is ranking-only — no user text interpolated into model prompts |
| DoS / cost spike | ✅ | Semantic search capped at 5 candidates; embeddings capped at 8 titles; impressions capped at 50/req; provider down → instant fallback (no retry storm) |
| DB safety | ✅ | `game_embeddings` written only by the nightly cron (single writer); run-start dimension abort prevents stale-column writes; empty-catalog delete guard prevents wipes |
| Data retention / GDPR | ✅ | Embeddings of game titles only (not user data); `RecommendationFeedback` rows are user-event rows covered by existing GDPR export/delete flows; feedback reset also serves Art. 5 "delete AI history" |

## Hardening Notes

1. **N+1 risk in semantic path** — bounded to ≤8 title embeddings per request
   (hard cap), so the cost ceiling is fixed. Documented in
   [M23_METRICS.md](M23_METRICS.md).
2. ~~**Provider model mismatch** — hardcoded `text-embedding-ada-002`~~ →
   **CLOSED (2026-08-09).** `EmbeddingService` now passes the configured
   `AI_EMBEDDING_MODEL` to the provider; the refresh cron re-embeds on
   model/dimension change and aborts (never writes) on dimension mismatch
   (T-1 resolved).

## Audit Trail

- 2026-08-09 — Initial audit (this file). Reviewed controllers, services,
  DTOs, schema, frontend hook usage. No vulnerabilities found.
- 2026-08-09 — M23 Final Hardening re-audit. Added preferences/impressions/
  metrics/reset endpoints; consent gate verified; T-1 closed.
