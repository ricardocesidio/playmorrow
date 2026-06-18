# Frontend issues (12–29)

Catalogue for `apps/web` (Next.js / React / Playwright). See [`HANDOFF.md`](./HANDOFF.md)
for repo orientation and execution order.

Legend — **Type**: Bug / Limitation / Feature / DX · **Effort**: S (≤½d) / M (1–2d) / L (≥3d or design).

---

## 12. ⭐ 6 Playwright E2E tests fail (desktop) — feed spec

- **Type:** Bug · **Severity:** High (blocks CI) · **Effort:** M · **Status:** OPEN
- **Files:** `apps/web/e2e/personalized-feed.spec.ts`,
  `apps/web/e2e/fixtures/mocks.ts`, `apps/web/app/dashboard/feed/page.tsx`,
  `apps/web/lib/api/hooks.ts` (`usePersonalFeed`), `apps/web/lib/api/auth-context.tsx`
- **READ THIS FIRST — the assumed cause is wrong.** The list guesses a "Playwright
  route-ordering issue with predicate functions vs `**/*` catch-all." The on-disk artifact
  `apps/web/test-results/personalized-feed-Personal-1497d--filter-shows-mixed-content-desktop/error-context.md`
  shows the real error: `TypeError: makeItem is not a function or its return value is not
  iterable` — a JS error **inside the test's mock handler**, possibly from a **stale
  artifact**. Do **not** implement the route-ordering fix blind.
- **Reproduce (do this before any code change):**
  1. `pnpm --filter @playmorrow/web build`
  2. `pnpm --filter @playmorrow/web test:e2e -- personalized-feed.spec.ts --project=desktop`
  3. Add `page.on('console', m => console.log('PAGE', m.text()))` and
     `page.on('requestfailed', r => console.log('REQFAIL', r.url()))` to capture the *live*
     failure; inspect the HTML report (`pnpm --filter @playmorrow/web test:e2e:report`).
- **Likely root-cause candidates to confirm (in order):**
  1. **Stale `test-results`/build** — delete `apps/web/test-results` and `.next`, rebuild,
     re-run. The `makeItem` TypeError may simply not reproduce.
  2. **Auth never hydrates → redirect to `/login`** so `/api/me/feed` never fires. The spec
     sets `localStorage` on `/` then navigates to `/dashboard/feed`; `usePersonalFeed` is
     `enabled: !!token` and the page redirects when `!isAuthenticated`. Verify `/api/auth/me`
     mock actually matches and the token survives navigation.
  3. **Predicate vs. catch-all routing** — only if 1 & 2 are excluded. The other (passing)
     specs use the centralized `mockApi()` catch-all in `fixtures/mocks.ts`; this spec uses
     per-test `page.route((url) => …)` predicates. If genuinely flaky, refactor this spec to
     reuse `mockApi()` + per-test overrides for consistency.
- **Definition of done:** all 6 tests green on `--project=desktop`, and the fix is the
  *actual* cause (documented in the commit), not a guess.

## 13. Mobile Playwright project never executed

- **Type:** Bug/Gap · **Severity:** Medium · **Effort:** S–M · **Status:** OPEN
- **Files:** `apps/web/playwright.config.ts` (the `mobile` / Pixel 7 project)
- **Analysis:** `mobile` project is configured but never run, so its pass/fail rate is unknown.
- **Suggested fix:** After #12 is green, run `pnpm test:e2e --project=mobile`, triage failures
  (responsive specs in `responsive.spec.ts` may need mobile-specific expectations), and make
  CI (#14) run both projects.

## 14. No CI integration

- **Type:** DX/Infra · **Severity:** High · **Effort:** M · **Status:** OPEN
- **Files:** new `.github/workflows/ci.yml`
- **Analysis:** No CI exists; Playwright is manual. Repo is on GitHub → use GitHub Actions.
  Docker isn't on the dev machine, but Actions runners provide Postgres **service containers**.
- **Suggested fix:** Workflow with `pnpm/action-setup` + Node 20 + cache. Jobs:
  `lint`, `typecheck`, `test` (backend Vitest, with a `postgres:16` service +
  `prisma migrate deploy`), and `e2e` (build web, install Playwright browsers, run **both**
  projects, upload `playwright-report` artifact). Set `CI=true` (config already tightens
  retries/workers/forbidOnly under CI). Gate `main` on it. **Do this only after #12/#13 are
  green** — don't wire CI to a red suite.

## 15. `reuseExistingServer: true` reuses a dead server

- **Type:** Bug/DX · **Severity:** Medium · **Effort:** S · **Status:** OPEN
- **Files:** `apps/web/playwright.config.ts` (`webServer.reuseExistingServer`)
- **Analysis:** Locally `reuseExistingServer: !process.env.CI`. If a prior `next start` on
  3099 was killed/crashed, Playwright can silently reuse a dead port and hang/fail until the
  process is manually cleared.
- **Suggested fix:** Document a pre-flight kill (`lsof -ti:3099 | xargs kill`), or add a script
  that ensures a clean port before `test:e2e`, or set `reuseExistingServer: false` for the
  default local run. CI already sets it false. Pair with #16.

## 16. Production build required before E2E (no auto-rebuild)

- **Type:** DX · **Severity:** Medium · **Effort:** S–M · **Status:** OPEN
- **Files:** `apps/web/playwright.config.ts` (`webServer.command` uses `start`, not `dev`),
  `apps/web/package.json`
- **Analysis:** E2E runs against `next start` (production build); `next build` takes 3–5 min
  and there's no rebuild on code change, so iterating on a UI fix + its test is slow.
- **Suggested fix:** Offer a dev-mode E2E path: a `test:e2e:dev` that points `webServer` at
  `next dev -p 3099` (faster iteration; accept slightly different behavior), while keeping the
  production-build path for CI. Document both. Note the `NEXT_PUBLIC_API_URL` build-time
  inlining caveat (see HANDOFF "Running E2E").

## 17. 6 ESLint warnings in E2E files

- **Type:** DX · **Severity:** Low · **Effort:** S · **Status:** OPEN
- **Files:** spec files under `apps/web/e2e/` (unused `API` import in several;
  `import(...)` type annotations in `personalized-feed.spec.ts`, e.g.
  `import('@playwright/test').Page`)
- **Analysis:** Unused imports + inline `import()` type annotations trip lint.
- **Suggested fix:** Remove unused `API`/imports; replace inline `import('@playwright/test').Page`
  with a top-level `import type { Page } from '@playwright/test'`. Run
  `pnpm --filter @playmorrow/web lint` to zero.

## 18. No image uploads

- **Type:** Feature · **Severity:** Medium · **Effort:** L · `NEEDS DESIGN` · **Status:** OPEN
- **Files:** create/edit forms in `apps/web/app/...` (studios/games/devlogs/press-kit),
  backend upload endpoint (new), storage adapter (new)
- **Analysis:** All media (cover/banner/logo/avatar/game media) are pasted URLs — no file
  picker, no upload endpoint. Storage backend **undecided** (R2/S3 vs Supabase vs
  Cloudinary/UploadThing).
- **Suggested approach:** Decide storage first. Then presigned-upload endpoint on the API,
  a reusable `<ImageUpload>` component (drag/drop + progress + preview) replacing URL inputs,
  validation (type/size), and persisting the returned URL. **Design note required.**

## 19. No studio/game/devlog/roadmap deletion UI

- **Type:** Feature/Gap · **Severity:** Medium · **Effort:** M · **Status:** OPEN
- **Files:** dashboard pages under `apps/web/app/dashboard/...`, corresponding API DELETE
  endpoints (verify they exist per domain in `apps/api/src/*`)
- **Analysis:** Users can create/edit but not delete studios, games, devlogs, or roadmap items.
- **Suggested fix:** Confirm DELETE endpoints exist (add where missing, with ownership checks
  via `studio-permissions.ts`); add delete actions with a confirm dialog + optimistic
  `useMutation` + query invalidation. Mind cascade semantics (schema uses `onDelete: Cascade`).

## 20. No delete UI for comments / roadmap items / notifications

- **Type:** Feature/Gap · **Severity:** Low–Medium · **Effort:** M · **Status:** OPEN
- **Files:** `apps/web/app/devlogs/[id]/page.tsx` (comments), notifications + roadmap pages,
  `apps/api/src/comments/*` (soft-delete exists: `Comment.deletedAt`)
- **Analysis:** Comment soft-delete exists in the API but UI is limited to author delete; no
  UI to remove roadmap items / dismiss notifications.
- **Suggested fix:** Add author/mod delete affordances for comments (reflect `deletedAt` as
  "[deleted]"), delete for roadmap items (overlaps #19), and dismiss/clear for notifications.
  Reuse the confirm + optimistic-mutation pattern from #19.

## 21. Notification badges don't update in real-time

- **Type:** Feature · **Severity:** Low–Medium · **Effort:** M–L · `NEEDS DESIGN` · **Status:** OPEN
- **Files:** `apps/web/lib/api/hooks.ts` (`useUnreadNotificationCount`, polls 60s),
  `apps/web/components/nav.tsx`, backend (SSE/WS endpoint, new)
- **Analysis:** `useUnreadNotificationCount` polls every 60s; new notifications appear only on
  refresh/poll. Transport (SSE vs WebSocket vs better polling) **undecided**.
- **Suggested approach:** Pick transport. Cheapest interim: reduce interval + `refetchOnWindowFocus`.
  Real-time: SSE endpoint (`GET /api/me/notifications/stream`) that pushes unread count;
  frontend `EventSource` updates the query cache. **Design note required.**

## 22. Auth hydration flash

- **Type:** Bug · **Severity:** Medium · **Effort:** S–M · **Status:** OPEN
- **Files:** `apps/web/lib/api/auth-context.tsx` (`isLoading` starts `true`, set false after
  `/auth/me`), `apps/web/components/nav.tsx`, pages that don't gate on `isLoading`
- **Analysis:** On load there's a brief flash of unauthenticated UI before `AuthProvider`
  reads `localStorage` and fetches `/auth/me`. Some pages show a spinner (feed page does),
  but the nav/others don't consistently gate on `isLoading`.
- **Suggested fix:** Render a stable skeleton/placeholder for auth-dependent UI while
  `isLoading`. Centralize: have `nav.tsx` (and other auth-aware components) respect
  `isLoading` instead of `isAuthenticated` alone, so logged-in chrome doesn't flicker.

## 23. Feed page doesn't scroll to top on pagination

- **Type:** Bug · **Severity:** Low · **Effort:** S · **Status:** OPEN
- **Files:** `apps/web/app/dashboard/feed/page.tsx` (Next/Previous `setPage`)
- **Analysis:** Clicking Next/Previous loads new items but the viewport stays scrolled down.
- **Suggested fix:** On page change (`useEffect` keyed on `page`, or in the click handler)
  call `window.scrollTo({ top: 0 })` (respect `prefers-reduced-motion`). Optionally add a
  Playwright assertion that scrollY resets.

## 24. Comment reactions cause N+1 API calls (frontend half)

- **Type:** Bug · **Severity:** Medium · **Effort:** M · **Status:** OPEN
- **Files:** `apps/web/app/devlogs/[id]/page.tsx` (`<CommentReactions>` renders per comment,
  ~line 219; each calls `useCommentReactions(comment.id)`),
  `apps/web/lib/api/hooks.ts` (`useCommentReactions`)
- **Analysis:** Confirmed N+1 — each visible comment issues its own
  `GET /api/comments/:id/reactions`. 20+ comments → 20+ requests.
- **Suggested fix:** Consume the **batch endpoint from #9** with a single `useQuery` keyed by
  devlog id (`['commentReactions', devlogId]`), then look up each comment's reactions from
  that map. Remove the per-comment query. Must be done together with #9.

## 25. No rich text editor for devlogs

- **Type:** Feature · **Severity:** Low–Medium · **Effort:** M–L · `NEEDS DESIGN` · **Status:** OPEN
- **Files:** devlog create/edit (`apps/web/app/dashboard/devlogs/new/page.tsx`,
  `.../devlogs/[id]/...`), devlog render (`apps/web/app/devlogs/[id]/page.tsx`),
  `Devlog.body` is plain `String`
- **Analysis:** `body` is a plain `<textarea>`; no markdown, no preview.
- **Suggested approach:** Decide format (Markdown is simplest and storage-compatible). Add an
  editor with preview (e.g. a Markdown editor) + safe render (sanitize). Confirm whether to
  store Markdown vs. HTML. **Design note required.**

## 26. Notifications aren't clickable targets

- **Type:** Feature/Gap · **Severity:** Low–Medium · **Effort:** M · **Status:** OPEN
- **Files:** `apps/web/app/dashboard/notifications/page.tsx`, `apps/web/lib/api/hooks.ts`
  (`useNotifications`), possibly a backend resolver for slugs
- **Analysis:** Notifications expose `targetType` + `targetId` but don't link to the content
  (links need slug resolution — entities are addressed by slug, notifications store ids).
- **Suggested fix:** Add a mapping from `(targetType, targetId)` → route. Either resolve slugs
  server-side (include a `targetUrl`/slug in the notification payload) or add a lightweight
  resolve endpoint. Then make rows links and mark-as-read on click.

## 27. Dashboard "Feed" card links to a protected page when logged out

- **Type:** Bug (UX) · **Severity:** Low · **Effort:** S · **Status:** OPEN
- **Files:** `apps/web/app/dashboard/page.tsx` (the Feed card),
  `apps/web/app/dashboard/feed/page.tsx` (redirects to `/login` when unauthenticated)
- **Analysis:** `/dashboard/feed` redirects logged-out users to `/login`; a card linking
  there is confusing for that state.
- **Suggested fix:** Hide/disable the Feed card when not authenticated, or point logged-out
  users to `/login?next=/dashboard/feed`. (Note: `/dashboard` itself should arguably gate on
  auth — verify.)

## 28. No Playwright snapshot / visual regression tests

- **Type:** Feature/Gap · **Severity:** Low · **Effort:** M · **Status:** OPEN
- **Files:** `apps/web/e2e/responsive.spec.ts` (currently width-only checks)
- **Analysis:** Responsive checks are width-only, not visual; no `toHaveScreenshot` coverage.
- **Suggested approach:** Add `toHaveScreenshot()` baselines for key pages/breakpoints once
  the suite is stable (after #12/#13). Commit baselines; document the update flow
  (`--update-snapshots`). Keep separate from functional specs to limit flake.

## 29. `pnpm test` doesn't run E2E

- **Type:** DX · **Severity:** Low · **Effort:** S · **Status:** OPEN
- **Files:** root `package.json` (`test` = `turbo run test`; `test:e2e` separate), `turbo.json`
- **Analysis:** `pnpm test` runs only backend Vitest (207 passing). E2E is the separate
  `pnpm test:e2e`. Intentional, but easy to forget E2E exists.
- **Suggested fix:** Keep them separate (E2E needs a build), but make it explicit: document in
  README, and in CI (#14) run both. Optionally add a `test:all` script that runs unit then
  E2E. Don't fold E2E into the default `test` (it would make `turbo run test` slow/flaky).
