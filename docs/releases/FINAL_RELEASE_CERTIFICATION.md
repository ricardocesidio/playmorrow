# Playmorrow — Final Release Certification

**Status:** ⏳ Not yet executed
**Mandatory before:** Official public launch
**Owner:** Engineering + Product

---

## Purpose

This certification is **mandatory** before Playmorrow can officially launch publicly.

Unlike Phase 1/Phase 2 milestone certifications (which validated individual feature sets during development), this certification validates the **real production system as a whole** — not just that code exists, but that the deployed platform works end-to-end for real users at launch scale.

Previous certification reports (`PHASE1_FINAL_VERIFICATION_v6.md`, `PHASE2_CERTIFICATION.md`) were snapshots of development progress. This certification is the **final gate** before real users arrive. It does not assume previous reports are still valid — every item must be re-verified against the live production environment at the time of certification.

---

## Engineering Validation

### Automated Tests
- [ ] Run all unit tests (`pnpm --filter @playmorrow/api test`)
- [ ] Run all integration tests
- [ ] Run all Playwright E2E tests (`pnpm test:e2e`)
- [ ] Execute accessibility tests (`axe-core` + Lighthouse)
- [ ] Confirm CI pipelines are green (quality, backend, e2e, a11y)

### Build & Deploy
- [ ] Confirm production build succeeds (`pnpm build`)
- [ ] Confirm zero critical vulnerabilities (npm audit, Snyk or equivalent)
- [ ] Verify all production environment variables (Fly.io + Vercel)
- [ ] Verify Fly.io deployment (API health + endpoints)
- [ ] Verify Vercel deployment (frontend all routes 200)
- [ ] Verify health endpoints (`/api/health`, `/health`)
- [ ] Verify monitoring (UptimeRobot both monitors Up)
- [ ] Verify Sentry captures real exceptions (force a test error, confirm in dashboard)
- [ ] Verify logs (Fly.io + Vercel accessible, retention adequate)
- [ ] Verify backups (Neon PITR + manual pg_dump + R2 backup)
- [ ] Verify rollback procedure is documented and tested

---

## Manual Product Validation

### Player Flows
- [ ] Register a new account (email + password)
- [ ] OAuth login (Google)
- [ ] OAuth login (GitHub)
- [ ] Login with existing account (email)
- [ ] Login with existing account (username)
- [ ] Logout
- [ ] Password reset flow
- [ ] Email verification flow
- [ ] Browse games (list + search + filters + sort)
- [ ] View game detail page
- [ ] View studio detail page
- [ ] View devlog detail page
- [ ] Wishlist a game
- [ ] Follow a game
- [ ] Follow a studio
- [ ] View personalized feed
- [ ] View public feed
- [ ] Search across games, studios, devlogs
- [ ] View recommendations (trending, similar, for-you)
- [ ] View notifications (SSE + push)
- [ ] Update profile settings
- [ ] Delete account

### Studio Flows
- [ ] Create a studio profile
- [ ] Studio verification flow (apply, admin approves, tier assigned)
- [ ] Publish a game (all fields: title, description, media, tags, platforms, pricing)
- [ ] Edit a game
- [ ] Upload media (screenshots, cover art, logo)
- [ ] Publish a devlog (title, body, screenshots, tags, category, schedule)
- [ ] Edit a devlog
- [ ] Create roadmap items
- [ ] View analytics (per-game + per-studio dashboards)
- [ ] View health score
- [ ] Set and track goals
- [ ] View achievements
- [ ] Create press kit
- [ ] Create brand kit
- [ ] Manage team (invite members, assign roles)
- [ ] Submit support ticket

### Admin Flows
- [ ] Verification queue (approve/reject studios)
- [ ] Support queue (view, reply, resolve tickets)
- [ ] Help Center CMS (create/edit/delete articles and categories)
- [ ] Moderation queue (view and resolve reports)
- [ ] Permissions management

---

## Security Validation

- [ ] OAuth flows complete without leaking tokens
- [ ] JWT secrets are rotated and not hardcoded
- [ ] CSRF HMAC tokens validate on every mutation
- [ ] RBAC enforced: OWNER, ADMIN, MODERATOR, MEMBER roles
- [ ] Sessions expire correctly (httpOnly cookies)
- [ ] Cookie attributes: SameSite, Secure, Path
- [ ] Uploads validated: MIME, magic bytes, dimensions, size limit
- [ ] Headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- [ ] Rate limiting functional: 60/min global, 5/min register, 10/min login
- [ ] No broken access control (unauthorized users cannot access admin routes)
- [ ] No privilege escalation (MEMBER cannot become OWNER)
- [ ] No secrets in logs or error responses
- [ ] No sensitive data in client-side bundles
- [ ] Dependency audit: zero critical vulnerabilities
- [ ] Secrets scanning active: gitleaks CI workflow + pre-commit hook
- [ ] Git history: no credentials in any commit (all rotated + rewritten)

---

## Performance Validation

- [ ] Lighthouse score ≥ 90 on all key pages (homepage, game detail, discover, devlog)
- [ ] Core Web Vitals pass (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Bundle size within budget (Next.js build analysis)
- [ ] API latency: p95 < 200ms for all endpoints
- [ ] Database query performance: no N+1 queries (verified via Prisma logging or equivalent)
- [ ] All indexes present for common query patterns
- [ ] Caching strategy effective (recommendations cache hit rate, SSR revalidation)
- [ ] SSR: key pages render HTML without JS dependency
- [ ] Hydration: no visible layout shift on client-side take-over
- [ ] Load testing: k6 or equivalent baseline established

---

## SEO Validation

- [ ] Metadata present on all public pages (title, description)
- [ ] OpenGraph tags on all public pages
- [ ] Twitter Cards on all public pages
- [ ] JSON-LD structured data on root, game, studio, devlog, discover pages
- [ ] Canonical URLs on all pages
- [ ] `robots.txt` correct (allows indexing of public pages)
- [ ] `sitemap.xml` includes all public routes + dynamic content
- [ ] Structured data: `WebSite`, `VideoGame`, `Organization`, `BlogPosting`, `CollectionPage` schemas
- [ ] Tag/genre landing pages have unique metadata
- [ ] Google Search Console: no crawl errors, no manual actions

---

## Documentation Validation

Confirm that the following documents **accurately reflect the current implementation**:

- [ ] `README.md` — project overview, tech stack, setup instructions
- [ ] `CLAUDE.md` — current state, critical items, feature status
- [ ] `STATUS.md` — verified status of every feature (or reference to latest verification doc)
- [ ] `SECURITY.md` — security practices, reporting process
- [ ] `AGENTS.md` — development history, key files reference
- [ ] `ARCHITECTURE.md` — system architecture, module relationships
- [ ] `docs/releases/PHASE2_CERTIFICATION.md` — Phase 2 certification (if still relevant)
- [ ] `docs/releases/FINAL_RELEASE_CERTIFICATION.md` — this document
- [ ] Deployment documentation (if separate from README)

Outdated or contradictory documents must be updated or archived before launch.

---

## Technical Debt Review

Before launch, the engineering team must review every remaining technical debt item.

Each item must receive one of two statuses:

| Status | Meaning |
|--------|---------|
| **Resolved** | The debt has been paid. Code fixed, tested, deployed. |
| **Accepted** | The debt is acknowledged but explicitly accepted for launch. Must include a justification and a timeline for resolution. |

Items from previous certifications that must be reviewed:

| Debt | Severity | Status | Notes |
|------|----------|--------|-------|
| Custom domain (playmorrow.com) | 🔴 | ⬜ | Blocking for public launch |
| Sentry exception filter wiring | 🟡 | ⬜ | Errors may not reach Sentry |
| Automated a11y testing | 🟡 | ⬜ | Workflow created, never executed |
| E2E test execution | 🟡 | ⬜ | Workflow created, never executed |
| Pre-commit hook | 🟡 | ⬜ | Not present in repo |
| In-memory cache (no Redis) | 🟢 | ⬜ | Single-instance only |
| Featured Studios | 🟢 | ⬜ | No `featured` field on Studio model |
| Load testing baseline | 🟢 | ⬜ | k6 not yet configured |

---

## Closed Beta Validation

Before the final certification can be approved, Playmorrow must undergo a **closed beta** with real users:

### Requirements
- Invite **10–20 real indie studios** to use the platform
- Allow them to use the platform for **2–4 weeks**
- Collect structured feedback covering:

| Category | Questions |
|----------|-----------|
| Critical bugs | Crashes, data loss, broken flows |
| UX issues | Confusing navigation, unclear CTAs, missing feedback |
| Missing features | What do they need that doesn't exist? |
| Pain points | What frustrates them about the platform? |
| Suggestions | What would make them recommend Playmorrow? |

### Post-Beta Actions
- All critical bugs must be fixed before launch
- UX issues must be triaged: fix blockers, postpone nice-to-haves
- Missing features must be evaluated for launch-blocking status
- Feedback report must be attached to this certification

---

## Final Decision

After all items above are completed, the release can receive only one of two statuses:

> 🟢 **APPROVED FOR PUBLIC LAUNCH**
>
> All checkboxes are checked. All debt is resolved or accepted. Closed beta feedback has been reviewed. The platform is ready.

OR

> 🔴 **NOT APPROVED**
>
> Items remain unchecked. The platform is not ready for public launch. See the checklist above for details.

### Certification Summary

| Domain | Score | Notes |
|--------|-------|-------|
| Engineering | ⬜ | |
| Security | ⬜ | |
| Performance | ⬜ | |
| Accessibility | ⬜ | |
| SEO | ⬜ | |
| Documentation | ⬜ | |
| **Overall Production Readiness** | ⬜ | |

### Remaining Risks

_To be filled at certification time._

### Known Limitations

_To be filled at certification time._

### Final Recommendation

_To be filled at certification time._

---

*This document was created as part of the Phase 2 Release Certification process on 2026-07-29. It must be completed before public launch.*
