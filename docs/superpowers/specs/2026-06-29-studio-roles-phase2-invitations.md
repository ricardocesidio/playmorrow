# Studio Roles & Permissions — Phase 2: Invitation System

## Overview

Backend invitation system for the Studio Roles feature. Supports two invite methods (by email and by existing user), secure token-based acceptance, role limits, and notifications.

## Endpoints

### Studio Invitation Management (Owner/Admin only)

**POST `/studios/:slug/invitations`** — Create invitation

```json
// Method A (by email)
{ "email": "user@example.com", "role": "ADMIN", "message": "Join us!" }

// Method B (by existing user)
{ "userId": "user-abc-123", "role": "MODERATOR" }
```

Response: `{ id, studioId, role, email?, userId?, token (raw), expiresAt, status }`

Validates:
- Current user has OWNER or ADMIN role in the studio
- Target role is allowed (ADMIN requires OWNER inviter, MODERATOR requires OWNER/ADMIN)
- Role limits not exceeded (max 2 Admins, max 5 Moderators including existing + pending invites)
- Target user not already a member (for Method B)
- No duplicate pending invite to same email/user

**GET `/studios/:slug/invitations`** — List invitations

Query params: `?status=PENDING`

Returns paginated list of StudioInvitation records (token hash NOT exposed).

**DELETE `/studios/:slug/invitations/:id`** — Cancel invitation

Only pending invitations can be cancelled. Sets status to CANCELLED.

### Invitation Acceptance (Public/Authenticated)

**GET `/invitations/:token`** — Lookup invitation by raw token

Returns invitation details (studio name, role, inviter name) for display on the accept page. Token is NOT exposed in response — only used for lookup.

**POST `/invitations/:token/accept`** — Accept invitation

Validates:
- Token exists and status is PENDING
- Token not expired (createdAt + 7 days)
- Current user matches invited user (Method B) OR invited email matches current user's email (Method A)
- Role limits not exceeded

On success:
- Creates StudioMember entry
- Sets status to ACCEPTED
- Logs to AuditLog
- Sends notification to studio admins

**POST `/invitations/:token/decline`** — Decline invitation

Sets status to DECLINED.

### User Invitations

**GET `/me/invitations`** — List my pending invitations

Returns invitations where `userId` matches current user OR `email` matches current user's email.

## Token Security

- Token = `crypto.randomUUID()` (UUID v4)
- Stored as SHA-256 hash: `createHash('sha256').update(rawToken).digest('hex')`
- Raw token returned ONLY in the create response
- Lookup: hash the provided token, search by hash

## Role Limits

Enforced at invitation creation AND acceptance:
- OWNER: 1 (always the creator, never invited)
- ADMIN: max 2
- MODERATOR: max 5

When creating/finding existing members, count CONFIRMED members + PENDING invitations for that role.

## Files Created

- `apps/api/src/invitations/invitations.module.ts`
- `apps/api/src/invitations/invitations.controller.ts`
- `apps/api/src/invitations/invitations.service.ts`
- `apps/api/src/invitations/dto/create-invitation.dto.ts`

## Files Modified

- `apps/api/src/app.module.ts` — register InvitationsModule
- `apps/api/src/notifications/notifications.service.ts` — add invitation notification helpers (optional)
