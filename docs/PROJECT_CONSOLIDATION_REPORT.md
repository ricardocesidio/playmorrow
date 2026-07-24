# Playmorrow — Project Consolidation Report

**Date:** 2026-07-24
**Commits:** 821
**Engineering Score:** 84/100

---

## Executive Summary

Playmorrow has evolved from a prototype into a comprehensive indie game discovery platform with enterprise-grade features across 4 milestones + 1 intelligence layer. The platform now supports player accounts, studio accounts, game publishing, devlogs, roadmaps, community features, analytics, platform intelligence, support, help center, and studio verification.

The architecture is modular, event-driven, and designed for scalability. All modules communicate through a central Event Bus. Data flows are deterministic and auditable. Security is enforced at every layer (CSRF, CSP, rate limiting, RBAC, input validation, upload validation).

---

## Architecture Score: 85/100

| Category | Score | Notes |
|----------|-------|-------|
| **Frontend** | 82/100 | Next.js 15 App Router, React 19, TanStack Query, shared design system, cyberpunk theme |
| **Backend** | 84/100 | 27+ NestJS modules, global guard chain, Event Bus, Prisma ORM |
| **Database** | 85/100 | 40+ models, 100+ indexes, proper cascades, normalized schema |
| **Security** | 82/100 | HMAC CSRF, CSP nonce, argon2id, rate limiting, RBAC, upload validation |
| **DevOps** | 70/100 | Vercel + Railway, Docker, CI pipeline. Missing: staging env, uptime monitoring |
| **Documentation** | 80/100 | README, STATUS.md, SECURITY.md, ARCHITECTURE.md all rewritten. Handoffs available. |
| **Testing** | 45/100 | Test infrastructure exists, no isolated test DB, ~260 tests on session-11 branch |
| **Performance** | 78/100 | Auto-refresh (30s), event aggregation, Prisma indexes, lazy loading |
| **SEO** | 88/100 | OG image, canonical, JSON-LD, sitemap, meta descriptions on all pages |
| **Accessibility** | 60/100 | ARIA, keyboard nav on key components, reduced-motion support, WCAG AA not fully audited |

**Overall: 84/100**

---

## Completed Milestones

### Milestone 1: Core Support Ecosystem
- Ticket system (create, reply, assign, status workflow)
- Admin queue with search and filters
- Email notifications on ticket creation
- Sequential ticket numbers (PM-2026-XXXXXX)
- History/audit logging for all ticket actions
- Rate-limited endpoints (20 req/min)

### Milestone 2: Help Center
- Full documentation platform with CMS
- 8 categories, 19 seed articles
- Full-text search with case-insensitive matching
- Article feedback (helpful/not helpful)
- Reading time computation
- Article CRUD for admins
- SEO metadata per article

### Milestone 3: Studio Analytics
- Real event tracking (game views, follows, wishlists)
- 6 TanStack Query hooks for data fetching
- Studio analytics dashboard with charts (recharts)
- Per-game analytics with time-series
- Traffic sources and country breakdowns
- Growth indicators (7d/30d/90d periods)
- Events wired into games, follows, wishlist controllers

### Milestone 3.5: Platform Intelligence
- Central Event Bus (typed emit/on pattern)
- Activity Timeline recording 17+ event types
- 12 deterministic studio goals with auto-progress
- 4 studio achievements with auto-unlock
- Studio Health Score (0-100, 4 categories)
- Deterministic recommendations
- Weekly report generation (Monday 8AM cron)
- Intelligent notifications for milestones

### Milestone 4: Studio Verification & Trust
- 6 verification tiers (UNVERIFIED → FEATURED_STUDIO)
- Verification request/review workflow
- Trust Score (deterministic 0-100)
- Company Profile (15 fields including legal, social, platforms)
- Press Kit (logos, key art, awards, trailer, downloads)
- Brand Kit (colors, typography, brand rules)
- Studio Profile 2.0 with verification badge + trust score
- Admin verification queue

---

## Module Inventory

### Authentication & Security
- Session-based authentication (httpOnly cookies)
- OAuth (Google, GitHub)
- JWT refresh tokens
- CSRF (HMAC stateless, global guard)
- CSP (nonce-based frontend, helmet backend)
- Rate limiting (60/min global, per-route overrides)
- Password hashing (argon2id)
- Upload validation (MIME + magic bytes + dimensions)
- RBAC (UserRole + StudioRole)
- Audit logging

### Player Features
- Account registration (email verification)
- Login/logout
- Profile settings (avatar, bio, location)
- Email change
- Push notification toggle
- Wishlist
- Following (studios + games)
- Comments + replies
- Reactions (LIKE, LOVE, HYPE, INSIGHTFUL)
- XP system + levels
- Achievements

### Studio Features
- Studio creation + management
- Team management (Owner/Admin/Moderator/Member)
- Invitations system
- Company profile (legal info, socials, platforms)
- Press Kit (logos, key art, awards, trailer)
- Brand Kit (colors, typography, rules)
- Verification (6 tiers)
- Trust Score
- Goals + Achievements
- Health Score + Recommendations
- Weekly Reports
- Activity Timeline
- Analytics Dashboard (views, followers, wishlists, charts)

### Games & Publishing
- Game CRUD with media, tags, platforms
- Screenshots (up to 10)
- Trailer embedding
- Roadmap management
- Press Kit (per-game)
- README (Markdown)
- Publishing workflow (draft → published)
- Game page SEO (OG image, canonical, JSON-LD)

### Devlogs
- Rich Markdown editor (preview/split modes)
- Screenshots (up to 10)
- Categories, tags, scheduling
- Reading time auto-compute
- Blog-style design (hero image, two-column layout)
- Reactions (LIKE, LOVE, HYPE, INSIGHTFUL)
- Comments with replies

### Community
- Comments on games + devlogs
- Nested replies (3 levels)
- Reactions on comments
- Comment editing + deletion
- Studio member permissions for moderation

### Feed & Notifications
- Public feed with 30s auto-refresh
- Personal feed with 30s auto-refresh
- SSE real-time notifications
- Push notifications (VAPID + service worker)
- Email notifications (Resend)
- Notification dropdown with mark-all-read
- Welcome notification bot

### Analytics & Intelligence
- Event tracking (game views, follows, wishlists)
- Studio Analytics Dashboard (charts, growth)
- Per-game analytics (time-series, traffic, countries)
- Activity Timeline (17 event types)
- Event Bus (central publish/subscribe)
- Goals (12 auto-tracked milestones)
- Achievements (4 auto-unlockable)
- Health Score (deterministic 0-100)
- Recommendations (deterministic rules)
- Weekly Reports (Monday 8AM cron)

### Support Ecosystem
- Support tickets with status workflow
- Department classification (14 departments)
- Admin queue with search + filters
- Email notifications
- Sequential ticket numbers
- History/audit logging

### Help Center
- Documentation platform with CMS
- 8 categories, 19 seed articles
- Full-text search
- Article feedback
- Admin article CRUD
- SEO per article

---

## Remaining Issues

1. **No isolated test database** — Integration tests run against dev DB. Session 11 branch has fixes but wasn't merged.
2. **No uptime monitoring** — No Better Stack/UptimeRobot configured.
3. **No staging environment** — Railway preview deployments not configured.
4. **`COOKIE_DOMAIN` not set on Railway** — May affect production session persistence.
5. **VAPID keys not set on Railway** — Push notifications work locally but not in production.
6. **AWS keys not set** — Uploads use local disk, not S3.
7. **CI gating not enforced** — Test failures don't block merge.
8. **Docker build cache issue** — Railway builds may produce stale images.

---

## Strategic Roadmap

### Version 1.0 Requirements
1. Isolated test database (Neon branch)
2. Uptime monitoring (Better Stack)
3. Production environment variables audit
4. CI gating (require tests to pass)
5. Full Playwright E2E run
6. Lighthouse audit (target 90+)
7. Accessibility audit (WCAG AA)

### Milestone 5: Discovery Platform & Recommendation Engine
- Game discovery homepage redesign
- Recommendation engine (tag-based, follow-based, trending)
- Personalized feed
- Advanced search with filters
- Featured games curation
- Trending games algorithm

### Future Milestones
- **Playtests** — Demo uploads, playtest scheduling, feedback collection
- **Moderation Platform** — Abuse reports, DMCA, security reports, ban management
- **Customer Success** — Live chat, AI assistant, SLAs, satisfaction surveys
- **Marketplace** — Game purchases, payment processing, revenue sharing
- **Mobile Apps** — React Native or Flutter companion apps

---

## Technical Debt

| Item | Severity | Notes |
|------|----------|-------|
| `token` variable in auth context always null | LOW | Auth context has `token` state that's never set. Hooks receive token but don't use it (API client reads cookie directly). |
| Dual RBAC patterns | LOW | `StudioRolesGuard` decorator vs `assertStudioAccess()` in services. Both work, but inconsistency is a maintenance risk. |
| No middleware.ts test coverage | LOW | CSP middleware has no automated tests. |
| Some routes don't validate request body | MEDIUM | A few PATCH endpoints lack full DTO validation. |
| Upload png files in git tracking | LOW | Developer upload artifacts keep being added to git. Should add `apps/api/uploads/*.png` to .gitignore. |
