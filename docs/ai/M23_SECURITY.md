# M23 — Recommendation Engine Security Audit

**Audit date:** 2026-08-09
**Scope:** `apps/api/src/ai/recommendations/*`, `recommendation.controller.ts`,
`SemanticSearchService`, `game_embeddings` table, `ForYouFeed.tsx`.
**Status:** 🟢 No vulnerabilities found. 2 hardening notes.

---

## Endpoints

| Endpoint | AuthZ | Rate limit | Notes |
|---|---|---|---|
| `GET /ai/recommendations/for-you` | Session auth (must be logged in) | Global throttler (60/min) | Per-user bucket; no cross-user data |
| `POST /ai/recommendations/feedback` | Session auth | Global throttler | Validates `gameId` exists + belongs to a published game |
| `GET /ai/recommendations` | Session auth | Global throttler | Content-level only (not per-user data) |
| `GET /ai/health` | Public | Global throttler | Provider status string only — no keys, no internals |

## Security Controls Verified

| Control | Status | Evidence |
|---|---|---|
| CSRF global guard | ✅ | All POST/PUT/PATCH/DELETE under global `CsrfGuard` (Session 10) |
| Input validation | ✅ | DTOs validated via `class-validator` (`@IsString`, `@IsEnum`, `@IsOptional`) |
| IDOR / horizontal access | ✅ | Feed is computed **from the authenticated user's own signals only**; never reads another user's wishlists/views |
| Rate limiting | ✅ | Global throttler on all endpoints |
| No secrets in responses | ✅ | `GET /ai/health` returns provider status only; controller never exposes API keys, prompts, or embeddings data |
| No prompt injection surface | ✅ | Feed is ranking-only — no user text is interpolated into model prompts (the per-request assistant is gated by M22 flags; M23 chat uses preferences only) |
| DoS / cost spike | ✅ | Semantic search capped at 5 candidates; embeddings capped at 8 titles; provider down → instant fallback (no retry storm, no queue) |
| DB safety | ✅ | `game_embeddings` written only by the nightly cron (single writer); reads are read-only |
| Data retention / GDPR | ✅ | Embeddings are of game titles only (not user data); `FeedbackEvent` rows are plain user-event rows covered by existing GDPR export/delete flows |

## Hardening Notes

1. **N+1 risk in semantic path** — bounded to ≤8 title embeddings per request
   (hard cap), so the cost ceiling is fixed. Documented in
   [M23_METRICS.md](M23_METRICS.md).
2. **Provider model mismatch** — `openai.provider.ts:306` hardcodes
   `text-embedding-ada-002` while `AI_EMBEDDING_MODEL` governs chat-context
   embeddings. Both 1536-dim → compatible with `vector(1536)`; flagged as
   tech debt (T-1 in certification) — a future model swap must update the
   provider and re-embed.

## Audit Trail

- 2026-08-09 — Initial audit (this file). Reviewed controllers, services,
  DTOs, schema, frontend hook usage. No vulnerabilities found.
