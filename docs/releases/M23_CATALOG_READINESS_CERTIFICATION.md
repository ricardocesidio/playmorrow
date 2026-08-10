# Catalog Readiness — Game Publishing Path Certification

**Milestone:** M23 readiness prerequisite (STATUS.md issue #8 — product/platform)
**Sprint:** Game Publishing Path (Session 31)
**Date:** 2026-08-10
**Status:** 🟢 **CATALOG PUBLISHING PATH: CERTIFIED** · 🟡 **M23 PRODUCT IMPACT: NOT YET PROVEN**

---

## 1. Executive Summary

The root cause blocking catalog growth for M23 discovery data was that **no
product path could set `Game.isPublished = true`**. Every consumer
(recommendations, embeddings, feedback, digest, studio-health) filters on
`isPublished: true` — correct design that exposed the gap. A studio creating a
game today would never appear in discovery.

This sprint shipped the **Game Publishing Path**: a server-authoritative
`POST /api/games/:slug/publish` endpoint plus a public-catalog filter change, a
publication checklist in the game editor, and 14 new e2e tests. Studios can now
publish games through the product, unblocking real catalog growth during the M23
observation window.

**Honest split verdict:** the publishing path is **certified** (tests, gates,
security all verified). Whether publishing **improves M23 discovery metrics is
not yet proven** — it requires real catalog content plus the remaining 7-day
window (decision 2026-08-17).

---

## 2. Scope

- **Classification:** product/platform fix — **outside** the M23 observation freeze.
- **Tracks:** STATUS.md issue #8 (no publishing workflow).
- **In-scope:** server-authoritative publication pipeline, public catalog filter,
  editor checklist, tests, docs.
- **Out-of-scope:** M23 algorithm/weights/metrics/rollout changes (frozen); no
  schema change; no unpublish; no moderation workflow.

---

## 3. Root Cause Recap

Verified evidence-based finding (`docs/ai/M23_CATALOG_READINESS.md`):

- `Game.isPublished` defaults to `false` on create.
- `update` stamped `publishedBy`/`publishedAt` on RELEASED only — but the status
  select is cosmetic; no product path set `isPublished: true`.
- Create/Update DTOs had **no `isPublished` field**; no publish endpoint; no
  frontend toggle. The **only** code setting `isPublished: true` was the
  prod-blocked seed script.
- Result: `/api/games` returns `{total: 0}`; discovery metrics at the 25% gate
  would be **INSUFFICIENT DATA by design**, not by failure.

---

## 4. Changes Shipped

| # | Change | Location |
|---|---|---|
| 1 | Removed RELEASED auto-stamp of `publishedBy`/`publishedAt` (separates dev-stage label from public-visibility state) | `games.service.ts` |
| 2 | Exported `GAME_INCLUDE`, `GameWithInclude`; `toResponse` made public | `games.service.ts` |
| 3 | `GamePublicationService` — completeness gate, auth, idempotency, transaction, audit, events | `game-publication.service.ts` (new) |
| 4 | `AuditLogService.log` accepts optional Prisma `tx` (audit inside publish transaction) | `audit-log.service.ts` |
| 5 | `POST /api/games/:slug/publish` endpoint | `games.controller.ts` |
| 6 | Public catalog `findAll()` filters `isPublished: true` (studio/owner/admin queries unaffected) | `games.service.ts` |
| 7 | Search games branch filters `isPublished: true` | `search.service.ts` |
| 8 | `usePublishGame()` hook | `apps/web/lib/api/hooks.ts` |
| 9 | Publication card + readiness checklist on game editor | `apps/web/app/dashboard/games/[slug]/page.tsx` |
| 10 | e2e tests (games controller spec 20 → 34) | `games.controller.spec.ts` |

---

## 5. Security

| Control | Implementation | Evidence |
|---|---|---|
| Auth | SessionAuthGuard; `assertStudioAccess` (OWNER/ADMIN/MODERATOR); global ADMIN/MODERATOR bypass preserved | spec auth matrix |
| Completeness gate | Deterministic: title/tagline/description/coverUrl/≥1 screenshot/≥1 platform link/≥1 tag | spec + unit tests |
| CANCELLED status | Rejected with 400 before any write | spec |
| Idempotency | Already-published → 200 no-op, no audit/event emission | spec |
| Forged payloads | `isPublished` not on Create/Update DTOs; `forbidNonWhitelisted` rejects stray fields | spec forged-payload test |
| Transactional audit | `GAME_PUBLISHED` audit written inside the publish transaction | spec audit test |
| Events | `game_published` EventBus + `GAME_PUBLISHED` feed event only on real false→true | spec event test |

---

## 6. Freeze Integrity

- `docs/ai/M23_FREEZE_CHANGE_LOG.md` — **1 entry** (this change), classified
  platform/catalog-readiness; **baseline contaminated: NO**; **restart: NO**.
- No M23 frozen component touched (scoring weights, candidates, semantic search,
  embedding model/dims, MMR, ranking, personalization, rollout %, UX,
  explanations, feedback/CTR/impression/dismissal/wishlist semantics).
- North Star preserved: discovery data pipeline now actually fillable.

---

## 7. Test Evidence

- **Full API suite:** **539 passed / 51 files, 0 failures** (baseline 525/51 → +14).
- **Games controller spec:** 20 → 34 tests. New coverage:
  - Auth matrix (anon 401, non-member 403, member 403, owner/admin/mod 200).
  - Completeness gate (missing key → 400 with key list; CANCELLED → 400).
  - Idempotency (already published → 200 no-op, single audit/event).
  - Audit + EventBus + feed event on real false→true (with create-emission reset).
  - Catalog presence (published visible in `GET /games`; draft isolated).
  - Search presence (published appears in search; draft excluded).
  - Forged-payload rejection (extra `isPublished` field → 400).
- Search spec still green (search branch change verified).

---

## 8. Quality Gates

| Gate | Result |
|---|---|
| `pnpm verify` (root) | ✅ 6/6 tasks (lint, typecheck, build across web/api/database) |
| Lint (API) | ✅ 0 errors, 27 pre-existing warnings |
| Typecheck | ✅ all workspaces green |
| Build | ✅ 6/6 |
| Full API suite | ✅ 539/539 (51 files) |
| Schema drift | ✅ no `schema.prisma` change in this sprint (prior-session M23 columns already applied) |

Note: a stray untracked debug file (`dbg-register.ts`, created today, empty catch
block) broke lint; it was diagnostic debris from an earlier root-cause
investigation and was removed to restore the gate.

---

## 9. Known Limitations

| # | Limitation | Follow-up |
|---|---|---|
| 1 | Public game page (`GET /games/:slug`) still serves drafts by slug — intentionally not gated (serves the editor pre-publish preview) | Gate public page to published games + separate preview route |
| 2 | No unpublish path | TBD |
| 3 | No moderation/workflow around publication | TBD |
| 4 | Publishing does not itself create catalog content — studios must use it | Adoption enablement / seed data decision |

---

## 10. M23 Relationship

- **Feed/economy events** now fire on real publish (`game_published` EventBus,
  `GAME_PUBLISHED` feed event) — previously the feed engine had no publish signal
  to react to.
- **Embedding pipeline consumer unchanged:** the nightly refresh reads
  `isPublished: true` games — the same predicate, now satisfiable.
- Recommendations, feedback, digest, studio-health consumers all unchanged.
- No M23 code path, metric, or default changed.

---

## 11. Metrics

**N/A this sprint.** No metric fabricated. Production catalog remains 0 games;
discovery KPIs (CTR, dismissal, opt-in, latency, cost) remain **INSUFFICIENT
DATA** until studios publish real content during the observation window.

---

## 12. Verdict

> 🟢 **Catalog Publishing Path: CERTIFIED**
> — implemented, tested (539/539), security-reviewed, freeze-compliant,
> documented, and locally verified.
>
> 🟡 **M23 Product Impact: NOT YET PROVEN**
> — requires real catalog content produced through the new publishing path plus
> the remaining 7-day observation window before the **2026-08-17** 25% gate.

---

## 13. Follow-ups

1. Gate public game pages to published games (preview route for editors).
2. Unpublish path.
3. Publication moderation/workflow (content review).
4. Evaluate 25% gate on 2026-08-17 with real (or honestly INSUFFICIENT DATA)
   production metrics.
