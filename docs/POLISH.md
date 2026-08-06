# Playmorrow — Complete Polish Document

**Date:** 2026-08-06 | **Scope:** Every page, component, endpoint, and config file

---

## Quick Summary

| Category | Issues Found |
|----------|-------------|
| Frontend Pages | 89 pages, gaps in 30 pages |
| API Endpoints | ~165 endpoints, 3 auth gaps |
| Components | 38 components, 2 with non-existent CSS vars |
| Styling | 15 files hardcode colors, ~40 inline button replicas |
| Prisma Schema | 13 missing indexes, 10 missing cascades |
| Config Files | 9 env vars missing, 2 tsconfigs broken |

---

## PRIORITY 1 — HIGH (Must Fix)

### 1. Non-Existent CSS Variables (Components Will Render Broken)
**Files:** `components/tag.tsx`, `components/team/team-member-card.tsx`

Tag component uses `bg-primary/10 text-primary` — `primary` doesn't exist in globals.css. Change to `bg-cyan/10 text-cyan`.

Team member card uses `bg-orange/10 text-orange`, `bg-red/10 text-red`, `bg-blue/10 text-blue` — none exist. Change to `bg-amber/10 text-amber`, `bg-coral/10 text-coral`, `bg-cyan/10 text-cyan`.

### 2. Consolidate All Hardcoded `bg-[#050b0f]` to `panel` Utility
**Files:** 15+ components (modal, empty-state, feed-item, cookie-consent, ticket-card, PersonalFeedSection, team-member-card, trending, settings-nav, shared.tsx, StudioDashboard, PlayerDashboard, report-form, home-hero-client)

Every instance of `bg-[#050b0f]/XX` should be replaced with the `panel` utility or a semantic CSS variable. This is the single most duplicated pattern.

### 3. Consolidate ~40 Inline Button Styles to Shared `<Button>`
**Files:** ~25 files across all pages

The shared `Button` component has 6 variants. Every inline button should use it instead of manually writing `clip-corner border border-cyan bg-cyan/10 px-...`. This is the single largest inconsistency.

### 4. Studio Model Has Zero Indexes
**File:** `packages/database/prisma/schema.prisma`

Add: `@@index([name])`, `@@index([createdAt])`, `@@index([followersCount])`. Every studio search does a full table scan.

### 5. Missing Foreign Key Relations on FeedEvent, AnalyticsEvent, ActivityEvent, EmailLog
**File:** `packages/database/prisma/schema.prisma`

Add `@relation` with `onDelete: SetNull` or `Cascade` for `studioId`, `gameId`, `userId`, `actorId` fields. Currently raw strings with zero referential integrity.

### 6. Comment.type Defaults to "REPLY" — Should Be "POST"
**File:** `packages/database/prisma/schema.prisma`

A top-level comment is a POST, not a REPLY. Fix the default.

---

## PRIORITY 2 — MEDIUM (Should Fix Next)

### 7. Error States Missing on ~30 Pages
**Files:** game devlogs/comments, forgot-password, discover, leaderboard (silently catches), about/privacy/terms/contact/cookies/community-guidelines, dashboard games, dashboard devlogs, dashboard support

Every page that fetches data should use `<ErrorState>`.

### 8. SEO Metadata Missing on High-Value Pages
**Files:** `games/[slug]/page.tsx`, `studios/[slug]/page.tsx`, `devlogs/[id]/page.tsx`, `game/[slug]/devlogs/page.tsx`, `game/[slug]/comments/page.tsx`, `forgot-password/page.tsx`

These are the most-linked pages. Add `layout.tsx` with metadata or `generateMetadata`.

### 9. No Shared Select, Textarea, Checkbox Components
**Files:** `report-form.tsx`, `invite-modal.tsx`, `onboarding/page.tsx`, `settings/*.tsx`, `cookie-consent.tsx`, `marketplace/new/page.tsx`

Create shared form components matching the `Input` pattern and use them everywhere.

### 10. Missing env vars in `.env.example`
**Files:** `apps/api/.env.example`, `apps/web/.env.example`

Add: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENAI_API_KEY`, `AI_PROVIDER`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

### 11. `rounded` Class Violates `--radius: 0` Design Rule
**Files:** `settings-nav.tsx`, `site-header.tsx` (search dropdown), `invite-modal.tsx` (select)

Replace `rounded` with sharp corners to match the brutalist design system. Avatars and spinners are allowed.

### 12. 9 Different Mono Font Sizes for Same Purpose
**Files:** All components

Standardize on a 3-size scale: `text-[0.55rem]` (label), `text-[0.65rem]` (body), `text-[0.72rem]` (emphasis). Remove arbitrary sizes.

### 13. Design Token Motion Vars Never Used
**Files:** All components

`--motion-fast/medium/slow` are defined in globals.css but `duration-[100ms]`, `duration-200`, `duration-300`, `duration-500` are used instead. Replace arbitrary durations with the tokens.

### 14. Inconsistent `muted-foreground` Opacity
**Files:** `site-footer.tsx`, `empty-state.tsx`, `trending-section.tsx`, `feed-item.tsx`

Unify on: `/50` for decorative icons, `/60` for secondary text, `/80` for readable secondary.

---

## PRIORITY 3 — LOW (Polish Pass)

### 15. Contact Page Has No Form
**File:** `app/contact/page.tsx`

Replace `mailto:` links with a proper contact form (name, email, message → POST to support API).

### 16. Homepage `studioCount={5}` Hardcoded
**File:** `app/page.tsx`

Replace with dynamic count from API.

### 17. `neonBorder` Inline Style Repeated 10+ Times
**Files:** about, privacy, terms, cookies, community-guidelines, contact, devlogs/[id], games/[slug], studios/[slug]

Extract to a CSS class or Tailwind utility.

### 18. `embed/[slug]` Uses Raw Inline Styles
**File:** `app/embed/[slug]/page.tsx`

Replace with Tailwind classes.

### 19. Hardcoded Hex in Logo
**Files:** `brand/logo.tsx`, `PlayMorrowSplash.tsx`

Change `#eef2f2` to `text-foreground`.

### 20. Barrel Export Missing Components
**File:** `components/index.ts`

Add: `SettingsNav`, `PlayerDashboard`, `StudioDashboard`, `HudPanel`, `StripePayment`, `TicketCard`, `InviteModal`, `TeamMemberCard`.

### 21. Content Security Audit Pass
- [ ] Verify `Game.description`, `Game.readme`, `Devlog.body`, `Comment.body` run through DOMPurify
- [ ] Verify `MarketplaceListing.description` runs through DOMPurify
- [ ] Verify `Studio.description/mission/vision` run through DOMPurify
- [ ] Verify `HelpArticle.body` and `SupportTicket.body` run through DOMPurify

### 22. Auth Consistency Audit
- [ ] Audit all `PATCH`/`PUT`/`DELETE` endpoints for `@Roles` or studio membership checks
- [ ] `game-analytics.controller.ts` — analytics are open to anyone with game slug. Intentional?
- [ ] `company-profile.controller.ts` — any authenticated user can patch any studio's profile. Add RBAC.

### 23. 4 Status Fields Should Be Enums
**Files:** `MarketplaceListing.status`, `Event.status`, `StudioVerificationRequest.status`, `Partner.status`

Replace raw `String` with Prisma enums.

### 24. Docker Compose Add `postgres-dev` Service
**File:** `docker-compose.yml`

Add a dev database service on port 5432 so new devs can `docker compose up` and have a working DB.

### 25. SDK + CLI tsconfigs Should Extend Base
**Files:** `packages/sdk/tsconfig.json`, `packages/cli/tsconfig.json`

Add `"extends": "../config/tsconfig/base.json"` to both.

### 26. `transitions` Consistency
**Files:** All components

Replace bare `transition` with `transition-colors` for color-only transitions, `transition-opacity` for fade effects, and `transition-all` only where truly needed.

---

## Complete File-by-File Checklist

### API Controllers to Fix
- [ ] `company-profile.controller.ts` — add RBAC guard
- [ ] `email-templates.controller.ts` — fix `@Post()` + `@Get()` stacked on same method (line 40-51)

### Prisma Migrations Needed
- [ ] Add indexes to Studio, Game, User, Comment, AuditLog models
- [ ] Add `onDelete` to Transaction, Event, MarketplaceListing, ReferralUsage
- [ ] Fix `Comment.type` default from REPLY → POST
- [ ] Add `@relation` to FeedEvent, AnalyticsEvent, ActivityEvent, EmailLog raw FK fields

### Config Files to Update
- [ ] `turbo.json` — add `CSRF_SECRET`, `SESSION_SECRET`, `JWT_SECRET`, `WEB_ORIGIN` to globalEnv
- [ ] `.env.example` (api) — add Stripe, AI, VAPID vars
- [ ] `.env.example` (web) — add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `docker-compose.yml` — add `postgres-dev` service, remove `version: "3.9"`

### Components to Fix
- [ ] `tag.tsx` — `text-primary` → `text-cyan`
- [ ] `team-member-card.tsx` — `text-orange/red/blue` → `text-amber/coral/cyan`
- [ ] `settings-nav.tsx` — remove `rounded`
- [ ] `brand/logo.tsx` — `text-[#eef2f2]` → `text-foreground`
- [ ] `PlayMorrowSplash.tsx` — same
- [ ] `modal.tsx` — `bg-[#050b0f]` → `panel`
- [ ] All 15 files with `bg-[#050b0f]` → `panel` utility
- [ ] All ~25 files with inline button styles → shared `<Button>`

### Pages Missing Error States
- [ ] `games/[slug]/devlogs/page.tsx`
- [ ] `games/[slug]/comments/page.tsx`
- [ ] `forgot-password/page.tsx`
- [ ] `discover/page.tsx`
- [ ] `leaderboard/page.tsx`
- [ ] `about/page.tsx`
- [ ] `privacy/page.tsx`
- [ ] `terms/page.tsx`
- [ ] `contact/page.tsx`
- [ ] `cookies/page.tsx`
- [ ] `community-guidelines/page.tsx`
- [ ] `dashboard/games/page.tsx`
- [ ] `dashboard/devlogs/page.tsx`
- [ ] `dashboard/support/page.tsx`

### Pages Missing SEO Metadata
- [ ] `games/[slug]/page.tsx`
- [ ] `studios/[slug]/page.tsx`
- [ ] `devlogs/[id]/page.tsx`
- [ ] `games/[slug]/devlogs/page.tsx`
- [ ] `games/[slug]/comments/page.tsx`
- [ ] `forgot-password/page.tsx`

### Hardcoded Values to Replace
- [ ] `studioCount={5}` — homepage
- [ ] `playmorrow@hotmail.com` — contact, support pages
- [ ] `discord.gg/playmorrow` — support page
- [ ] TBA dates — game pages
- [ ] `fallbackScreenshots: []` — game detail

### neonBorder Extraction
- [ ] Create `neon-border` CSS class or Tailwind utility
- [ ] Replace in: about, privacy, terms, cookies, community-guidelines, contact, devlogs/[id], games/[slug], studios/[slug]
