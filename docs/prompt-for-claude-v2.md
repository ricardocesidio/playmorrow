# Prompt for Claude — Round 2

Upload `playmorrow-snapshot-v2.tar` and paste this prompt:

---

I am sending you the updated Playmorrow source code. This is v2 after a previous Claude analysis was executed.

## What has changed since you last saw it (v1 → v2)

The previous Claude prompt produced a 6-task execution plan that was fully implemented:

1. **Sitemap bug fixed** — `sitemap.ts` had hardcoded `localhost:4000`, breaking all dynamic entries in production. Now uses `process.env.API_URL`.
2. **Mobile header** — Search icon + auth actions (Sign in/Register/Dashboard/Sign out) added to mobile menu.
3. **5 game cards consolidated** — Five independent implementations (CatalogGameCard, FeaturedGameCard, LatestGameCard, 2x StudioGameCard) merged into one shared `GameCard` component with `variant` prop (`default`/`featured`/`compact`/`studio`).
4. **Shared Input component** — `ui/input.tsx` (cva forwardRef with error state). Auth pages migrated.
5. **Shared Modal component** — `ui/modal.tsx` (accessible, blur backdrop, Escape key). Built but not yet adopted across the 14 ad-hoc modals.
6. **OG fallback + JSON-LD** — All detail pages (games/studios/devlogs) now have fallback OG images + per-page JSON-LD schemas (VideoGame, Organization, BlogPosting).

Current scores: Engineering 80/100, Typecheck 6/6, Lint 0 errors, 17/17 pages 200.

## Your job

1. Read the full archive. Pay special attention to the new shared components (`ui/input.tsx`, `ui/modal.tsx`, `game-card.tsx` with variants).
2. Identify the **next 5-8 highest-impact improvements**. Prioritize by user-facing impact × implementation effort.
3. Consider specifically:
   - **The remaining design system adoption** — Button component is used in auth pages but ~45 files still use raw `<button>`. Modal is built but 14 ad-hoc modals remain. Input is built but 25 raw `<input>` files remain.
   - **Any bugs or regressions** introduced by the game card consolidation (check the type changes, the StudioGame → Game type reconciliation).
   - **Testing** — all the infrastructure exists (Docker compose, CI Postgres, vitest setup with safety guard). If tests had been run, what would likely break?
   - **The stale snapshot archive** — `playmorrow-snapshot.tar` (112MB) is still tracked in git history. Not a code issue but a repo hygiene issue.
4. Produce ONE execution prompt for the CLI agent, organized as numbered tasks with exact file paths and pseudocode.

## Constraints on the agent

- Has read/write access to `/Users/nataliawindelboth/Desktop/FRONTEND/playmorrow`
- Can run shell commands, start dev server, curl pages
- Can run `pnpm typecheck` and `pnpm lint`
- Does NOT have Railway/Vercel/production access
- Should NOT install new npm packages unless essential
- Should NOT modify tests

## Format

Output a single markdown document with:
1. What changed since v1 (brief)
2. Critical issues found (if any)
3. Next improvements (prioritized)
4. Full execution prompt starting with "## EXECUTION PROMPT"

Be ruthless. If something regressed, say so. If the consolidation introduced bugs, find them.
