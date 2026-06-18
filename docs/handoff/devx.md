# Documentation & Dev-Experience issues (30–34)

Catalogue for tooling, environment, and contributor experience. See
[`HANDOFF.md`](./HANDOFF.md) for repo orientation and execution order.

Legend — **Type**: Bug / Limitation / Feature / DX · **Effort**: S (≤½d) / M (1–2d) / L (≥3d or design).

---

## 30. Environment file gap (`.env` is gitignored)

- **Type:** DX · **Severity:** Medium · **Effort:** S · **Status:** DONE (`cf21a50`) — added a
  non-destructive `pnpm setup:env` (`cp -n` for all four `.env.example` files) and documented
  the required vars (`DATABASE_URL`, `JWT_SECRET`) in the README "Getting started" + scripts
  table. Verified all `.env.example` files already list every var the apps read (`PORT`,
  `WEB_ORIGIN`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NEXT_PUBLIC_API_URL`).
  (Runtime zod validation left as a future option — the API already `getOrThrow`s `JWT_SECRET`.)
- **Files:** `apps/api/.env` (gitignored), `.env.example`, `packages/database/.env.example`,
  `README.md`
- **Analysis:** New devs must manually copy `.env.example` → `.env` and fill values; nothing
  guides or automates it, so first-run setup is error-prone.
- **Suggested fix:** Document the exact copy + required vars in README ("Getting started").
  Optionally add a `setup` script (`cp -n .env.example .env` for each app) and/or runtime
  env validation (e.g. zod) so a missing var fails fast with a clear message. Ensure
  `.env.example` lists every var the apps read (`DATABASE_URL`, `JWT_SECRET`, `PORT`,
  `WEB_ORIGIN`, `NEXT_PUBLIC_API_URL`, …).

## 31. Test harness whitelist disabled (mirrors prod gap)

- **Type:** DX · **Severity:** Medium · **Effort:** — (resolved alongside #1) · **Status:**
  PARTIAL (`cf21a50`) — added a loud `TODO(handoff #1)` note in `create-test-app.ts` (doc
  comment + inline on `whitelist: false`) so the prod/test divergence isn't silently forgotten.
  The actual re-enable/investigation remains tracked under **#1** (Phase 2).
- **Files:** `apps/api/src/test/create-test-app.ts`
- **Analysis:** `create-test-app.ts` uses `whitelist: false` while prod uses `whitelist: true`.
  Documented as an SWC limitation but easy to forget, and it means tests don't match prod
  validation. **This is the documentation/awareness side of bug #1** — fix them together.
- **Suggested fix:** Resolve via #1 (re-enable whitelist or properly configure SWC decorator
  metadata). If it genuinely can't be enabled, add a regression note + a TODO with a tracking
  link so it isn't silently forgotten. Don't leave prod/test validation divergent without a
  loud comment.

## 32. No seed/mock data for independent frontend development

- **Type:** DX · **Severity:** Medium · **Effort:** M · **Status:** OPEN
- **Files:** `packages/database/prisma/seed.ts` (DB seed exists),
  `apps/web/e2e/fixtures/mocks.ts` (E2E mocks exist), new shared mock fixtures
- **Analysis:** Frontend dev requires either a running+seeded backend or Playwright mocks.
  There's no static mock dataset for building UI in isolation.
- **Suggested fix:** Extract a shared mock dataset (reuse/relocate the shapes in
  `e2e/fixtures/mocks.ts`) usable by both E2E and a dev mode. Consider an MSW-based dev
  toggle (`NEXT_PUBLIC_USE_MOCKS`) so the web app can run without a backend. Coordinate with
  #33 (Storybook would consume the same fixtures).

## 33. No Storybook / component previews

- **Type:** Feature/DX · **Severity:** Low · **Effort:** M–L · `NEEDS DESIGN` · **Status:** OPEN
- **Files:** `apps/web/components/*` (developed in-page today)
- **Analysis:** All components are built in-page; no isolated dev environment, which slows UI
  iteration and review.
- **Suggested approach:** Add Storybook (or a lightweight alternative) for `apps/web`, with
  stories for the shared UI (`components/ui/*`, `game-card`, `feed-item`, `follow-button`,
  `tag`, `nav`, `footer`). Feed it the shared fixtures from #32. **Scope/tooling decision
  required** (Storybook vs. a simpler preview route) — confirm before investing.

## 34. `next dev --turbopack` port conflict with E2E

- **Type:** DX · **Severity:** Low · **Effort:** S · **Status:** OPEN
- **Files:** `apps/web/package.json` (`dev` = port 3000, `test:e2e:server` = 3099),
  `apps/web/playwright.config.ts` (PORT 3099)
- **Analysis:** Dev server uses 3000, E2E uses 3099 — they shouldn't collide by default, but
  the original note flags that running both (or stray processes) can conflict. Related to the
  stale-server reuse in #15.
- **Suggested fix:** Document the port map (3000 dev web, 3099 E2E web, 4000 api). Make the
  E2E port configurable via `PLAYWRIGHT_PORT` (already supported) and add the pre-flight
  port-clear from #15 so stray processes don't wedge a run. Low priority.
