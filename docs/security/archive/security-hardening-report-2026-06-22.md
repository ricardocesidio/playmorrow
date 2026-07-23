# PlayMorrow Security Hardening Report

Generated: 2026-06-22
Audit scope: All 18 backend controllers (68 endpoints)

## Routes audited

All 68 endpoints across 18 controllers were audited for:
- Authentication enforcement (guards)
- Authorization (ownership checks)
- Sensitive data exposure (response serialization)
- Rate limiting
- Logging and error handling

## Issues found

### Issue 1 — Notifications controller uses JwtAuthGuard instead of SessionAuthGuard

**Severity:** 🔴 CRITICAL
**Location:** `apps/api/src/notifications/notifications.controller.ts`
**Description:** The notifications controller is the ONLY controller still using `JwtAuthGuard` for its 5 protected endpoints. Since the frontend uses session cookies (not Bearer tokens), all notification endpoints return 401.
**Fix applied:** ✅ Replaced `JwtAuthGuard` → `SessionAuthGuard` in all 5 notification endpoints.

### Issue 2 — Auth inconsistency: no JWT → session migration completed

**Severity:** 🟠 MEDIUM
**Location:** Multiple controllers
**Description:** 6 endpoints across 2 controllers still use `JwtAuthGuard`. The notifications controller was fixed (Issue 1). The auth controller's legacy JWT endpoints (`/auth/me`, `/auth/admin-only`) intentionally remain for backward compatibility.
**Fix:** Notifications controller fixed. Legacy JWT endpoints in auth controller are documented and intentionally kept.

### Issue 3 — No rate limiting on most endpoints

**Severity:** 🟡 LOW
**Location:** All controllers
**Description:** Only 12 of 68 endpoints have `@Throttle` decorators. The global rate limit (60 req/min/IP) applies to all other endpoints, which is generous for production.
**Fix:** Not applied — global throttle provides baseline protection. Per-endpoint throttling is a future enhancement.

### Issue 4 — No CSRF token validation

**Severity:** 🟡 LOW
**Location:** Global
**Description:** Session-based auth relies on `SameSite=Lax` alone for CSRF protection. No CSRF token validation is implemented.
**Fix:** Not applied — `SameSite=Lax` + `httpOnly` + `Secure` provide adequate CSRF protection for this application type. If high-value operations (account deletion, email change) are added, CSRF tokens should be implemented.

## Issues fixed

| Issue | File | Fix |
|---|---|---|
| Notifications JwtAuthGuard | `notifications/notifications.controller.ts` | Replaced `JwtAuthGuard` with `SessionAuthGuard` |

## Tests needed

### Authentication tests (direct API, no frontend)

| Test | Expected | Status |
|---|---|---|
| POST /studios without session cookie | 401 | Not tested |
| POST /games/:slug/follow without session cookie | 401 | Not tested |
| PATCH /devlogs/:id without session cookie | 401 | Not tested |
| All write endpoints without auth | 401 | Not tested |

### Authorization tests (negative)

| Test | Expected | Status |
|---|---|---|
| User A PATCH /studios/:slug (User B's studio) | 403 | Not tested |
| User A DELETE /games/:slug (User B's game) | 403 | Not tested |
| User A PATCH /devlogs/:id (User B's devlog) | 403 | Not tested |
| Non-admin GET /admin/reports | 403 | Not tested |

### Sensitive data tests

| Test | Expected | Status |
|---|---|---|
| GET /auth/session/me does not return passwordHash | ✓ | Verified by reading service code |
| GET /studios/:slug does not return passwordHash | ✓ | Verified by reading service code |
| GET /games/:slug does not return tokens | ✓ | Verified |

## Intentionally public routes

The following routes are intentionally public (no auth required):

- `GET /health` — health check for load balancers
- `GET /` — API root info
- `GET /users/:username` — public user profiles
- `GET /studios` — studio directory
- `GET /studios/:slug` — studio detail
- `GET /studios/:slug/members` — studio team listing
- `GET /studios/:studioSlug/games` — studio's games
- `GET /games` — game catalogue
- `GET /games/:slug` — game detail
- `GET /devlogs` — published devlogs
- `GET /feed/public` — public feed
- `GET /search` — global search
- `GET /games/:gameSlug/roadmap` — game roadmap
- `GET /roadmap-items/:id` — single roadmap item
- `GET /games/:gameSlug/press-kit` — public press kit
- `GET /studios/:slug/follow-status` (OptionalSessionGuard — works without auth)
- `GET /games/:slug/follow-status` (OptionalSessionGuard — works without auth)
- `GET /devlogs/:id` (OptionalSessionGuard — works without auth for published devlogs)
- `GET /devlogs/:devlogId/comments` (OptionalSessionGuard — works without auth)
- `GET /comments/:commentId/reactions` (OptionalSessionGuard — works without auth)
- `GET /devlogs/:devlogId/reactions` (OptionalSessionGuard — works without auth)
- All `POST /auth/*` routes (registration, login, password reset, verification)

## Optional auth routes

Routes that work for both authenticated and anonymous users:

- `GET /studios/:slug/follow-status` — includes viewer's follow state if authenticated
- `GET /games/:slug/follow-status` — includes viewer's follow state if authenticated
- `GET /devlogs/:id` — includes drafts if authenticated author
- `GET /devlogs/:devlogId/comments` — may include viewer-specific state
- `GET /comments/:commentId/reactions` — includes viewer's reactions if authenticated
- `GET /devlogs/:devlogId/reactions` — includes viewer's reactions if authenticated
- `GET /devlogs/:devlogId/comments/reactions` — batch reaction state
- `GET /games/:gameSlug/devlogs` — includes drafts if authenticated member

## Remaining risks

| Risk | Severity | Notes |
|---|---|---|
| No negative authorization tests | 🟠 MEDIUM | Tests verify happy path but not that User A cannot access User B's data |
| No authentication failure tests | 🟠 MEDIUM | No tests confirm 401 is returned for unauthenticated write requests |
| Legacy JWT auth still active | 🟡 LOW | 2 endpoints in auth controller still use JWT — maintained for backward compat |
| No CSRF tokens | 🟡 LOW | SameSite=Lax mitigates most CSRF in practice |
| Sparse rate limiting | 🟡 LOW | Global 60/min applies but per-endpoint limits are minimal |
| No brute-force protection on refresh | 🟡 LOW | `/auth/refresh` has no specific throttle |

## Assumptions

1. `SessionAuthGuard` correctly validates session cookies and sets `request.user`
2. `assertStudioWriteAccess()` correctly blocks non-members
3. The Prisma `select` statements in service methods do not include sensitive fields
4. The frontend sends `credentials: 'include'` with all requests (verified in `client.ts`)
5. Notifications endpoints now work with session cookies (Issue 1 fix)

## Recommended next security tasks

1. Add authentication-failure E2E tests (call write endpoints without token, expect 401)
2. Add authorization-negative E2E tests (User A tries to modify User B's data, expect 403)
3. Add rate limiting to high-risk endpoints (refresh, notification read, report create)
4. Implement CSRF token validation for high-value operations
5. Add per-endpoint throttling for all write endpoints
6. Security-focused penetration test before production launch
