# Studio Roles & Permissions — Phase 3: Member Management API

## Overview

Member management endpoints for the Studio Roles system: update roles/titles, remove members, leave studio, transfer ownership, plus a new `StudioRolesGuard` decorator for cleaner permission checks.

## Endpoints

### PATCH `/studios/:slug/members/:userId`

Update member role or title.

**Body:** `{ role?: StudioRole, title?: string }`

**Rules:**
- Owner/Admin only (via StudioRolesGuard)
- Only Owner can set role to ADMIN
- Admin can only modify MODERATOR/MEMBER roles
- Cannot modify the Owner's membership

### DELETE `/studios/:slug/members/:userId`

Remove a member from the studio.

**Rules:**
- Owner/Admin only
- Owner can remove anyone
- Admin can only remove MODERATOR/MEMBER
- Cannot remove the Owner

### POST `/studios/:slug/members/leave`

Current user leaves the studio.

**Rules:**
- Owner cannot leave (must transfer first)
- Other roles can leave freely
- If user has no remaining studio memberships, redirect/notify (handled by frontend)

### POST `/studios/:slug/transfer`

Transfer studio ownership to another member.

**Body:** `{ targetUserId: string }`

**Rules:**
- Owner only
- Target must be an existing ADMIN member
- Previous Owner becomes an ADMIN
- Logged as `OWNERSHIP_TRANSFERRED`

## StudioRolesGuard

A decorator-based guard that checks studio-scoped roles at the controller level.

```typescript
// Decorator
export const StudioRoles = (...roles: StudioRole[]) => SetMetadata('studioRoles', roles);

// Guard
export class StudioRolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): Promise<boolean> {
    // Gets studio members from request (prisma query in controller or middleware)
    // Gets required roles from metadata
    // Checks current user's membership against required roles
  }
}
```

## Audit Log Entries

- `MEMBER_ROLE_CHANGED` — metadata: `{ oldRole, newRole }`
- `MEMBER_TITLE_CHANGED` — metadata: `{ oldTitle, newTitle }`
- `MEMBER_REMOVED` — metadata: `{ targetUserId, role }`
- `MEMBER_LEFT` — metadata: `{ userId, role }`
- `OWNERSHIP_TRANSFERRED` — metadata: `{ fromUserId, toUserId }`

## Files

- Create: `apps/api/src/studios/guards/studio-roles.decorator.ts`
- Create: `apps/api/src/studios/guards/studio-roles.guard.ts`
- Modify: `apps/api/src/studios/studios.controller.ts` — add new endpoints
- Modify: `apps/api/src/studios/studios.service.ts` — add member management methods
