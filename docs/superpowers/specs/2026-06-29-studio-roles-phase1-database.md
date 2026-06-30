# Studio Roles & Permissions — Phase 1: Database & Models

## Overview

Phase 1 establishes the database foundation for the enterprise studio roles system. Adds invitation tracking, audit logging, game audit fields, moderator role, notification types, and member activity timestamps.

## Schema Changes

### StudioRole Enum — Add MODERATOR

```prisma
enum StudioRole {
  OWNER
  ADMIN
  MODERATOR
  MEMBER
}
```

`MEMBER` is kept for backward compatibility with existing database records. New invitations always use `MODERATOR`. The application layer treats `MEMBER` and `MODERATOR` as equivalent for permission checks (both are non-admin roles).

### StudioInvitation Model

```prisma
enum StudioInvitationStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
  CANCELLED
}

model StudioInvitation {
  id             String                   @id @default(cuid())
  studioId       String
  invitedById    String
  email          String?
  userId         String?
  role           StudioRole
  token          String                   @unique
  status         StudioInvitationStatus   @default(PENDING)
  expiresAt      DateTime
  acceptedAt     DateTime?
  rejectedAt     DateTime?
  ipAddress      String?
  userAgent      String?
  createdAt      DateTime                 @default(now())

  studio    Studio @relation(fields: [studioId], references: [id], onDelete: Cascade)
  invitedBy User   @relation(fields: [invitedById], references: [id])
  user      User?  @relation(fields: [userId], references: [id])

  @@index([studioId, status])
  @@index([email])
  @@index([userId])
  @@map("studio_invitations")
}
```

Design decisions:
- `token` is the hashed UUID v4 — unique constraint for lookup
- `email` null for Method B (invite existing user), set for Method A (invite by email)
- `userId` null until the invited user accepts (for email invites)
- `role` can be ADMIN or MODERATOR (never OWNER — ownership is transferred, not invited)
- Default 7-day expiration enforced at the application layer
- `ipAddress` and `userAgent` captured at creation for audit trail

### AuditLog Model

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  studioId   String
  actorId    String
  action     String
  targetType String
  targetId   String?
  metadata   Json?
  createdAt  DateTime @default(now())

  studio Studio @relation(fields: [studioId], references: [id], onDelete: Cascade)
  actor  User   @relation(fields: [actorId], references: [id])

  @@index([studioId, createdAt])
  @@map("audit_logs")
}
```

Design decisions:
- `action` is a free string (not an enum) so new actions don't require migrations
- `metadata` is flexible JSON for action-specific data (e.g., `{ oldRole, newRole }` for role changes)
- Indexed by `(studioId, createdAt)` for efficient feed queries

### Game — Add Audit Fields

```prisma
model Game {
  // ... existing fields ...
  createdBy   String?
  updatedBy   String?
  publishedBy String?
  publishedAt DateTime?
}
```

These are set by the service layer during create/update/publish operations.

### StudioMember — Add Timestamps

```prisma
model StudioMember {
  // ... existing fields ...
  joinedAt     DateTime @default(now())
  lastActiveAt DateTime?
}
```

`lastActiveAt` is updated when the member performs any studio action.

### NotificationType — Add Team Events

```prisma
enum NotificationType {
  // ... existing types ...
  STUDIO_INVITATION
  INVITATION_ACCEPTED
  MEMBER_JOINED
  MEMBER_LEFT
  ROLE_CHANGED
  MEMBER_REMOVED
  JOIN_REQUEST
}
```

These types are used when creating notifications for invitation and team events.

## Application Layer Updates

### assertStudioWriteAccess

Rename the existing file to `studio-permissions.ts` and update to:

```typescript
export function assertStudioAccess(
  user: { id: string; role?: string },
  members: { userId: string; role: string }[],
  allowedRoles: StudioRole[],
): void {
  if (user.role === 'ADMIN') return; // Global admin bypass

  const membership = members.find((m) => m.userId === user.id);
  if (!membership) {
    throw new ForbiddenException('You are not a member of this studio');
  }
  if (!allowedRoles.includes(membership.role as StudioRole)) {
    throw new ForbiddenException('Insufficient permissions');
  }
}
```

This is a breaking change — all existing callers must be updated to pass the appropriate `allowedRoles` array.

### StudioXpEvent

No changes needed — already exists from the level system.

## Migration Plan

1. Edit `schema.prisma` with all changes
2. Run `pnpm prisma:migrate --name add_studio_roles_phase1`
3. Regenerate Prisma client
4. Update `assertStudioWriteAccess` → `assertStudioAccess` with allowedRoles
5. Update all 23 call sites across 7 service files
6. Add AuditLogService with a simple `log()` method
7. Build and verify
