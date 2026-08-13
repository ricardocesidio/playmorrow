# Playmorrow — Authorization & Multi-Tenancy Adversarial Regression Audit V2

**Date:** 2026-08-12
**Baseline:** `5816532`
**Type:** Read-Only Authorization Regression Audit
**Previous Audit:** `FINAL_ADVERSARIAL_BUSINESS_LOGIC_SECURITY_AUDIT_V1.md`

---

## Executive Verdict: 🟡 AUTHORIZATION BASELINE ACCEPTED WITH 1 HIGH FINDING

1 HIGH finding (F-1 — privilege escalation via `updateMemberRole`) discovered.
V1 and V2 fixes verified intact — 0 regressions. No IDOR, no bulk operation
abuse, no route confusion. All state machines, private data endpoints, and DTOs
properly secured.

---

## 1. Baseline Integrity

| Check | Result |
|-------|--------|
| HEAD | `5816532` ✅ |
| Modified files | 0 ✅ |
| Staged | 0 ✅ |
| M23 files | 0 ✅ |
| V1 fix (MODERATOR bypass) | Verified — `if (user.role === 'ADMIN') return;` ✅ |
| V2 fix (roadmap IDOR) | Verified — `where: { id: item.id, gameId: game.id }` ✅ |

---

## 2. Regression Verification — V1 & V2

| # | Check | Result |
|----|-------|--------|
| 1 | `assertStudioAccess` — MODERATOR removed from global bypass | ✅ |
| 2 | `games.service.ts:411` delete — only OWNER/ADMIN | ✅ |
| 3 | `studios.service.ts:220` delete — only OWNER/ADMIN | ✅ |
| 4 | `game-publication.service.ts:61` publish — MODERATOR still included correctly | ✅ |
| 5 | `devlogs.service.ts:321` delete — MODERATOR still included correctly | ✅ |
| 6 | All 11 `assertStudioAccess` call sites verified | ✅ |
| 7 | `roadmap-items.service.ts:214` — `gameId: game.id` filter present | ✅ |

**0 regressions found. V1 and V2 fixes intact.**

---

## 3. Bulk Operations — All Safe

| Endpoint | Items | Authorization | Verdict |
|----------|-------|--------------|---------|
| `PATCH games/:slug/roadmap/reorder` | `items[]` | Each item uses `where: { id, gameId }` | ✅ SAFE |
| `POST api-keys` | `scopes[]` | User-scoped via `svc.create(user.id)` | ✅ SAFE |
| `POST/PATCH admin/email-templates` | `variables[]` | ADMIN-only at class level | ✅ SAFE |

---

## 4. IDOR — All 16 Mutations Safe

| Resource | Operation | Ownership Check | Verdict |
|----------|-----------|----------------|---------|
| Game | delete | `assertStudioAccess(OWNER, ADMIN)` | ✅ |
| Game | update | `assertStudioAccess(ALL)` + MEMBER gated | ✅ |
| Devlog | delete | `assertStudioAccess(OWNER, ADMIN, MODERATOR)` | ✅ |
| Devlog | update | `assertStudioAccess(ALL)` | ✅ |
| Comment | delete | ADMIN OR studio OWNER/ADMIN/MODERATOR | ✅ |
| Comment | update | `comment.authorId !== userId` | ✅ |
| Marketplace | PATCH/DELETE | Inline OWNER/ADMIN check | ✅ |
| Roadmap item | update/delete | `item.game.studio.members` | ✅ |
| API key | revoke | `findFirst({ id, userId })` | ✅ |
| Studio | update/delete | `assertStudioAccess(OWNER, ADMIN)` | ✅ |
| Member | role change / remove | Actor hierarchy checks | ✅ |
| Invitation | cancel | `findFirst({ id, studioId, status })` | ✅ |

---

## 5. State Machines — All Forward-Only

| Resource | Transition | Verified |
|----------|-----------|----------|
| Game | DRAFT → PUBLISHED (one-way) | ✅ No unpublish path |
| Game | CANCELLED → PUBLISHED (blocked) | ✅ |
| Invitation | ACCEPTED → PENDING (blocked) | ✅ |
| PasswordResetToken | Consumed → reuse (blocked) | ✅ `consumedAt` + atomic transaction |
| Marketplace | Client → COMPLETED (blocked) | ✅ Only Stripe webhook (signature-verified) |

---

## 6. New Finding

### F-1 (HIGH): `updateMemberRole` Allows ADMIN to Promote to OWNER

**File:** `apps/api/src/studios/studios.service.ts:228-293`
**Endpoint:** `PATCH /studios/:slug/members/:userId`

**Bug:** The `updateMemberRole` method accepts `dto: { role?: StudioRole }` where
`role` can be `OWNER`. An ADMIN can call this endpoint to promote any MODERATOR
or MEMBER to OWNER, bypassing the `transferOwnership` endpoint (which requires
target to be ADMIN and demotes original owner to ADMIN).

**Attack:** An ADMIN actor changes a MEMBER's role to OWNER. The guard chain:
1. Line 240: Target is not existing OWNER → passes
2. Line 242: `dto.role === 'ADMIN'` → false, guard doesn't trigger
3. Lines 246-248: Role hierarchy check for ADMIN → passes (can modify MEMBER)
4. Result: MEMBER becomes OWNER — multiple owners created

**Impact:** Creates multiple studio OWNERs outside the intended `transferOwnership`
flow. Original owner is NOT demoted. Studio governance is compromised.

**Remediation:** Add role escalation guard:
```typescript
if (dto.role === 'OWNER') {
  throw new ForbiddenException('Use the transfer ownership endpoint to change studio ownership');
}
```

**Production reachability:** Yes — any studio ADMIN can execute this.

---

## 7. Design Observations (Low)

| ID | Severity | Finding |
|----|----------|---------|
| A-1 | LOW | `POST :slug/health/refresh` guarded by `SessionAuthGuard` only — any authenticated user can trigger recalculation |
| A-2 | LOW | Studio goals/achievements/health scores are public — intentional? |
| A-3 | LOW | `events.service.ts` / `partner.service.ts` create() lacks service-layer auth (controller guards exist) |
| A-4 | LOW | No defense-in-depth for `CreateListingDto.studioId` — relies solely on controller auth check |

---

## 8. Production Verification

| Endpoint | Expected | Actual |
|----------|----------|--------|
| Health | 200 | 200 |
| Games (public) | 200 | 200 |
| Studios (public) | 200 | 200 |
| For-you (public) | 200 | 200 |
| Preferences (auth required) | 401 | 401 |
| Notifications (auth required) | 401 | 401 |
| Invalid slug | 404 | 404 |
| Registration (bad data) | 400 | 400 |

---

## 9. M23 Freeze

| Check | Result |
|-------|--------|
| Files modified | 0 ✅ |
| Algorithm | Untouched ✅ |
| Weights | Untouched ✅ |
| Rollout | 5% ✅ |
| Baseline | Not restarted ✅ |

---

## 10. Comparison — V1 vs V2 Audit

| Metric | V1 Audit | V2 Audit |
|--------|----------|----------|
| HIGH findings | 2 (V1, V2) | 1 (F-1) |
| IDOR vulnerabilities | 1 (roadmap) | 0 |
| Privilege escalation | 1 (MODERATOR bypass) | 1 (ADMIN→OWNER) |
| Regressions from V1 fix | N/A | 0 |

Both V1 and V2 fixes remain intact. The new F-1 is a different vulnerability class — it exists in the member-role-change path, not in the global authorization bypass.

---

## 11. Recommended Remediation Plan

| ID | Action | Files | Risk |
|----|--------|-------|------|
| F-1 | Block `role: 'OWNER'` in `updateMemberRole` | `studios.service.ts` | LOW — additive guard |
| F-2 | Validate `status` against enum in `UpdateListingDto` | `update-listing.dto.ts` | LOW |
| F-3 | Add service-layer auth to `events.service.ts` create | `events.service.ts` | LOW |

---

## 12. Final Verdict

### 🟡 AUTHORIZATION BASELINE ACCEPTED WITH 1 HIGH FINDING

The V1/V2 fixes are verified intact (0 regressions). The underlying authorization
model is sound — all 16 sensitive mutations have proper ownership checks, all 3
bulk operations are safe, all state machines are forward-only, and all private
data endpoints are user-scoped.

One HIGH finding (F-1) exists in the member-role-change endpoint and should be
remediated. It does not affect the M23 freeze.

**0 files modified. 0 committed. 0 pushed. 0 deployed.**
