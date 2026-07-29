# Playmorrow — Phase 3 Roadmap: Operations & Growth

**Date:** 2026-07-29
**Status:** 🟢 Approved — Engineering Certified (86/100), Security Certified (84/100)
**Previous:** Phase 1 (Foundation) + Phase 2 (Discovery) + Security Hardening

---

## Vision

Playmorrow transitions from a built platform to a **growing platform**. Phase 3 is not about adding more features for the sake of features — it's about acquisition, retention, moderation, automation, marketing, and operations. Every milestone must answer: *"Does this help Playmorrow grow?"*

---

## Business Objectives

| Objective | KPI | Target |
|-----------|-----|--------|
| User acquisition | New registrations per week | 100+/week |
| Studio acquisition | New studios per week | 10+/week |
| Retention (D1) | Users returning day after registration | >30% |
| Retention (D7) | Users returning within 7 days | >15% |
| Engagement | Devlogs published per week | 50+/week |
| Moderation | Reports resolved within 24h | >90% |
| Email engagement | Email open rate | >40% |
| API adoption | External API keys issued | 5+ in first month |

## Technical Objectives

| Objective | Why |
|-----------|-----|
| Zero critical vulnerabilities | User trust before scaling |
| Automated security gates in CI | Prevent regressions |
| Complete E2E + A11y test execution | Production confidence |
| Redis for rate limiting + cache | Horizontal scaling readiness |
| Custom domain (playmorrow.com) | Brand + cookie security |

---

## Architecture Impact

Phase 3 introduces new modules but must reuse existing infrastructure:

| Phase 3 Module | Reuses | New Infrastructure |
|----------------|--------|-------------------|
| M8 — Moderation Center | Reports module, RBAC, Event Bus, Notifications, Audit Logs | Moderation queue, spam detection hooks |
| M9 — Email Automation | Email module (Resend), templates | Queue dashboard, bounce handling, analytics |
| M10 — Marketing Platform | Analytics module, Event Bus, Feed | Campaign manager, A/B testing infra |
| M11 — Public API | Auth module, rate limiting, search | API keys, webhooks, SDK generation |
| M12 — Developer SDK | Public API module | Documentation site, package publishing |

---

## Milestone Overview

| M# | Name | Effort | Dependencies | Risk |
|----|------|--------|--------------|------|
| 8 | Moderation Center | 3-4 weeks | Reports, RBAC, Notifications | Low — mostly frontend + queue |
| 9 | Email Automation | 2-3 weeks | Email module (Resend) | Low — existing infra |
| 10 | Marketing Platform | 4-5 weeks | Analytics, Feed, Event Bus | Medium — campaign complexity |
| 11 | Public API | 3-4 weeks | Auth, Rate Limiting | Medium — security critical |
| 12 | Developer SDK | 4-6 weeks | Public API (M11) | Medium — documentation heavy |

---

## Milestone 8 — Moderation Center (First)

### Definition of Done

| Requirement | Acceptance Criteria |
|-------------|-------------------|
| Reports Dashboard | Admin can view all reports, filter by status/type/date, paginate |
| Abuse Center | Reports organized by severity: spam, harassment, illegal content, copyright |
| DMCA Workflow | Takedown request submission + automated counter-notification timer |
| Moderation Queue | Prioritized queue: most reported → least, with review status tracking |
| User Suspension | Admins can suspend users, with reason + duration + appeal URL |
| Shadow Ban | User's content visible to them but hidden from others |
| Spam Detection | Rate-limit heuristics + keyword matching + manual confirmation |
| Toxicity Queue | Comments flagged for toxic language reviewed separately |
| Audit Logs | Every moderation action logged with admin ID, timestamp, action |
| Appeals | Suspended users can submit appeal, admins can review + overturn |
| Moderator Roles | Separate permission level between admin and moderator |
| Moderator Notes | Internal notes on users/cases, visible only to staff |
| Evidence Storage | Screenshots, logs attached to reports, stored in R2 |
| Automatic Escalation | Reports unresolved after 48h auto-escalate to admin |
| Rule Engine | Configurable rules: keyword filters, rate-limit thresholds |
| Content Review | Reported devlogs, comments, games appear in review queue |
| Image Moderation Hooks | Placeholder for future AI-based image moderation API |
| Notification System | Email + in-app notification to reporter when action is taken |

### Existing Systems to Reuse

| System | How It's Used |
|--------|---------------|
| **Reports module** | Already has `POST /api/reports`, `GET /api/admin/reports`, `PATCH /api/admin/reports/:id` |
| **RBAC** | Extend with MODERATOR role (between MEMBER and ADMIN) |
| **Event Bus** | Emit events on suspension, report resolution, appeal filing |
| **Notifications** | SSE + push notifications for moderation actions |
| **Admin Dashboard** | Add moderation tab to existing admin panel |
| **Audit Log** | Already logs admin actions — extend for moderation events |
| **Upload Service** | R2 storage for evidence attachments |
| **User model** | Add `suspendedUntil`, `shadowBanned`, `appealCount` fields |

### Implementation Plan

1. Extend User model: `suspendedUntil`, `shadowBanned`, `appealCount`, `restrictionReason`
2. Extend Reports module: Add evidence upload, auto-escalation, status transitions
3. Create ModerationService: Business logic for suspension, shadow ban, appeals
4. Create ModerationController: Admin endpoints for moderation actions
5. Create frontend pages: Moderation dashboard, report detail, user detail
6. Wire Event Bus: Emit events for all moderation actions
7. Add tests: Unit + integration for moderation flows
8. Update documentation

---

## Milestone 9 — Email Automation Platform

### Definition of Done

| Requirement | Acceptance Criteria |
|-------------|-------------------|
| Email Templates | HTML templates for all email types, stored in DB or files |
| Transactional Emails | Welcome, password reset, email verification, security alerts |
| Welcome Sequence | Email at T+0, T+1d, T+3d for new users |
| Weekly Digest | Summary of followed studio activity, new games in user's genres |
| Monthly Digest | Platform stats, trending games, studio highlights |
| Devlog Notifications | Email when followed studio publishes devlog |
| Wishlist Notifications | Email when wishlisted game has news |
| Release Notifications | Email when wishlisted game releases |
| Follow Notifications | Email when someone follows user's studio |
| Security Emails | Login from new device, password changed, email changed |
| Marketing Opt-in | Checkbox during registration + settings page |
| Email Preferences | Granular: which notifications, frequency (instant/digest/off) |
| Unsubscribe Center | One-click unsubscribe from all marketing emails |
| Bounce Handling | Mark email as bounced, retry up to 3 times, then disable |
| Retry Queue | Failed emails retried with exponential backoff |
| Email Analytics | Open rate, click rate, bounce rate per template |
| Queue Dashboard | Admin view of pending/failed/sent emails |
| Scheduled Campaigns | One-off or recurring campaigns to opted-in users |

---

## Milestone 10 — Marketing Platform

### Definition of Done

| Requirement | Acceptance Criteria |
|-------------|-------------------|
| Landing Pages | CMS-managed landing pages with custom components |
| Featured Games | Curated game selection on homepage + discover |
| Featured Studios | Curated studio selection |
| Hero Campaigns | Rotating hero banners with CTA + tracking |
| Seasonal Events | Time-limited campaigns (Halloween, Summer Sale, etc.) |
| Homepage Campaign Manager | Admin UI for homepage sections + ordering |
| Newsletter Builder | WYSIWYG editor for email newsletters |
| Announcement System | In-app announcements for all users |
| Promo Codes | Generate + redeem promo codes for games |
| Referral Links | Unique referral links with tracking |
| UTM Analytics | Track UTM parameters on all campaign links |
| Social Sharing | Share game/studio pages with campaign tracking |
| Campaign Analytics | Impressions, clicks, conversions per campaign |
| Conversion Tracking | Registration → wishlist → follow → purchase funnel |
| A/B Testing | Variant testing for landing pages, CTAs, emails |

---

## Milestone 11 — Public API

### Definition of Done

| Requirement | Acceptance Criteria |
|-------------|-------------------|
| API Keys | Generate + revoke API keys via dashboard |
| Rate Limits | Per-key rate limiting (separate from user-based) |
| OAuth Apps | Third-party OAuth application registration |
| API Dashboard | Usage stats, key management, recent calls |
| API Documentation | Interactive Swagger/OpenAPI docs |
| SDK Examples | Code snippets in JavaScript, Python, curl |
| Usage Analytics | Requests/day, endpoints called, error rates |
| Token Rotation | Automatic key expiry + rotation |
| Webhooks | Event-driven callbacks for game updates, devlogs |
| API Versioning | `/api/v1/` prefix for all endpoints |

---

## Milestone 12 — Developer SDK

### Definition of Done

| Requirement | Acceptance Criteria |
|-------------|-------------------|
| JavaScript SDK | NPM package with full API coverage |
| TypeScript SDK | Types included, full type safety |
| C# SDK | NuGet package for Unity integration |
| Unity SDK | Drop-in package for game integration |
| Unreal SDK | Plugin for Unreal Engine |
| Godot SDK | GDNative/GDExtension plugin |
| Documentation | Full API reference with examples |
| CLI Tool | Command-line utility for common operations |
| Starter Templates | Project templates for each SDK |

---

## Rollout Strategy

```
Phase 3 — Rollout Sequence

Week 1-4:   M8 Moderation Center
Week 3-6:   M9 Email Automation (starts parallel to M8 final week)
Week 6-10:  M10 Marketing Platform
Week 10-13: M11 Public API  
Week 13-18: M12 Developer SDK
```

## Testing Strategy

| Layer | Requirement |
|-------|-------------|
| Unit tests | All new services + utilities >80% coverage |
| Integration tests | All new API endpoints |
| E2E tests | Critical moderation flows (report → review → action) |
| Security tests | Role escalation, IDOR, mass assignment for all new endpoints |
| Documentation tests | Every API example must be runnable |

## Success Metrics

| Milestone | Success Metric |
|-----------|---------------|
| M8 | <4h response time on critical reports |
| M9 | >40% email open rate, <3% bounce rate |
| M10 | >10% conversion on featured campaigns |
| M11 | 5+ external API integrations in first month |
| M12 | 3+ games using SDK in first quarter |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Moderation overload | Medium | High | Auto-escalation + spam detection before scaling users |
| Email deliverability | Medium | High | SPF/DKIM/DMARC setup, bounce handling, warm-up schedule |
| API abuse | Low | Critical | Rate limiting + key rotation + usage monitoring |
| SDK maintenance | Medium | Low | Automated test suites per SDK, CI for all packages |
| Feature creep | High | Medium | Definition of Done must be met before adding scope |

---

## Phase 1 & 2 Compatibility Review

| Phase 1/2 Module | Supports Phase 3? | Required Changes |
|------------------|-------------------|------------------|
| Auth (sessions + OAuth) | ✅ Yes | Extend for API keys (M11) |
| RBAC (4 studio roles) | ✅ Yes | Add MODERATOR role (M8) |
| Reports module | ✅ Yes | Extend for evidence, auto-escalation (M8) |
| Notifications (SSE + push) | ✅ Yes | Add email channel (M9) |
| Email module (Resend) | ✅ Yes | Add templates, queue, analytics (M9) |
| Analytics module | ✅ Yes | Add campaign + email analytics (M9, M10) |
| Event Bus | ✅ Yes | New event types for moderation + marketing |
| Audit Log | ✅ Yes | Extend for moderation actions (M8) |
| Upload (R2) | ✅ Yes | Evidence storage (M8), campaign assets (M10) |
| Feed Engine | ✅ Yes | Campaign content can use feed (M10) |

**No Phase 1/2 module needs to be rewritten.** All Phase 3 milestones can extend existing modules without introducing parallel implementations or technical debt.
