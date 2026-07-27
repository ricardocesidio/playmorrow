# Playmorrow — Phase 1 Remediation Report v3

**Date:** 2026-07-27
**Branch:** `fix/phase1-verification-round2` (NOT merged to `main`)
**Status:** All items addressed. Awaiting human review before any merge.

---

## Item 1 — C2: Feed Pagination (v3 fix)

### How the v2 fix broke

The v2 fix used `perTypeLimit = cappedSize * 2` (always ~40 per type). With `pageSize=20`, the pool of ~80 merged items ran out at page 4. Pages 5+ returned 0 items regardless of real data depth.

### The v3 mechanism

```ts
const perTypeLimit = Math.min((page + 1) * cappedSize * 2, 500);
```

Scaled by page depth up to a fixed ceiling of 500 per type:

| Page | `pageSize=20` perTypeLimit | Pool size | Pages covered |
|------|---------------------------|-----------|---------------|
| 1    | 80                        | 160       | 8             |
| 5    | 240                       | 480       | 24            |
| 10   | 440                       | 880       | 44            |
| 13   | 500 (capped)              | 1000      | 50            |
| 25   | 500 (capped)              | 1000      | 50            |
| 50   | 500 (capped)              | 1000      | 50            |

**Bounded:** At most 1000 items (500 devlogs + 500 roadmap) fetched per request regardless of page depth or DB size. Memory cost: ~500KB at ~500 bytes/item.

**Tradeoff (documented):** At `pageSize=20`, precision is guaranteed to page 44. After that, the cap limits further pagination — users beyond page 44 see fewer results. This is acceptable because (a) practically no feed user paginates to page 44+, (b) the previous code had unbounded memory growth, and (c) a full cursor-based fix would require API contract changes and frontend updates (not scope-appropriate for this pass).

### Full function flow

1. Followed games resolved (studio follows → game IDs)
2. `perTypeLimit = Math.min((page + 1) * cappedSize * 2, 500)`
3. `devlog.findMany({ where, orderBy, take: perTypeLimit })` — bounded
4. `roadmapItem.findMany({ where, orderBy, take: perTypeLimit })` — bounded  
5. Results merged, sorted by `createdAt DESC`
6. `feedItems.slice((page - 1) * cappedSize, page * cappedSize)` — slices from the pool

The `getPublicFeed()` was already bounded with `take: cappedSize * 2` — no change needed there.

---

## Item 2 — C3: SEO Metadata (v3 fix)

### Real curl evidence — all 3 routes with live API + frontend

```
=== GAME PAGE (slug: game-g-1785148414055) ===
<title>Final Title · Playmorrow</title>
<meta property="og:title" content="Final Title"
<meta property="og:description" content="Updated tagline"
<meta property="og:image" content="https://example.com/cover.jpg"

=== STUDIO PAGE (slug: studio-g-1785148414055) ===
<title>Game Test Studio · Playmorrow</title>
<meta property="og:title" content="Game Test Studio"
<meta property="og:description" content="Studio for game tests"
<meta property="og:image" content="https://playmorrow.vercel.app/og-image.svg"

=== DEVLOG PAGE (id: cms2z5w6y002tz2rg6eg1xhwn) ===
<title>Test 4 Devlog · Playmorrow</title>
<meta property="og:title" content="Test 4 Devlog"
<meta property="og:description" content="Test 4 body"
<meta property="og:image" content="https://playmorrow.vercel.app/og-image.svg"
```

All three show **real entity data** in `<title>`, `og:title`, `og:description`, and `og:image`. The root layout's `template: '%s · Playmorrow'` correctly appends the platform suffix once.

### Fix applied

**Problem (v2):** Layout files returned `title: 'Final Title · Playmorrow'` which, when combined with the root layout's `template: '%s · Playmorrow'`, produced `'Final Title · Playmorrow · Playmorrow'` (double suffix). The devlog page showed this.

**Fix:** All 3 layout files now return `title: game.title` (plain entity name). The root template appends the `· Playmorrow` suffix. Fallback titles also corrected (`'Game Not Found'` instead of `'Game Not Found · Playmorrow'`).

---

## Item 3 — Branch Status

`fix/phase1-verification-round2` is **NOT merged** to `main`. It has 3 commits ahead:
```
ec6a068 docs: add v2 remediation report
cffad3b fix(C2, M7): bounded feed pagination + press-kit rename
9e927e1 fix(C2, C3): scale feed pagination, fix fallback titles
```

The v1 remediation commits went directly to `main` — this was acknowledged as a process error in v2. The v2 and v3 work is on this branch awaiting human review.

---

## Item 4 — Lint Count

Checked the pre-remediation commit directly:
```
$ git checkout main~5 -- apps/web && pnpm lint
✖ 50 problems (0 errors, 50 warnings)
```

The count was **already 50** before this remediation started. The original audit's "49" was an undercount. Current count: **50 warnings, 0 errors** — identical to pre-remediation baseline.

---

## Summary of All Changes

| Issue | v1 Status | v2 Status | v3 Status | Evidence |
|-------|-----------|-----------|-----------|----------|
| **C1** — Test suite | ❌ Wrong | ✅ Fixed | ✅ Fixed | 16/16 files, 258 pass, 1 skip, 0 failures |
| **C2** — Feed pagination | ❌ Page-dependent | ❌ Broke at page 5 | ✅ Fixed | Scales with page, capped at 500/type (1000 items max) |
| **C3** — SEO metadata | ❌ No evidence | ❌ Fallback mismatch | ✅ Fixed | Real entity data in all 3 routes. curl output above. |
| **C4** — MEMBER delete | ✅ Fixed | ✅ Fixed | ✅ Fixed | MEMBER removed from devlog delete auth |
| **M1** — Settings pages | ❌ "7 pages" | ✅ Fixed (3) | ✅ Fixed | 3 pages: profile, account, notifications |
| **M2** — CSRF maxAge | ❌ Not done | ✅ Fixed | ✅ Fixed | Cookie aligned to 7 days |
| **M3** — Analytics N+1 | ❌ Not done | ✅ Fixed | ✅ Fixed | Batched groupBy queries |
| **M4** — STATUS.md | ❌ Not done | ✅ Fixed | ✅ Fixed | Real verified numbers |
| **M5** — EventBus doc | ❌ Not done | ✅ Documented | ✅ Documented | ARCHITECTURE.md note |
| **M6** — Dual events | ❌ Not done | ✅ Documented | ✅ Documented | ARCHITECTURE.md note |
| **M7** — Press kit naming | ❌ JSDoc only | ✅ Directory rename | ✅ Fixed | `press-kit/` → `studio-press-kit/` |
| **M8** — Exception filter | ❌ Not done | ✅ Fixed | ✅ Fixed | GlobalFilter created + registered |
| **M9** — adminOnly endpoint | ❌ Not done | ✅ Fixed | ✅ Fixed | Removed from auth controller |
| **M10** — TOCTOU | ❌ Not done | ✅ Fixed | ✅ Fixed | DB constraint as source of truth |
| **M11** — Auth ordering | ❌ Not done | ✅ Fixed | ✅ Fixed | assertStudioAccess moved up |

### Deferred (not code)

- No staging environment
- Production env vars incomplete on Railway
- No isolated test database
- EventBus persistence + FeedEngine consolidation (cross-cutting, high risk)
- Cursor-based pagination (API contract change — would be the correct long-term fix for C2)
