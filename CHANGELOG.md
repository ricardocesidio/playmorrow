# Changelog

## [Unreleased]

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
