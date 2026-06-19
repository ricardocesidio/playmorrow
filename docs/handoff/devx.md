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
  DONE — prod/test divergence eliminated. `create-test-app.ts` now uses `whitelist: true` +
  `forbidNonWhitelisted: true` (matches prod); the stale SWC note was removed and a
  regression test guards the parity. See **#1** for detail.
- **Files:** `apps/api/src/test/create-test-app.ts`
- **Analysis:** `create-test-app.ts` uses `whitelist: false` while prod uses `whitelist: true`.
  Documented as an SWC limitation but easy to forget, and it means tests don't match prod
  validation. **This is the documentation/awareness side of bug #1** — fix them together.
- **Suggested fix:** Resolve via #1 (re-enable whitelist or properly configure SWC decorator
  metadata). If it genuinely can't be enabled, add a regression note + a TODO with a tracking
  link so it isn't silently forgotten. Don't leave prod/test validation divergent without a
  loud comment.

## 32. No seed/mock data for independent frontend development

- **Type:** DX · **Severity:** Medium · **Effort:** M · **Status:** DONE
- **Files:** `packages/database/prisma/seed.ts` (DB seed exists),
  `apps/web/e2e/fixtures/mocks.ts` (E2E mocks exist), new shared mock fixtures
- **Analysis:** Frontend dev requires either a running+seeded backend or Playwright mocks.
  There's no static mock dataset for building UI in isolation.
- **Suggested fix:** Extract a shared mock dataset (reuse/relocate the shapes in
  `e2e/fixtures/mocks.ts`) usable by both E2E and a dev mode. Consider an MSW-based dev
  toggle (`NEXT_PUBLIC_USE_MOCKS`) so the web app can run without a backend. Coordinate with
  #33 (Storybook would consume the same fixtures).

## 33. No Storybook / component previews

- **Type:** Feature/DX · **Severity:** Low · **Effort:** M–L · **Status:** DONE
- **Files:** `apps/web/.storybook/main.ts`, `apps/web/.storybook/preview.ts`,
  `apps/web/components/**/*.stories.tsx`
- **Analysis:** All components were built in-page; no isolated dev environment.
- **Solution:** Storybook 10.4 + @storybook/nextjs 10.4 + compatible addons (actions,
  controls, viewport, backgrounds, highlight, measure, outline). Tailwind v4 CSS imported
  via globals.css; dark mode via data-color-mode; backgrounds panel with light/dark presets.
  Stories for: Button (all variants/sizes/states), Tag, Footer, GameCard (free/no-cover/
  many-tags variants), FeedItemCard, Nav, FollowButton (studio/game), ImageUpload
  (empty/with-value), MarkdownEditor (empty/with-content/short-height). Run via
  `pnpm storybook` (dev) or `pnpm storybook:build` (static build). Note: @storybook/blocks
  and addon-docs are not included (incompatible with storybook@10.x — will add when 10.x
  compatible versions are released).

## 34. `next dev --turbopack` port conflict with E2E

- **Type:** DX · **Severity:** Low · **Effort:** S · **Status:** DONE — documented the port
  map (3000 dev web · 3099 E2E web · 4000 api) in the README and added a `clean-port` script
  (honours `PLAYWRIGHT_PORT`) to clear a wedged E2E port. Paired with #15.
- **Files:** `apps/web/package.json` (`dev` = port 3000, `test:e2e:server` = 3099),
  `apps/web/playwright.config.ts` (PORT 3099)
- **Analysis:** Dev server uses 3000, E2E uses 3099 — they shouldn't collide by default, but
  the original note flags that running both (or stray processes) can conflict. Related to the
  stale-server reuse in #15.
- **Suggested fix:** Document the port map (3000 dev web, 3099 E2E web, 4000 api). Make the
  E2E port configurable via `PLAYWRIGHT_PORT` (already supported) and add the pre-flight
  port-clear from #15 so stray processes don't wedge a run. Low priority.
