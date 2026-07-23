# Changelog

## [Unreleased]

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
