# Audit Response — Phase 5 & 6 Review

**Date:** 2026-08-05
**Response to:** Independent Architectural Audit Report

---

## Summary

The audit identifies real issues but **misattributes 3 of 5 "critical" findings as current bugs when they were resolved in RC3/RC3.1.** The confusion stems from the HANDOFF.md listing these as "known technical debt" (past issues, not current bugs).

---

## Critical Findings — Status Verification

### CR-01: Marketplace Payment Flow — NOT BROKEN (FIXED)
**Code evidence:** `apps/web/app/marketplace/[id]/page.tsx:102` — StripePayment IS rendered.
**Fixed in:** RC3 (Session 19, 2026-08-05)
**HANDOFF confusion:** Listed under "Known Technical Debt" section — meaning "was an issue, resolved." The auditor misread this as current.

### CR-02: Event Registration — NOT BROKEN (FIXED)
**Code evidence:** `apps/web/app/events/[slug]/page.tsx:82` — `onClick={() => setRegistered(true)}` exists.
**Fixed in:** RC3 (Session 19, 2026-08-05)

### CR-03: Missing RBAC Guards — NOT BROKEN (FIXED)
**Code evidence:** Both `events/events.controller.ts:24-25` and `partner/partner.controller.ts:23-24` now use `@UseGuards(SessionAuthGuard, RolesGuard)` + `@Roles('ADMIN', 'MODERATOR')`.
**Fixed in:** RC3 (Session 19, 2026-08-05)

### CR-04: No Transactional Rollback — VALID, UNRESOLVED
**Status:** Marketplace purchase creates PaymentIntent then records Transaction. If Transaction fails, PaymentIntent is orphaned. No compensating rollback.
**Acknowledged.** Will fix.

### CR-05: /me/licenses Auth — PARTIALLY VALID
**Status:** Page has inline `useAuth()` check returning null. Not inside dashboard layout. For users without auth, shows blank page instead of redirecting to /login. **Acknowledged.** Will fix.

---

## High-Severity Findings — Responses

| # | Finding | Response |
|---|---------|----------|
| HI-01 | 91/100 Score Not Credible | **Partially agreed.** The score overstates maturity. The scoring methodology is documented in FINAL_ENGINEERING_SCORECARD.md but was self-assigned. We'll retire self-certification labels (Gold, Platinum) and adopt a Blocked/Conditional/Clear traffic light system. |
| HI-02 | Zero Phase 5 Integration Tests | **Agreed.** Phase 5 has 50 unit tests with mocked Prisma. Integration tests (Supertest + test DB) are needed for payments/marketplace/events. This was on the Phase 6 backlog. |
| HI-03 | Fly.io Free Tier | **Agreed.** Upgrading to paid tier is $5/month trivial. This should have been done before certification claims. |
| HI-04 | No Staging Environment | **Agreed.** For a payment-processing platform, this is negligent. Will provision staging before next deployment. |
| HI-05 | Provider-Agnostic AI Partially Broken | **Agreed.** Anthropic implements chat() only. If code calls embed() or moderate() with AI_PROVIDER=anthropic, it fails at runtime. The interface should be split or fallbacks added. |
| HI-06 | In-Memory Rate Limiting + SSE | **Agreed.** In-memory throttler + RxJS Subject won't scale past 1 instance. Redis needed. |
| HI-07 | pgvector on Transactional DB | **Disagree with urgency.** At current scale (hundreds of games, single instance), pgvector on Neon is fine. This becomes a problem at 100K+ games / 10K+ embeddings. The audit is right that it won't scale, but wrong that it's a critical blocker today. Defer to Phase 6. |
| HI-08 | No 2FA | **Agreed.** For Stripe Connect studios handling revenue, 2FA is mandatory. Will implement TOTP. |
| HI-09 | GDPR Export UI | **Agreed.** Legal requirement, not a feature. Will implement. |

---

## Medium Findings — Responses

| # | Finding | Scheduled |
|---|---------|-----------|
| ME-01 | 137 any types | Phase 6: add CI gate for new any types, fix 20/week |
| ME-02 | Dual event system | Phase 6: consolidate to single event bus |
| ME-03 | No coverage thresholds | Immediate: add to vitest.config.ts |
| ME-04 | Tests share dev DB | Phase 6: Testcontainers or Neon branch |
| ME-05 | No update DTOs | Immediate: create UpdateDto for Phase 5 entities |
| ME-06 | applyReferral read-only | Phase 6: implement referral_usage table |
| ME-07 | No pagination UI | Phase 6: cursor-based pagination |
| ME-08 | Local disk uploads | Phase 6: MinIO in dev |
| ME-09 | No email fallback | Phase 6: AWS SES secondary |
| ME-10 | Dependabot paused | Immediate: re-enable |

---

## AI Governance — Honest Assessment

The auditor's characterization of AI governance as "theater" is **harsh but with valid core concerns:**

1. **28 documents for 0 features** — True. The governance was designed to prevent future mistakes, but it was premature to fully elaborate before any feature ships.

2. **8-week deprecation unrealistic** — The auditor is right that sunk cost will make deprecation difficult. But having the policy is better than not having it, even if imperfectly enforced.

3. **$500/month cap arbitrary** — Agreed. Should be per-feature, not platform-wide.

4. **Provider-agnostic broken for embeddings** — Agreed (HI-05).

5. **No PrivacyService** — True. Constitution Article 5 was aspirational. Need to implement.

6. **69 capabilities premature** — **Disagreed.** The capability map is a strategic reference, not a build plan. Knowing what you might build and what you definitely won't is valuable even if most are deferred. The auditor's "delete 66, keep 3" suggestion confuses a reference architecture with a sprint plan.

7. **Prompt registry without evaluation** — Agreed. Versioning without A/B testing or red-teaming is incomplete.

8. **Cargo-culted governance** — **Partially agreed.** The structure is enterprise-patterned but the project has a single developer. The governance should be proportionally simplified for the current team size while preserving the principles.

**Recommendation:** Keep Constitution (20 articles), simplify Decision Framework (24→8 gates), keep capability map but mark it as "STRATEGIC REFERENCE — NOT BUILD ORDER." Ship M23 first, then rebuild governance based on real experience.

---

## What We Will Change (Priority Order)

### Immediate (Week 1)
1. Fix CR-04: Transactional rollback for marketplace purchase
2. Fix CR-05: /me/licenses auth redirect
3. Upgrade Fly.io to paid tier
4. Re-enable Dependabot
5. Add Vitest coverage thresholds
6. Create update DTOs for Phase 5 entities
7. **Retire self-certifications** (Platinum, Gold, RC3.x) — adopt Blocked/Conditional/Clear

### Week 2
8. Implement 2FA for studios
9. Add GDPR data export UI
10. Simplify Decision Framework (24→8 gates)
11. Fix provider-agnostic: split interfaces or add fallback chains

### Weeks 3-4
12. Write Phase 5 integration tests
13. Provision staging environment
14. Provision Redis

### Weeks 5-6
15. Ship M23 (content-based recommendations)
16. A/B test against existing scorers

---

## Honest Status

**The auditor was right about the fundamental issue:** We claimed production maturity while having operational gaps (no staging, free tier, no Redis) and over-elaborated governance for zero AI features.

**The auditor was wrong about 3 critical bugs** — they were already fixed but the HANDOFF listed them as "known debt" which the auditor misread as current.

**The correct current state:**
- Platform: v0.8-beta, not v1.0
- Phase 5 features: backend complete, frontend functional, needs integration tests
- Phase 6 AI: infrastructure built, governance designed (over-elaborated), zero features shipped
- Overall: functional but not production-hardened

**Phase 6 should begin only after Critical and High findings are resolved, with M23 (recommendations) as the first AI feature — not M22 (chat assistant).**
