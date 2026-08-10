# Changelog

## [Unreleased]

### Game Publishing Path — Catalog Readiness (2026-08-10)

Game Publishing Path shipped (STATUS.md issue #8 RESOLVED): studios can now
publish games through the product.

- `POST /api/games/:slug/publish` (SessionAuthGuard; OWNER/ADMIN/MODERATOR via `assertStudioAccess`; completeness gate → 400 with missing keys; CANCELLED → 400; idempotent → 200 no-op; transactional `isPublished=true` + `publishedBy` + `publishedAt` + `GAME_PUBLISHED` audit; `game_published` EventBus + `GAME_PUBLISHED` feed event on real transition)
- Public catalog (`GET /api/games`) and search games branch filter `isPublished: true`; drafts stay visible in studio/owner/admin queries
- RELEASED status no longer auto-stamps `publishedBy`/`publishedAt` (separates dev-stage label from public-visibility state)
- `isPublished` is not exposed on Create/Update DTOs — forged payloads rejected (`forbidNonWhitelisted`)
- Frontend: `usePublishGame()` hook + Publication card with readiness checklist on the game editor
- e2e: games controller spec now 34 tests (auth matrix, completeness, idempotency, audit, events, catalog/search presence, draft isolation, forged-payload rejection)
- M23 remains under **Observation Freeze** — no frozen M23 component touched (freeze log entry added)

### M23 — Recommendation Engine (Hybrid) — 🟢 CERTIFIED (2026-08-09)

Phase 6 milestone M23 implemented and certified for governed 5% rollout.

**Backend (`apps/api/src/ai/recommendations/`, 12 new files):**
- **Hybrid For You feed**: semantic (pgvector taste-signal embeddings, MMR
  diversity λ=0.7) over the legacy scoring floor — cannot be worse than
  pre-AI. Weights: wishlist 0.35 / views 0.25 / tag 0.25 / studio 0.05 /
  recency 0.10. Rollout via stable `hash(userId) % 100 < pct` bucket.
- **Graceful degradation (Article 8)**: provider down → content fallback,
  no signals → trending floor; **live-verified** (200 with `method=content`
  while provider unreachable; exclusions proven: user's own wishlist games
  excluded from their feed).
- **Feedback events**: `POST /ai/recommendations/feedback` (CLICKED /
  DISMISSED / WISHLISTED), dismissal window, validated gameId.
- **Nightly embedding refresh** (03:00 UTC cron) for published games + orphan
  cleanup; `game_embeddings` table with HNSW index, `vector(1536)`.
- **SemanticSearchService**: KNN (`embedding <=> query`), 5-candidate cap,
  fallback chain; wired into search page + game detail page.
- **Per-request assistant chat** (M22 flag-gated): chat on game detail,
  preferences persisted to `UserPreferences`; model + feature caching.
- **Admin AI debug**: `GET /ai/recommendations` (content-level) +
  `/dashboard/admin/ai` (embeddings count, provider status).

**Schema** (migration `20260809000000_m23_recommendation_engine`):
`User.preferredGenres`, `UserPreferences`, `game_embeddings` (+HNSW),
`FeedbackEvent.eventType` + `liked`/`disliked`.

**Config**: `RECOMMENDATIONS_ENABLED` (kill switch), `ROLLOUT_PCT` (default 5),
`PERSONALIZE`, `SEMANTIC`, `CACHE_REFRESH`, `FEED_REFRESH_MS` (180s).

**Frontend**: `ForYouFeed.tsx` (cards, cursor pagination, dismiss, explainer
line, 3-min auto-refresh), homepage uses it when authenticated; hooks
`useForYouFeed`, `useRecordRecommendationFeedback`, `useSemanticSearch`,
`useAiHealth`.

**Gates**: tests **505/505 (50 files)** ✅ · typecheck 2/2 ✅ · lint 0 errors ✅ ·
build 6/6 ✅ · dev DB 40/40 migrations, zero drift, pgvector live ✅ ·
live verify: anonymous trending 200 @349ms cold; personalized degraded 200;
p50 138ms / p95 161ms; feedback 201 ✅

**Certification**: `docs/releases/M23_CERTIFICATION.md` (16-gate audit,
8 deviations, 6 findings). **Verdict: 🟢 CERTIFIED for 5% governed rollout.**
Mandatory before 25%: C-1 per-user personalization opt-out, C-2 impression
baseline. Docs: `docs/ai/M23_RECOMMENDATION_ENGINE.md`, `M23_METRICS.md`,
`M23_SECURITY.md`, `M23_ROLLOUT.md`, `docs/ai/sprints/M23_SPRINT_REPORT.md`,
`M23_POST_IMPLEMENTATION_REVIEW.md`.

### P0 Production Database Isolation (2026-08-07)

**Incident:** A `prisma migrate reset` (run during a dev-database reconciliation
on 2026-08-06) executed against the shared Neon database and cleared the
production dataset. Pre-incident data is **not recoverable** — Neon PITR
retention is only 6 hours (`history_retention_seconds: 21600`, verified via
API) and zero snapshots exist.

**Root cause:** prod and dev pointed at the SAME Neon database.

**Remediation (VERIFIED):**
- Created a dedicated **dev Neon branch** (`br-sparkling-sea-abobomp9`,
  endpoint `ep-raspy-sunset-abo6apgc`) of project `green-leaf-42103134`; prod
  branch (`br-patient-bonus-abbxfc07`, `ep-orange-bird-abpuzipk…`) untouched.
- Rewired `apps/api/.env` `DATABASE_URL` → dev branch. Prod Fly.io secret
  unchanged.
- **DB safety guard** `packages/database/scripts/db-guard.mjs` wired into all
  DB scripts (database + api packages): blocks `reset`/`push`/`migrate-dev`/
  `seed` against the prod host unless `ALLOW_PROD_DB_OPERATIONS=1`; `deploy`/
  `status`/`generate`/`diff` always allowed. Tested 5/5 matrix.
- CI safety check added to `ci.yml` — fails if `DATABASE_URL` resembles prod.
- Verified: prod 39/39 migrations, zero drift, smoke 200/401/404; dev branch
  reset + migrate + seed OK; test suite 490/490 green against disposable DB.
- Docs: `docs/infrastructure/` (ENVIRONMENT_ISOLATION, DATABASE_MIGRATION_POLICY,
  DATABASE_RECOVERY_RUNBOOK, PRODUCTION_DATABASE_SAFETY) +
  `docs/releases/PRODUCTION_DB_ISOLATION_CERTIFICATION.md`.
- Corrected inaccurate "7-day PITR" claim in `docs/security/BACKUP_RESTORE.md`
  (actual: 6h).

**Outstanding (P0 → P0.1):** nightly `pg_dump` backups (now implemented — see
below), Neon plan upgrade for longer PITR, staging branch.

### P0.1 Production Hardening & Recovery Readiness (2026-08-07)

- **Nightly off-machine backups implemented:** `.github/workflows/backup-db.yml`
  (02:00 UTC cron + `workflow_dispatch`) dumps production via read-only role
  `playmorrow_backup` (`postgres:18`, `--exclude-schema=neon_auth`) → Cloudflare
  R2 `db-backups/` (SHA-256 + MANIFEST, 14-day retention). Full restore drill
  passed: 65/65 tables, row counts match live prod.
- **Fail-closed DB guard:** destructive commands against *unknown* hosts (any
  host that is not prod, localhost, or `DEV_DB_HOST`) are now BLOCKED unless
  `ALLOW_PROD_DB_OPERATIONS=1`. Matrix re-verified 7/7.
- **Dead latent bypass removed:** `admin:ensure` scripts (root + api package.json)
  pointing at the deleted `admin-script.ts` were removed.
- **Test-suite safety:** `vitest.setup.ts` prod-host regex now matches current
  prod + dev-branch Neon hosts (was stale `ep-aged-darkness`). Verified 6/6.
- **Smoke-test robustness:** games step accepts `total=0` (prod legitimately
  empty post-incident) — asserts HTTP 200 + well-formed JSON. Live-verified.
- **Docs:** `docs/releases/P0_1_PRODUCTION_HARDENING_CERTIFICATION.md`
  (🟡 conditional — pending user secrets + rotation); updated
  `docs/security/BACKUP_RESTORE.md`, `DATABASE_RECOVERY_RUNBOOK.md`,
  `PRODUCTION_DB_ISOLATION_CERTIFICATION.md`, STATUS.md, SECURITY.md, AGENTS.md.
- **USER ACTION REQUIRED:** set 5 GitHub secrets (`gh secret set` via
  `scripts/setup-backup-secrets.sh`), run `backup-db.yml` once, and rotate the
  exposed Neon DB password + NEON_API_KEY.

### P0.1.1 Production Hardening Closure (2026-08-07)

- **DB password rotation (DONE):** rotated `neondb_owner` password on the
  production branch via Neon API (browser-authenticated `neon` CLI); confirmed
  old exposed password (`npg_d0nw9exVhtBk`) now **rejected** and new password
  live in Fly `DATABASE_URL` secret (digest changed `f2820f3e…→1a14e99a…`);
  production smoke: all endpoints 200, protected routes 401. New prod URL stored
  in gitignored `.env.prod-dburl`. Backup read-only role `playmorrow_backup`
  unaffected (separate password).
- **NEON_API_KEY rotation (DONE):** exposed org key `playmorrow-key` (id 3244621)
  revoked; replacement `playmorrow-key-v2` created, stored in gitignored
  `.env.neon-apikey`. CLI auth is OAuth (unaffected); no tracked code / Fly
  secrets referenced the key.
- **Quality gates:** `pnpm verify` green (lint 0 errors, 67 pre-existing warning,
  typecheck 7/7, build 6/6); API test suite 490/490 across 48 files against
  disposable :5433.
- **CI ratchet:** corrected stale `any`-count baseline in `ci.yml` (was 137; actual
  0) → baseline 0 with explanatory message.
- **Docs:** `docs/releases/P0_1_FINAL_CERTIFICATION.md`; updated P0.1 cert, STATUS,
  SECRET_ROTATION, DATABASE_RECOVERY_RUNBOOK, CHANGELOG, AGENTS.
 - **Status:** 🟡 CONDITIONALLY CERTIFIED — `gh` not installed on this workstation →
  GitHub secret registration is a USER ACTION. Phase 6 AI remains BLOCKED.

- **Real production backup VERIFIED in R2 (P0.1.1 closure sprint):** created a real
  backup using the workflow's own `pg_dump` flags + the verified read-only role
  `playmorrow_backup` (prod direct host) + real R2 creds; uploaded to
  `db-backups/20260807T132952Z.dump` (+ `.sha256` + `.MANIFEST.txt`, 197,092 bytes);
  downloaded it back, **checksum matched**; **restored to disposable Postgres 18
  (:5434) → 65/65 tables, row counts match live prod**. Independent restore drill:
  `tables=65, indexes=230, constraints=569, users=1, games=0`. `gh` CLI unavailable
  → cannot trigger the GitHub Actions workflow itself; pipeline correctness proven
  via direct execution identical to `backup-db.yml`. See
  `docs/releases/P0_1_FINAL_CERTIFICATION.md`.
- **Guard matrix re-verified 10/10**; **7/7 workflow YAMLs valid** (yq); quality
  gates hold (490/490, lint 0 errors, typecheck 7/7, build 6/6).
- **Commit:** `920de09` (local; no secrets in commit; push deferred pending gh action).

### Audit Remediation (2026-08-05)
- CR-04: Added transactional rollback (cancelPaymentIntent) to marketplace purchase
- CR-05: Fixed /me/licenses auth redirect (now redirects to /login)
- Retired self-certifications (Platinum, Gold, RC3.x)
- Adopted honest labeling: v0.8-beta, not v1.0 Platinum

### v1.0.0-platinum (2026-08-05) — VERSION FREEZE

Phase 6 Preparation — strategic AI vision defined, platform frozen.

- Created VISION_PHASE6.md: Player/Studio/Marketplace/Community AI intelligence strategy
- Created PHASE6_ROADMAP.md: M22-M26 milestones (AI Assistant, Recommendations, Moderation, Studio Intelligence, Semantic Search)
- Created AI_ARCHITECTURE.md: Provider abstraction layer, RAG pipeline, pgvector, 6 new API endpoints
- Created COMPETITIVE_ANALYSIS.md: 9 competitors analyzed
- Version 1.0 Platinum officially frozen — Phase 6 may begin

### RC3.2 — Platinum Certification (2026-08-05)

Final engineering polish. Score: 88 → 91/100 (+3).

- Lighthouse production audit: A11y 92, Best Practices 96, SEO 100, Performance 71 (infra-limited)
- SEO: 5 new layout files with metadata + canonical (marketplace, events, me/licenses)
- Color contrast: 4 fixes (stripe-payment, empty-state, site-footer)
- Test infrastructure documented: TEST_INFRASTRUCTURE_REPORT.md
- Contrast audit: CONTRAST_AUDIT.md

### RC3.1 — Gold Certification (2026-08-05)

Final quality & accessibility. Score: 84 → 88/100 (+4).

- Test coverage: 46 new tests (payments, publisher, creator, partner, events)
- Phase 5 test coverage: 1/6 → 6/6 modules (100%), 4 → 50 tests
- WCAG 2.2 AA: 55 fixes on 11 pages
- aria-busy, aria-live, aria-selected, role=tablist, htmlFor, aria-required
- role=alert on shared ErrorState (benefits 30+ pages)
- alert() on Stripe onboarding → ErrorState

### RC3 — Quality & Stability (2026-08-05)

Post-certification remediation. Score: 70 → 84/100 (+14).

- Critical bugs: StripePayment renders, Register button works, RBAC on events+partners
- 8 raw Error → HttpExceptions across all Phase 5 controllers
- EventsModule exports EventsService; EventBus in marketplace purchase
- 5 extracted hooks (useEvents, useEvent, usePartners, useDeleteListing, useUpdateListing)
- 3 new types in client.ts (Event, Partner, ReferralCodeInfo)
- 3 dead code blocks removed
- STATUS.md recreated; 7 docs synced

### Phase 5 — Ecosystem (2026-07-31)

- M16 Marketplace: Stripe Connect Express, PaymentIntent, listings, purchases, licenses
- M17 Publisher: Revenue dashboard per studio
- M18 Funding: Reward-based scope defined (equity blocked)
- M19 Creator: Referral codes + commission tracking
- M20 Partner: B2B CRM with 6 partner types
- M21 Events: Listings, detail, publish, upcoming filter
- 8 new Prisma models (63 total), 22 API endpoints, 12 frontend pages

### Added
- Push notification toggle with VAPID key configuration, permission checks, and error toasts
- Email change with verification flow (send code to new email, verify before saving)
- Studio logo in community discussion (author's own studio logo, not game's studio)
- Auto-refresh for feed, game stats, roadmap, devlogs, and notifications (30s intervals)
- Welcome notification bot for new users on first login
- Real-time notifications with auto-refresh, mark-all-read, and responsive design
- Settings link in header user dropdown

### Fixed
- Push notification toggle: service worker fixed (removed TypeScript syntax + broken cache preload), 30s timeout added, stuck loading state resolved
- Footer: full black background (#000), no animations (was causing layout jump)
- Comment ordering: newest comments at bottom (chronological)
- Like button: optimistic update for instant feedback
- Delete permissions: gated to studio OWNER/ADMIN/MODERATOR or global ADMIN only
- Avatar upload: MaxLength 500 → 5,000,000 (was rejecting valid uploads)
- Avatar section: centered with larger preview

## [0.1.0] - 2026-07-23

### Added
- OG image support (default SVG) on all 16 static pages
- Canonical URLs on all pages
- JSON-LD WebSite schema with SearchAction
- Dynamic sitemap (16 entries, extensible)
- /about and /contact pages with real content
- Shared DashboardPanel/SidebarLink components
- formatRelativeTime replaces duplicated timeAgo functions

### Fixed
- Race condition: duplicate reactions now return 409 instead of crashing with 500
- completeOnboarding now sends X-CSRF-Token header (was blocking post-onboarding mutations)
- OAuth cookie domain: uses shared cookie helper (was hardcoded to localhost)
- Upload file descriptor leak: streams properly destroyed in all code paths
- Homepage error handling: shows error banner when API calls fail
- Game filters: removed non-functional filter controls that displayed but had no effect
- Console.error catch blocks: replaced with toast notifications
- alert()/confirm() calls: replaced with accessible toast alternatives
- Backend CSP: removed unsafe-inline from production script-src
- Typo: "DEVOOG" → "DEVLOG" in reactions service
- HTTP status codes: validation errors now return 400 instead of 404
- Tag upsert: replaced N+1 pattern with efficient batch operation
- Removed unused @sentry/tracing dependency (legacy v7)
- Archived stale security docs from June 22 (contained false claims about CSRF)

### Security
- CSRF timing attack fix (timingSafeEqual) verified intact
- CSP nonce implementation verified matching in HTML
- OAuth state parameter + CSRF cookie after callback verified
- Mass assignment protections verified
- Session fixation fix verified
- Upload path traversal protection verified
