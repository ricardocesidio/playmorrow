# Studio Roles Phase 1 — Database & Models Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the database foundation for the enterprise studio roles system — invitation tracking, audit logging, game audit fields, moderator role, and notification types.

**Architecture:** Prisma schema changes for 2 new models (StudioInvitation, AuditLog), 3 modified models (Game, StudioMember, StudioRole enum), and new NotificationType enum values. Application layer: replace `assertStudioWriteAccess` with `assertStudioAccess(allowedRoles)`, create AuditLogService, set game audit fields.

**Tech Stack:** Prisma, NestJS 11, PostgreSQL (Neon serverless)

## Global Constraints

- All `@id` fields use `@default(cuid())`
- All new models use `@@map("snake_case")` naming
- `StudioInvitation.token` is hashed (SHA-256) before storage — never store raw tokens
- `assertStudioAccess(allowedRoles)` replaces `assertStudioWriteAccess()` — all 23 call sites must be updated
- `AuditLog.action` is a free string, not an enum
- `Game.createdBy`/`updatedBy`/`publishedBy` reference `User.id`

---

### Task 1: Prisma Schema Changes

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Interfaces:**
- Consumes: existing Studio, Game, User, StudioMember, NotificationType models
- Produces: updated Prisma schema with all Phase 1 changes

- [ ] **Step 1: Add MODERATOR to StudioRole enum**

```prisma
enum StudioRole {
  OWNER
  ADMIN
  MODERATOR
  MEMBER
}
```

- [ ] **Step 2: Add StudioInvitationStatus enum**

```prisma
enum StudioInvitationStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
  CANCELLED
}
```

- [ ] **Step 3: Add StudioInvitation model** (insert after StudioMember model)

```prisma
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

- [ ] **Step 4: Add AuditLog model** (insert after StudioInvitation)

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

- [ ] **Step 5: Add audit fields to Game model**

Find the Game model and add after existing fields (before relations):

```prisma
  createdBy   String?
  updatedBy   String?
  publishedBy String?
  publishedAt DateTime?
```

No relation decorators — these are free-string references to User.id (avoids circular dependency issues).

- [ ] **Step 6: Add timestamps to StudioMember model**

Find existing StudioMember model and modify:

```prisma
model StudioMember {
  id        String     @id @default(cuid())
  studioId  String
  userId    String
  role      StudioRole @default(MEMBER)
  title     String?
  joinedAt     DateTime @default(now())
  lastActiveAt DateTime?
  createdAt DateTime @default(now())    // rename from createdAt to joinedAt, or keep both

  // relations...
  @@map("studio_members")
}
```

Actually, keep `createdAt` as-is and ADD `joinedAt @default(now())` and `lastActiveAt DateTime?`. Don't rename existing fields.

```prisma
  joinedAt     DateTime @default(now())
  lastActiveAt DateTime?
```

- [ ] **Step 7: Add new NotificationType values**

Find the `NotificationType` enum and add:

```prisma
enum NotificationType {
  NEW_FOLLOWER
  NEW_COMMENT
  NEW_REPLY
  NEW_REACTION
  STUDIO_INVITATION
  INVITATION_ACCEPTED
  MEMBER_JOINED
  MEMBER_LEFT
  ROLE_CHANGED
  MEMBER_REMOVED
  JOIN_REQUEST
}
```

- [ ] **Step 8: Commit schema changes**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat: add StudioInvitation, AuditLog models, MODERATOR role, Game audit fields"
```

---

### Task 2: Prisma Migration

**Files:**
- Run: migration command
- Modify: (none — migration auto-generated)

- [ ] **Step 1: Run migration**

```bash
pnpm --filter @playmorrow/database prisma:migrate --name add_studio_roles_phase1
```

Verify the migration file was created in `packages/database/prisma/migrations/`.

- [ ] **Step 2: Regenerate Prisma client**

```bash
pnpm --filter @playmorrow/database prisma:generate
```

- [ ] **Step 3: Build API to verify**

```bash
pnpm --filter @playmorrow/api build 2>&1 | tail -5
```

Expected: `$ nest build` with no errors. If there are type errors, fix them (likely from StudioRole enum changes or new required fields).

- [ ] **Step 4: Commit**

```bash
git add packages/database/
git commit -m "feat: run migration for studio roles phase 1"
```

---

### Task 3: Update Permission Function and All Call Sites

**Files:**
- Modify: `apps/api/src/common/studio-permissions.ts`
- Modify: `apps/api/src/studios/studios.service.ts`
- Modify: `apps/api/src/games/games.service.ts`
- Modify: `apps/api/src/devlogs/devlogs.service.ts`
- Modify: `apps/api/src/roadmap-items/roadmap-items.service.ts`
- Modify: `apps/api/src/press-kits/press-kits.service.ts`

**Note:** The existing file is at `apps/api/src/common/studio-permissions.ts` (check exact path — it was imported from various services).

- [ ] **Step 1: Check the existing function location**

```bash
grep -rn "assertStudioWriteAccess" apps/api/src/ --include="*.ts" | head -5
```

This shows where the function is defined and all import paths.

- [ ] **Step 2: Update the permission function**

Replace `assertStudioWriteAccess` with `assertStudioAccess` that takes `allowedRoles`:

```typescript
import { ForbiddenException } from '@nestjs/common';
import { StudioRole } from '@playmorrow/database';

export function assertStudioAccess(
  user: { id: string; role?: string },
  members: { userId: string; role: string }[],
  allowedRoles: StudioRole[],
): void {
  if (user.role === 'ADMIN') return;

  const membership = members.find((m) => m.userId === user.id);
  if (!membership) {
    throw new ForbiddenException('You are not a member of this studio');
  }
  if (!allowedRoles.includes(membership.role as StudioRole)) {
    throw new ForbiddenException('Insufficient permissions');
  }
}
```

- [ ] **Step 3: Update all call sites**

For each service file that imports `assertStudioWriteAccess`, update to `assertStudioAccess` with appropriate `allowedRoles`:

**StudiosService** (update, delete, etc.):
```typescript
import { assertStudioAccess } from '../common/studio-permissions';

// For studio update/delete — only OWNER/ADMIN
assertStudioAccess(user, studio.members, [StudioRole.OWNER, StudioRole.ADMIN]);
```

**GamesService** (create, update, delete):
```typescript
// For game create/update — OWNER/ADMIN/MODERATOR/MEMBER
assertStudioAccess(user, members, [StudioRole.OWNER, StudioRole.ADMIN, StudioRole.MODERATOR, StudioRole.MEMBER]);
// For game delete — OWNER/ADMIN only
assertStudioAccess(user, members, [StudioRole.OWNER, StudioRole.ADMIN]);
```

**DevlogsService** (create, update, delete):
```typescript
// For devlog operations — OWNER/ADMIN/MODERATOR/MEMBER
assertStudioAccess(user, members, [StudioRole.OWNER, StudioRole.ADMIN, StudioRole.MODERATOR, StudioRole.MEMBER]);
```

**RoadmapItemsService** (create, update, delete, reorder):
```typescript
// For all roadmap operations — OWNER/ADMIN/MODERATOR/MEMBER
assertStudioAccess(user, members, [StudioRole.OWNER, StudioRole.ADMIN, StudioRole.MODERATOR, StudioRole.MEMBER]);
```

**PressKitsService** (upsert):
```typescript
// For press kit — OWNER/ADMIN/MODERATOR/MEMBER
assertStudioAccess(user, members, [StudioRole.OWNER, StudioRole.ADMIN, StudioRole.MODERATOR, StudioRole.MEMBER]);
```

- [ ] **Step 4: Build to verify**

```bash
pnpm --filter @playmorrow/api build 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/
git commit -m "feat: replace assertStudioWriteAccess with granular assertStudioAccess(allowedRoles)"
```

---

### Task 4: Create AuditLogService

**Files:**
- Create: `apps/api/src/audit-log/audit-log.service.ts`
- Create: `apps/api/src/audit-log/audit-log.module.ts`
- Modify: `apps/api/src/app.module.ts` — register AuditLogModule

- [ ] **Step 1: Create AuditLogService**

```typescript
// apps/api/src/audit-log/audit-log.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    studioId: string;
    actorId: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        studioId: params.studioId,
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata ?? undefined,
        ipAddress: params.ipAddress,
      },
    });
  }
}
```

- [ ] **Step 2: Create AuditLogModule**

```typescript
// apps/api/src/audit-log/audit-log.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogService } from './audit-log.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
```

- [ ] **Step 3: Register in AppModule**

Open `apps/api/src/app.module.ts` and add `AuditLogModule` to the imports array.

- [ ] **Step 4: Build to verify**

```bash
pnpm --filter @playmorrow/api build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/audit-log/ apps/api/src/app.module.ts
git commit -m "feat: create AuditLogService with log() method and Global module"
```

---

### Task 5: Update Game Service to Set Audit Fields

**Files:**
- Modify: `apps/api/src/games/games.service.ts`

- [ ] **Step 1: Add createdBy on game create**

In the `create` method, after constructing the game data, add:

```typescript
createdBy: userId,
```

- [ ] **Step 2: Add updatedBy on game update**

In the `update` method, in the update data:

```typescript
updatedBy: userId,
```

- [ ] **Step 3: Add publishedBy/publishedAt on status change to RELEASED**

In the `update` method, when `dto.status` changes to `'RELEASED'`:

```typescript
if (dto.status === 'RELEASED') {
  updateData.publishedBy = userId;
  updateData.publishedAt = new Date();
}
```

- [ ] **Step 4: Build to verify**

```bash
pnpm --filter @playmorrow/api build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/games/games.service.ts
git commit -m "feat: set createdBy/updatedBy/publishedBy on games"
```

---

### Task 6: Full Build Verification

- [ ] **Step 1: Build API**

```bash
pnpm --filter @playmorrow/api build 2>&1 | tail -10
```

Expected: `$ nest build` with zero errors.

- [ ] **Step 2: Build frontend**

```bash
pnpm --filter @playmorrow/web build 2>&1 | tail -5
```

Expected: zero errors.

- [ ] **Step 3: Push**

```bash
git push
```
