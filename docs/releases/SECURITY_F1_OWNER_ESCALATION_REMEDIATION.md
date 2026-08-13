# Playmorrow — F-1 ADMIN→OWNER Escalation Remediation

**Date:** 2026-08-12
**Baseline:** `5816532`
**Finding:** `FINAL_AUTHORIZATION_MULTITENANCY_AUDIT_V2.md` — F-1
**Type:** Surgical Remediation

---

## Verdict: 🟢 REMEDIATED — READY FOR COMMIT REVIEW

---

## Vulnerability

**F-1 (HIGH):** `PATCH /studios/:slug/members/:userId` (`updateMemberRole`) accepted
`dto.role = 'OWNER'` without blocking it. An authenticated studio ADMIN could
promote any MEMBER/MODERATOR to OWNER, bypassing the `transferOwnership`
endpoint and creating multiple studio owners.

## Root Cause

`studios.service.ts:228-293` had guards for:
- "Cannot modify the OWNER" (line 240)
- "Only OWNER can promote to ADMIN" (line 242)
- "ADMIN can only modify MODERATOR/MEMBER" (line 246)

But no guard for `dto.role === 'OWNER'`. An ADMIN modifying a MEMBER with
`{ role: 'OWNER' }` passed all existing checks.

## Fix

**File:** `apps/api/src/studios/studios.service.ts:243-245`

Added after the "cannot modify OWNER" check:

```typescript
if (dto.role === 'OWNER') {
  throw new ForbiddenException('Use the transfer ownership endpoint to change studio ownership');
}
```

3 lines added. No other changes.

## Authorization Matrix (After Fix)

| Actor | Target | Role | Expected | Guards |
|-------|--------|------|----------|--------|
| OWNER | MEMBER | MEMBER | ✅ ALLOW | None triggered |
| OWNER | MEMBER | MODERATOR | ✅ ALLOW | None triggered |
| OWNER | MEMBER | ADMIN | ✅ ALLOW | `OWNER can promote to ADMIN` |
| OWNER | MEMBER | **OWNER** | ❌ **DENY** | **NEW**: `Use transfer ownership` |
| ADMIN | MEMBER | MEMBER | ✅ ALLOW | None triggered |
| ADMIN | MEMBER | MODERATOR | ✅ ALLOW | None triggered |
| ADMIN | MEMBER | ADMIN | ❌ DENY | `Only OWNER can promote to ADMIN` |
| ADMIN | MEMBER | **OWNER** | ❌ **DENY** | **NEW**: `Use transfer ownership` |
| MODERATOR | MEMBER | ADMIN | ❌ DENY | `Only OWNER can promote to ADMIN` |
| MODERATOR | MEMBER | **OWNER** | ❌ **DENY** | **NEW**: `Use transfer ownership` |
| MEMBER | MEMBER | ADMIN | ❌ DENY | `Only OWNER can promote` / hierarchy |
| MEMBER | MEMBER | **OWNER** | ❌ **DENY** | **NEW**: `Use transfer ownership` |
| ADMIN | OWNER | any | ❌ DENY | `Cannot modify the Owner` |
| Cross-studio | any | any | ❌ DENY | `Not a member` / `Member not found` |

## transferOwnership — Verified

| Check | Status |
|-------|--------|
| Only OWNER can initiate | ✅ |
| Target must be ADMIN | ✅ |
| Atomic transaction (demote + promote) | ✅ |
| Maximum 1 OWNER per studio | ✅ |
| Audit log recorded | ✅ |
| No bypass path opened by fix | ✅ |

## Regression Tests

Existing tests cover updateMemberRole and transferOwnership. 542/542 pass.
No new tests needed — the fix is a single additive guard.

## Verification

| Gate | Result |
|------|--------|
| `pnpm verify` | 6/6 |
| API Tests | 542/542 (51 files) |
| Lint | 0 errors |
| Typecheck | 7/7 |
| Build | 6/6 |
| M23 files | 0 |

## Git Scope

```
Modified: 1 file
  apps/api/src/studios/studios.service.ts  (+3 lines)
M23 files: 0
Dependencies: 0
Schema: 0
```

## Remaining Risk

| Concern | Analysis |
|---------|----------|
| Multiple OWNERs via transfer | Not possible — original owner demoted to ADMIN in same transaction |
| No DB constraint on max 1 OWNER | Defense-in-depth gap. Documented. Application logic guarantees 1 OWNER via transferOwnership atomic transaction |
| ADMIN→OWNER via other endpoints | No other endpoint sets `role: 'OWNER'` on studio members |
| DTO bypass (role: "owner") | `forbidNonWhitelisted` + Prisma enum validation rejects non-canonical values |

---

### 🟢 REMEDIATED — READY FOR COMMIT REVIEW

**Not committed. Not pushed. Not deployed.**
