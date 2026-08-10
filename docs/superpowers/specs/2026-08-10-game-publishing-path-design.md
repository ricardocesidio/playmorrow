# Design — Game Publishing Path (M23 Catalog Readiness Prerequisite)

**Date:** 2026-08-10
**Status:** Approved design → implementation plan
**Sprint classification:** M23 CATALOG READINESS PREREQUISITE — NOT an M23 algorithm change
**M23 status:** 🟢 OBSERVATION FREEZE ACTIVE · 5% rollout · 25% gate LOCKED (2026-08-17)

---

## 1. Objective

Make it possible for a real studio to publish a real game through the product
(`Game.isPublished = true`) via a server-authoritative, auditable, authorized
path — unblocking the empty production catalog so the M23 experiment can
eventually receive real discovery data. This sprint does **not** modify the
frozen M23 recommendation components, does not fabricate data, does not change
rollout, and does not start M22/M24/M25/M26.

## 2. Root Cause

`Game.isPublished` has no real publish flow:

- `POST /studios/:slug/games` and `PATCH /games/:slug` never set `isPublished`.
- `update()` auto-stamps `publishedBy`/`publishedAt` when `GameStatus` becomes
  `RELEASED` (`games.service.ts:289-292`), creating the inconsistent state
  `{ status: RELEASED, isPublished: false, publishedAt: set }`.
- No publish endpoint, no DTO field, no frontend action. The only code setting
  `isPublished: true` is the prod-blocked seed script `seed-model-games.ts`.
- Public catalog (`GET /api/games`) and public search (games branch of
  `GET /api/search`) do **not** filter `isPublished`, so drafts would also leak
  publicly once games exist.

## 3. Impact Analysis (Phase 0 — read-only)

| Consumer | Current behavior | See drafts? | Published only? | Risk / action |
|---|---|---|---|---|
| Public catalog `GET /api/games` | Returns all games (no filter) | ❌ NO (should not) | ✅ YES (should) | **FIX** — add `isPublished: true` |
| Public search `GET /api/search` (games) | Returns all games (no filter) | ❌ NO | ✅ YES | **FIX** — add `isPublished: true` |
| Recommendations (legacy/trending/hybrid) | All filter `isPublished: true` | ✅ NO | ✅ YES | Correct — no change |
| Embeddings (refresh + event-driven) | `isPublished: true` + `game_published` handler | ✅ NO | ✅ YES | Correct — no change |
| Homepage (GamesSection, TrendingSection, ForYouFeed) | Via `GET /api/games` + `/recommendations/for-you` | ✅ NO (after fix) | ✅ YES | Fixed by catalog fix |
| Public game page `GET /api/games/:slug` | Open (any game by slug) | ✅ YES | ❌ No | **NOT FIXED this sprint** — shared with studio dashboard edit (`useGame`); matches existing devlog pattern. Document as follow-up. |
| Studio dashboard | `GET /studios/:slug/games` (all), `GET /games/:slug` | ✅ YES (required) | ❌ No | **DO NOT filter** — studio must edit drafts |
| Admin/moderation | Privileged behavior | ✅ YES | ❌ No | Keep — no change |
| Devlogs | `isPublished: true` on listings | ✅ NO | ✅ YES | Correct — no change |
| Comments | `game.isPublished: true` | ✅ NO | ✅ YES | Correct — no change |
| Marketplace | Listings independent of game publish | ✅ YES | ❌ No | No change (separate model) |
| Goals / Activity / Feed | Listen to `game_published` | — | — | Will now fire on real publish — correct |
| Digest | `game.isPublished: true` | ✅ NO | ✅ YES | Correct — no change |

**Decision (Phase 8):** Public game page stays open by slug (like devlogs). It is
required by the studio dashboard for editing drafts, and no private fields leak
(there are none beyond what owners see). Drafts will NOT appear in
catalog/search/recommendations/embeddings/feed. This is recorded as a follow-up.

## 4. Architecture Decision

`GameStatus` ≠ publication state. `GameStatus` (CONCEPT → RELEASED → CANCELLED)
remains a **development stage** label; `isPublished` remains the **single source
of truth for public visibility**. A game in `EARLY_ACCESS` or `IN_DEVELOPMENT`
may be published; `RELEASED` does not imply public. No second state machine is
introduced (Fase 6). No schema change → **no migration needed** (Phase 13).

## 5. Publication Model

- `isPublished` — Boolean, default false. The only publication flag.
- `publishedAt` — set once on first real publish; never re-stamped.
- `publishedBy` — actor id, set once on first real publish.
- Second publish call → no-op (idempotent, no new timestamp/audit/event).

## 6. Backend Implementation

### 6.1 Fix auto-stamp (Phase 1)

In `games.service.ts update()`: **remove** the block that stamps
`publishedBy`/`publishedAt` when `dto.status === 'RELEASED'` (lines 288-292).
The RELEASED XP award + feed/event emission on status change stays (that is
status-change behavior, not publication). Publication metadata is set **only**
by `publishGame`.

### 6.2 Publication domain (Phase 2/3)

New file `apps/api/src/games/game-publication.service.ts`:

- `validateGamePublicationReadiness(game): MissingRequirement[]` — the authority
  for completeness. Required: `title`, `tagline`, `description`, `coverUrl`,
  ≥1 screenshot (`media` type SCREENSHOT), ≥1 platform link, ≥1 tag. Returns a
  stable list of missing requirement keys.
- `publishGame(userId, slug): Game` — orchestrates: load game (404), authorize
  via `assertStudioAccess` (OWNER/ADMIN/MODERATOR + existing global
  ADMIN/MODERATOR bypass), reject `CANCELLED` (400/409), idempotent if already
  published (returns current game, no side effects), validate readiness (400 +
  missing list), transactional update, audit log, event emission.

### 6.3 Endpoint (Phase 4)

```
POST /api/games/:slug/publish
```

- `SessionAuthGuard`, `@Throttle` (same as other game mutations).
- States: 404 (missing) · 403 (unauthorized / MEMBER) · 400 (incomplete or
  CANCELLED) · 200 idempotent (already published) · 200 (published).
- Controller calls `publishGame`. States: 404 (missing) · 403 (unauthorized /
  MEMBER) · 400 (incomplete or CANCELLED) · 200 idempotent (already published) ·
  200 (published). To keep a single source of truth, `publishGame` performs the
  audit log and the `game_published` event emission itself, **only on the real
  `false → true` transition**.

### 6.4 Transactional publish (Phase 5)

Single `prisma.$transaction`:
`game.update({ isPublished: true, publishedBy: userId, publishedAt: new Date() })`
+ `auditLog.log({ action: 'GAME_PUBLISHED', ... })`. The `game_published` event
(EventBus) is emitted after the transaction commits, on the real transition only.

### 6.5 Audit + event pipeline (Phase 6)

- Audit action: `GAME_PUBLISHED` (existing AuditLogService).
- Event: `game_published` via existing EventBus → consumed by
  `GameEmbeddingRefreshService.refreshGame()` (event-driven embedding), Goals,
  Activity. No new bus.
- Feed engine `GAME_PUBLISHED` emission is preserved as-is for status-change
  events. The publish action **also** emits the feed event on the real
  `false → true` transition, so the feed reflects first-publication (consistent
  with existing `game_published` semantics).

### 6.6 Public catalog + search (Phase 7)

- `findAll()` (`GET /api/games`): add `isPublished: true` to the base `where`.
- Search `buildGameWhere()` games branch: add `isPublished: true`.
- Studio endpoints unchanged (drafts visible to studio).

## 7. Frontend Implementation (Phase 10)

In `/dashboard/games/[slug]/page.tsx` add a **Publication card**:
- State: "Published ✓" or "Not published".
- Checklist from the already-loaded game: title, tagline, description, cover,
  screenshot, platform, tag (missing items highlighted).
- `Publish Game` button: disabled while incomplete; loading state; blocks
  double-click; success/error toasts; on success invalidates `myGames`, `games`,
  `game` and calls `revalidateFeed`/`revalidateHomepage`.
- New hook `usePublishGame()` in `apps/web/lib/api/hooks.ts` (mirrors
  `useUpdateGame`).
- The checklist mirrors backend rules for UX only — backend remains authority.

## 8. Security (Phase 11)

- Anonymous → 401. MEMBER → 403. OWNER → 200. ADMIN → 200. MODERATOR → 200
  (per existing bypass).
- Cross-studio attack blocked by `assertStudioAccess`.
- Forged `{ isPublished: true }` in PATCH body → ignored (no DTO field; server
  ignores unknown field — verify with test).
- CANCELLED → blocked. Idempotent second call → 200 no-op.

## 9. Tests (Phase 12)

Extend `apps/api/src/games/games.controller.spec.ts` (e2e, real test DB):
- Auth matrix (401/403/200/200/200).
- State: 404, CANCELLED blocked, idempotent second publish.
- Completeness: 400 + missing list; complete → 200.
- Persistence: `isPublished=true`, `publishedAt != null`, `publishedBy != null`.
- Catalog/search: after publish, present in `GET /api/games` and `GET /api/search`.
- Draft isolation: before publish, absent from catalog, search, recommendations.
- Full integration: create → complete → publish → catalog → search → event →
  embedding pipeline trigger.
- Forged payload test: PATCH with `isPublished: true` does not publish.
- All existing tests stay green (regression).

## 10. Freeze Integrity (Phase 14)

`M23_FREEZE_CHANGE_LOG.md` entry:
"Catalog Readiness / Publishing Path — Outside Frozen M23 Recommendation
Components". No algorithm/weights/metrics/rollout/CTR/baseline/recommendation
logic changed. Purpose: let the product generate real data for the experiment.

## 11. Documentation (Phase 15)

Update: `ARCHITECTURE.md`, `README.md`, `STATUS.md`, `HANDOFF.md`, `AGENTS.md`,
`CHANGELOG.md`, `docs/ai/M23_CATALOG_READINESS.md` (Catalog Ready / Measurable
Catalog definitions per Phase 21). README must explain that AI does not decide
public visibility — publishing is a product/studio decision; AI works on
already-eligible content.

## 12. Final Report (Phase 25)

`docs/releases/M23_CATALOG_READINESS_CERTIFICATION.md` with the 18-section
report and verdict separating:

- **Catalog Publishing Path: CERTIFIED** (or partial/blocked — honest)
- **M23 Product Impact: NOT YET PROVEN**

## 13. Out of Scope / Follow-ups

- Public game page draft gating (shared endpoint with studio dashboard).
- Unpublish action (evaluate separately).
- Moderation/review workflow for games (does not exist; not invented).
- M22/M24/M25/M26. M23 promotion. Rollout change.

## 14. Success Criteria

Verifiable path: real studio → real game → complete requirements → publish →
`isPublished=true` → public catalog → public search → embedding pipeline →
recommendation eligibility. Drafts provably isolated from public surfaces.
End with `pnpm verify` ALL GREEN.
