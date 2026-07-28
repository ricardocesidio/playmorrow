# Playmorrow — Enterprise Engineering Audit

**Date:** 2026-07-28
**Audit Team:** Principal SWE (30y), Security, Backend, Frontend, DB, DevOps, QA, SEO, CTO
**Type:** Pre-Closed Beta Engineering Review
**Scope:** Phase 1 — Foundation Platform

---

## Executive Summary

Playmorrow has built a surprisingly mature foundation for a pre-beta indie game discovery platform. 

**Overall Score: 76/100**

The platform is functional, reasonably secure, and has genuine depth across 4 milestones + 1 intelligence layer. The architecture is clean (NestJS monorepo with Event Bus), the security is better than most startups (HMAC CSRF, CSP nonce, argon2id, rate limiting, DOMPurify), and the database schema is well-normalized (51 Prisma models).

**However, Phase 1 cannot be certified as complete in an enterprise sense.** There are real gaps that would be caught in any professional pre-launch review: no custom domain, no external uptime monitoring, secrets were accidentally exposed twice during the remediation process, and the CSP `connect-src` still references the old Railway API URL in production. More importantly, the codebase has 0 E2E tests, poor accessibility (no formal WCAG audit), and no load testing baseline.

**Verdict: PHASE 1 — CONDITIONALLY READY FOR CLOSED BETA**

The platform CAN support a closed beta with 5-10 friendly studios. It CANNOT be called "enterprise complete" without addressing the critical and high-severity items below. Phase 2 planning should begin, but the first sprint of Phase 2 must resolve Phase 1's open items.

---

## Scores

| Category | Score | Assessment |
|----------|-------|------------|
| **Documentation** | 72/100 | Well-written CLAUDE.md and verification reports. Missing: handoff docs outdated, no architecture decision records, no runbook. |
| **Architecture** | 82/100 | Clean monorepo, Event Bus for decoupling, proper NestJS module structure. Smell: dual event system (EventBus + FeedEngine), in-memory EventBus (lost on restart). |
| **Backend** | 78/100 | 37 modules, solid NestJS patterns, proper DTO validation. Issues: N+1 feed pagination (partially fixed with cursor), ConfigService cache issue, 5 stale processes. |
| **Frontend** | 70/100 | Next.js 15 App Router, TanStack Query, good component patterns. Issues: all pages are `'use client'`, no server components except layouts, CORS config required hotfix after migration, CSP connect-src still has Railway URL. |
| **Database** | 88/100 | 51 well-designed models, proper indexes, correct cascade deletes, good enum coverage. |
| **Security** | 74/100 | Strong foundations (CSRF, CSP, argon2, rate limiting). Two secret exposure incidents during remediation. CSP connect-src still points to Railway (not fixed). Pre-commit hook added. |
| **Performance** | 65/100 | No load testing baseline, in-memory feed pagination (partially fixed), auto-refresh 30s is good. Missing: bundle analysis, image optimization, Core Web Vitals tracking. |
| **Accessibility** | 35/100 | Basic ARIA on shared components. No formal WCAG audit. No keyboard navigation testing. Color contrast not verified. Screen reader support unknown. |
| **SEO** | 75/100 | JSON-LD on 3 dynamic routes, OG tags, canonical URLs, sitemap. Issues: all pages are `'use client'` (no server-side metadata for most pages), no custom domain. |
| **DevOps** | 55/100 | Vercel + Fly.io, GitHub Actions CI. No dedicated test DB, no staging with real data, no uptime monitoring (UptimeRobot pending), secrets rotated via CLI but no vault. |
| **Testing** | 45/100 | 263 backend tests (integration). ZERO E2E tests (Playwright configured but not run). ZERO unit tests for services. Frontend has no tests at all. |
| **Business Readiness** | 60/100 | Functionally complete for closed beta. Missing: legal polish, privacy policy has contradictions (removed), cookie policy refers to non-existent footer link, no GDPR cookie consent tested. |
| **Production Readiness** | 55/100 | API is up, storage works, but: no uptime monitoring, CSP has stale Railway URL, CORS needed hotfix after migration, no backup strategy, no disaster recovery plan. |
| **Overall** | **76/100** | Strong start. Needs ~4-6 weeks of hardening before public launch. Ready for closed beta with 5-10 studios. |

---

## Top 25 Strengths

1. **CSRF protection**: HMAC-SHA256 stateless, global APP_GUARD, timing-safe comparison — enterprise grade
2. **CSP**: Nonce-based middleware with proper directives — better than 90% of startups
3. **Argon2id password hashing**: Memory-hard, timing-safe, with per-password salts
4. **Database schema**: 51 models, proper indexes on all FKs, correct cascade deletes, comprehensive enums
5. **Event Bus architecture**: Central typed emit/on enables loose coupling between modules
6. **Studio RBAC**: 4-tier studio roles (Owner/Admin/Moderator/Member) with seat limits and invitation system
7. **Rate limiting**: 60/min global, 5/min register, 10/min login — properly layered
8. **Upload validation**: MIME whitelist + magic bytes + dimension check (4096px) + 20MB limit — comprehensive
9. **Dual-emit migration**: All 5 FeedEngine consumers migrated to dual EventBus — good intermediate step
10. **Cursor-based feed pagination**: Proper composite cursor, no data loss — correct engineering choice
11. **Audit logging**: Full audit trail across controllers — necessary for enterprise compliance
12. **TanStack Query patterns**: Proper cache keys, 30s auto-refresh, optimistic updates, proper invalidation
13. **File upload security**: Validates magic bytes AND MIME type (not just extension) — prevents polyglot attacks
14. **JSON-LD structured data**: 3 schema.org types (VideoGame, Organization, BlogPosting) — good SEO foundation
15. **OG metadata**: Present on all 3 dynamic content routes with real entity data
16. **Cloudflare R2 storage**: Zero egress fees, public bucket, CDN_URL configured — cost-effective
17. **Session management**: `authVersion` field for bulk invalidation, rotating refresh tokens, SHA-256 hashed sessions
18. **Account lockout**: Failed login counter + `lockedUntil` timestamp — basic brute force protection
19. **Email verification**: 6-digit code-based, rate-limited per user
20. **Scheduled devlogs**: Cron-based publishing with `@nestjs/schedule`
21. **Help Center**: Full CMS with categories, search, feedback, reading time — complete feature
22. **Support ticketing**: Status workflow, departments, admin queue, history trail, email notifications
23. **Studio verification**: 6 tiers, trust score, company profile, press kit, brand kit — impressive depth
24. **Pre-commit hook**: Blocks secrets in git — added after incident, shows learning
25. **Git history rewritten**: `git-filter-repo` used to remove leaked secrets — correct incident response

---

## Top 25 Weaknesses

### Critical (Must Fix Before Any Public Launch)

1. **🔴 CSP `connect-src` still has Railway URL**: `middleware.ts` line 57 still allows `playmorrow-api-production.up.railway.app` in CSP. After migrating to Fly.io, this should be updated to the Fly.io domain. **Fix: 5 minutes.**

2. **🔴 No uptime monitoring**: 3-day outage (24-27 July) went undetected. UptimeRobot (or equivalent) is free and takes 10 minutes to set up. This is the single biggest operational risk.

3. **🔴 No custom domain**: Site runs on `*.vercel.app` (public suffix). Cookie domain was incorrectly `.vercel.app` (now removed, host-only). Cannot set proper `COOKIE_DOMAIN` or have professional SSL without a real domain. **Blocking for public launch.**

4. **🔴 Zero E2E tests**: 263 backend integration tests exist. Zero Playwright tests. The entire `register → login → studio → game → devlog` flow is untested end-to-end. **Must fix before inviting real users.**

### High (Should Fix Before Phase 2)

5. **🟠 Secrets exposed twice**: R2 credentials in v1 report, JWT/SESSION/CSRF in v2 report. Both incidents happened during THIS remediation session. Pre-commit hook added, but the pattern of putting secrets in documentation files needs a systemic fix (CI-level gitleaks/trufflehog).

6. **🟠 No accessibility audit**: WCAG AA compliance unknown. Keyboard navigation, screen readers, color contrast never tested. Legal risk in some jurisdictions.

7. **🟠 No load testing**: No k6/autocannon baseline. Unknown how the platform behaves under 10/100/1000 concurrent users. The Neon DB connection pool limit is unknown.

8. **🟠 All frontend pages are `'use client'`**: 76 pages, all client-rendered. No server components for data fetching. This means worse Core Web Vitals (no streaming SSR), and any page without a `layout.tsx` parent has no SEO metadata.

9. **🟠 ConfigService cache issue**: `configService.get('CDN_URL')` returned undefined when set via Fly.io secrets after deploy. Fixed by switching to `process.env`. The root cause (ConfigService caching at bootstrap) affects all 20+ config reads. Mitigation: always set secrets BEFORE deploy, or use `process.env` for dynamic values.

10. **🟠 No staging with real data**: Staging environment exists on Railway/Fly but has no real data or traffic. Can't test migrations, performance, or data integrity before production deployment.

### Medium (Fix Within Phase 2)

11. **🟡 In-memory EventBus**: Events lost on server restart. RxJS Subject pattern — ephemeral by design. For a beta this is acceptable, but for production users (notification delivery guarantee), this needs Redis or similar.

12. **🟡 Dual event system**: EventBus + FeedEngine coexist without documentation of when to use which. The dual-emit migration is an intermediate step, not a final state.

13. **🟡 No backup strategy**: Neon DB backups are automatic, but there's no documented restore procedure. No backup of R2 bucket. No backup of Fly.io secrets.

14. **🟡 No disaster recovery plan**: If Fly.io goes down, there's no runbook for restoring service. If Neon goes down, same. If both go down, same.

15. **🟡 5 stale NestJS processes**: Multiple `nest start --watch` processes accumulate over time, consuming RAM. PID 1117 (`node dist/main`) was running alongside the `--watch` processes.

16. **🟡 Logout loop bug**: Rotating `CSRF_SECRET` made logout impossible (logout requires CSRF). Fixed with `@SkipCsrf()` decorator — but this was only identified during user testing, not during development.

17. **🟡 CORS hotfix after migration**: `WEB_ORIGIN` env var wasn't migrated to Fly.io. `next.config.ts` still had Railway hardcoded as fallback. Both discovered only when user reported errors.

### Low

18. **🔵 Rate limit test `.skip`**: `security-auth.spec.ts` has a skipped test for register rate limiting. The test expects 5/min, which IS the actual `@Throttle({ limit: 5 })` config — the test should be fixed, not skipped.

19. **🔵 R2 bucket created with "All buckets" permission**: The API token was created for "All R2 buckets on this account" rather than scoped to `playmorrow-uploads` only. Works, but violates least-privilege.

20. **🔵 No TypeScript path aliases**: Relative imports like `../../../common/` are used throughout. No `@common/` or `@auth/` path aliases configured.

21. **🔵 Devlog page metadata**: JSON-LD `image` field falls back to generic OG image even for devlogs with screenshots. The code reads `devlog.screenshots[0]?.url` correctly, but test data has no screenshots.

22. **🔵 `console.warn` in production catch blocks**: 3 dashboard pages use `catch { console.warn("error") }` — silent failure, no user feedback.

23. **🔵 `.env` file contains secrets**: The local `.env` file has `DATABASE_URL`, `JWT_SECRET`, etc. in plain text. While these are dev values, the pattern normalizes secret-in-env which is risky.

24. **🔵 No license file**: Repository has no `LICENSE.md`. The README says "All Rights Reserved" but there's no formal license file.

25. **🔵 Storybook files exist**: `apps/web/components/footer.stories.tsx` — stale Storybook file from an abandoned setup. Not referenced in any config. Should be removed.

---

## Files That Should Be Removed

| File | Reason |
|------|--------|
| `apps/web/components/footer.stories.tsx` | Abandoned Storybook setup, stale |
| `apps/api/src/auth/guards/optional-jwt.guard.ts` | Already removed in round 2 — verify deletion |
| `apps/api/uploads/*.png` (90+ files) | Developer test uploads, should be gitignored |

## Files That Should Be Updated

| File | Issue |
|------|-------|
| `apps/web/middleware.ts:57` | CSP `connect-src` still has Railway URL |
| `apps/web/next.config.ts:33` | Rewrite fallback still has Railway URL |
| `packages/database/prisma/schema.prisma` | `devlog.tags` has no `@default([])` — causes null constraint violations |

---

## Phase 1 Certification

**Verdict: ❌ NOT ENTERPRISE-CERTIFIED**

**Condition: ✅ READY FOR CLOSED BETA**

Phase 1 is functionally complete and can support a closed beta with 5-10 studios. However, calling it "enterprise complete" would be inaccurate. The 4 critical items (CSP stale Railway URL, no uptime monitoring, no custom domain, no E2E tests) must be resolved before any public launch.

The engineering team has done good work. The architecture is sound. Security is better than average for this stage. The remediation effort (cursor-based pagination, R2 migration, secrets rotation, dual-emit) shows responsiveness to audit findings.

---

## PHASE 2 EXECUTION PLAN

*Conditional on resolving 4 critical items first.*

### Milestone 5 — Discovery Platform & Recommendation Engine
**Estimated: 3-4 weeks (1-2 engineers)**

**Sub-phase 5.1 — Custom Domain + SEO Foundation (Week 1)**
- Buy `playmorrow.com` domain
- Configure Vercel custom domain + Fly.io CORS
- Update CSP `connect-src` to Fly.io URL
- Remove all Railway references from codebase
- This is a PREREQUISITE for any Phase 2 work

**Sub-phase 5.2 — Recommendation Engine (Week 2)**
- Tag-based collaborative filtering (Prisma: find games with similar tags)
- Follow-based recommendations (find games followed users also follow)
- Trending algorithm (weighted score: follows + reactions + wishlists in 7d window)
- API endpoint: `GET /api/recommendations?type=trending|for-you|similar`

**Sub-phase 5.3 — Discovery Homepage Redesign (Week 2-3)**
- Server components for dynamic OG metadata (fixes current `'use client'` SEO gap)
- Curated sections: "Trending", "Recently Updated", "Popular Devlogs"
- Personalized "For You" section (requires recommendation engine)
- Skeleton loading states for each section

**Sub-phase 5.4 — Advanced Search (Week 3-4)**
- Full-text search with Prisma `search` capability
- Filters: genre, status, platform, tag, release window
- Sort: relevance, popularity, newest, most wishlisted
- Debounced search with cached results

**Architecture decisions:**
- Recommendation engine should be a separate module (`apps/api/src/recommendations/`)
- Cache trending results for 1 hour (in-memory, not persistent)
- Trending calculation as a background job (not per-request)

### Milestone 6 — Playtests Platform
**Estimated: 4-6 weeks (1-2 engineers)**

**Sub-phase 6.1 — Demo Upload System (Week 1-2)**
- Secure file upload with 2GB limit (separate from image upload)
- Platform-specific packaging (Windows/Mac/Linux fields)
- Version management (upload new builds, keep history)
- Build notes field for testers

**Sub-phase 6.2 — Playtest Scheduling (Week 2-3)**
- Date window + participant cap
- Application workflow (apply → approve → reject)
- Auto-notifications on schedule changes
- Calendar endpoint (GET /api/playtests/upcoming)

**Sub-phase 6.3 — Feedback Collection (Week 3-4)**
- Structured feedback form (rating, categories, free text)
- Bug report template with screenshot attachment
- Aggregated feedback dashboard for studios
- NDA acceptance flow (upload + digital signature)

**Sub-phase 6.4 — Tester Management (Week 4-5)**
- Tester reputation system (completion rate, quality score)
- Tester leaderboard and achievements
- Per-game tester blacklist/whitelist

**Architecture decisions:**
- Playtest builds stored in same R2 bucket under `playtests/` prefix
- Feedback is structured JSON, not unstructured text
- Use EventBus for notifications (playtest_approved, build_uploaded, feedback_submitted)

### Milestone 7 — Community Platform
**Estimated: 4-5 weeks (1-2 engineers)**

**Sub-phase 7.1 — Per-Game Discussion Boards (Week 1-2)**
- Thread creation with categories (general, suggestions, bugs, media)
- Pinning, locking, moderation tools
- Notifications for thread replies (via existing EventBus + notifications module)
- Rich text replies (reuse existing SanitizedMarkdown)

**Sub-phase 7.2 — User Profiles 2.0 (Week 2-3)**
- Public profile page (games played, wishlist, comments, devlog reactions)
- Activity feed on profile (reuse existing Activity Timeline)
- Bio, links, game collection display
- Profile customization (banner image upload via existing upload service)

**Sub-phase 7.3 — Direct Messaging (Week 3-4)**
- One-on-one messaging (new DB model: `DirectMessage`, `DirectMessageThread`)
- Read receipts
- Block/mute controls
- Rate limited (30/min per thread)

**Sub-phase 7.4 — Community Events (Week 4-5)**
- Studio-hosted events (game jams, screenshot contests, Q&A sessions)
- Calendar view
- Participant RSVP
- Event notifications (EventBus)

**Architecture decisions:**
- Direct messages should be their own module, not part of Comments
- Use existing NotificationsService for event-based notifications
- Community events should support both online and physical location fields

---

## Strategic Recommendations

1. **Hire a frontend-focused engineer** before Phase 2. The backend is solid; the frontend needs server components, accessibility, and E2E testing — a specialist skillset.

2. **Set up gitleaks in CI** before the next commit. Two secret leaks in one session is a pattern, not an accident. The pre-commit hook helps locally, but CI-level scanning catches what local hooks miss.

3. **Buy the domain immediately**. `playmorrow.com` should be purchased and configured before any public link is shared. The current `*.vercel.app` URL is unprofessional for studio outreach.

4. **Write a 1-page runbook**. What to do when the API goes down (as it did for 3 days). Where to check logs (Fly.io dashboard / `flyctl logs`). Who to contact. This single page is worth more than 100 pages of architecture documentation.

5. **Delete stale test data monthly**. The database accumulated 73 studios, 68 games, and 1798 users — mostly test artifacts. A monthly cleanup script (the existing `cleanup-test-artifacts.ts`) should be run or scheduled.

6. **Remove the `*.stories.tsx` file** and any abandoned Storybook config. Dead files create confusion and suggest unfinished work.

7. **Add a `SECURITY.md` to the repo** with clear reporting guidelines. Currently only has a `CLAUDE.md` rule — external researchers need a formal channel.
