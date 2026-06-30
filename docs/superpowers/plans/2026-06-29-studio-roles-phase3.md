# Studio Roles Phase 3 — Member Management API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Member management API — update roles/titles, remove members, leave studio, transfer ownership, plus a reusable StudioRolesGuard.

**Architecture:** New decorator+guard for controller-level permission checks. New methods in StudiosService. New endpoints in StudiosController. AuditLog entries for all actions.

**Tech Stack:** NestJS 11, Prisma

## Global Constraints

- `@StudioRoles()` decorator uses `SetMetadata('studioRoles', roles)` 
- `StudioRolesGuard` reads metadata and checks against the request's resolved studio members
- All new endpoints require `SessionAuthGuard`
- Owner cannot be modified, removed, or leave without transfer
- AuditLog entries for every mutation

---

### Task 1: Create StudioRoles Decorator and Guard

**Files:**
- Create: `apps/api/src/studios/guards/studio-roles.decorator.ts`
- Create: `apps/api/src/studios/guards/studio-roles.guard.ts`

- [ ] **Step 1: Create the decorator**

Create directory `apps/api/src/studios/guards/` if it doesn't exist.

```typescript
// apps/api/src/studios/guards/studio-roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { StudioRole } from '@playmorrow/database';

export const STUDIO_ROLES_KEY = 'studioRoles';
export const StudioRoles = (...roles: StudioRole[]) => SetMetadata(STUDIO_ROLES_KEY, roles);
```

- [ ] **Step 2: Create the guard**

```typescript
// apps/api/src/studios/guards/studio-roles.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { STUDIO_ROLES_KEY } from './studio-roles.decorator';
import { StudioRole } from '@playmorrow/database';

@Injectable()
export class StudioRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<StudioRole[]>(STUDIO_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    // Global admin bypass
    if (user.role === 'ADMIN') return true;

    const slug = request.params.slug;
    if (!slug) throw new ForbiddenException('Studio slug required');

    const studio = await this.prisma.studio.findUnique({
      where: { slug },
      include: { members: true },
    });
    if (!studio) throw new ForbiddenException('Studio not found');

    const membership = studio.members.find(m => m.userId === user.id);
    if (!membership) throw new ForbiddenException('You are not a member of this studio');

    if (!requiredRoles.includes(membership.role as StudioRole)) {
      throw new ForbiddenException('Insufficient permissions for this action');
    }

    // Attach studio + membership to request for downstream use
    request.studio = studio;
    request.membership = membership;
    return true;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/studios/guards/
git commit -m "feat: create StudioRoles decorator and guard"
```

---

### Task 2: Add Member Management Methods to StudiosService

**Files:**
- Modify: `apps/api/src/studios/studios.service.ts`

- [ ] **Step 1: Add methods to studios.service.ts**

Add these methods after the existing `remove` method:

```typescript
async updateMemberRole(actorId: string, slug: string, targetUserId: string, dto: { role?: StudioRole; title?: string }) {
  const studio = await this.prisma.studio.findUnique({
    where: { slug: slug.toLowerCase() },
    include: { members: true },
  });
  if (!studio) throw new NotFoundException('Studio not found');

  const actorMembership = studio.members.find(m => m.userId === actorId);
  if (!actorMembership) throw new ForbiddenException('Not a member');

  const targetMember = studio.members.find(m => m.userId === targetUserId);
  if (!targetMember) throw new NotFoundException('Member not found');
  if (targetMember.role === 'OWNER') throw new ForbiddenException('Cannot modify the Owner');

  // Only Owner can promote to ADMIN
  if (dto.role === 'ADMIN' && actorMembership.role !== 'OWNER') {
    throw new ForbiddenException('Only the Owner can promote to Admin');
  }

  // Admin can only modify MODERATOR/MEMBER
  if (actorMembership.role === 'ADMIN' && ![StudioRole.MODERATOR, StudioRole.MEMBER].includes(targetMember.role as StudioRole)) {
    throw new ForbiddenException('Admins can only modify Moderators');
  }

  const data: any = {};
  if (dto.role) data.role = dto.role;
  if (dto.title !== undefined) data.title = dto.title;

  const updated = await this.prisma.studioMember.update({
    where: { id: targetMember.id },
    data,
    include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
  });

  if (dto.role) {
    await this.auditLog.log({
      studioId: studio.id,
      actorId,
      action: 'MEMBER_ROLE_CHANGED',
      targetType: 'USER',
      targetId: targetUserId,
      metadata: { oldRole: targetMember.role, newRole: dto.role },
    });
  }
  if (dto.title !== undefined && dto.title !== targetMember.title) {
    await this.auditLog.log({
      studioId: studio.id,
      actorId,
      action: 'MEMBER_TITLE_CHANGED',
      targetType: 'USER',
      targetId: targetUserId,
      metadata: { oldTitle: targetMember.title, newTitle: dto.title },
    });
  }

  return updated;
}

async removeMember(actorId: string, slug: string, targetUserId: string) {
  const studio = await this.prisma.studio.findUnique({
    where: { slug: slug.toLowerCase() },
    include: { members: true },
  });
  if (!studio) throw new NotFoundException('Studio not found');

  const actorMembership = studio.members.find(m => m.userId === actorId);
  if (!actorMembership) throw new ForbiddenException('Not a member');

  const targetMember = studio.members.find(m => m.userId === targetUserId);
  if (!targetMember) throw new NotFoundException('Member not found');
  if (targetMember.role === 'OWNER') throw new ForbiddenException('Cannot remove the Owner');

  // Admin can only remove MODERATOR/MEMBER
  if (actorMembership.role === 'ADMIN' && ![StudioRole.MODERATOR, StudioRole.MEMBER].includes(targetMember.role as StudioRole)) {
    throw new ForbiddenException('Admins can only remove Moderators');
  }

  await this.prisma.studioMember.delete({ where: { id: targetMember.id } });

  await this.auditLog.log({
    studioId: studio.id,
    actorId,
    action: 'MEMBER_REMOVED',
    targetType: 'USER',
    targetId: targetUserId,
    metadata: { role: targetMember.role },
  });
}

async leaveStudio(userId: string, slug: string) {
  const studio = await this.prisma.studio.findUnique({
    where: { slug: slug.toLowerCase() },
    include: { members: true },
  });
  if (!studio) throw new NotFoundException('Studio not found');

  const membership = studio.members.find(m => m.userId === userId);
  if (!membership) throw new NotFoundException('Not a member of this studio');
  if (membership.role === 'OWNER') throw new ForbiddenException('Owner cannot leave. Transfer ownership first.');

  await this.prisma.studioMember.delete({ where: { id: membership.id } });

  await this.auditLog.log({
    studioId: studio.id,
    actorId: userId,
    action: 'MEMBER_LEFT',
    targetType: 'USER',
    targetId: userId,
    metadata: { role: membership.role },
  });
}

async transferOwnership(ownerId: string, slug: string, targetUserId: string) {
  const studio = await this.prisma.studio.findUnique({
    where: { slug: slug.toLowerCase() },
    include: { members: true },
  });
  if (!studio) throw new NotFoundException('Studio not found');

  const ownerMember = studio.members.find(m => m.userId === ownerId);
  if (!ownerMember || ownerMember.role !== 'OWNER') throw new ForbiddenException('Only the Owner can transfer ownership');

  const targetMember = studio.members.find(m => m.userId === targetUserId);
  if (!targetMember) throw new NotFoundException('Target user is not a member');
  if (targetMember.role !== 'ADMIN') throw new BadRequestException('Ownership can only be transferred to an Admin');

  await this.prisma.$transaction([
    this.prisma.studioMember.update({ where: { id: ownerMember.id }, data: { role: 'ADMIN' } }),
    this.prisma.studioMember.update({ where: { id: targetMember.id }, data: { role: 'OWNER' } }),
  ]);

  await this.auditLog.log({
    studioId: studio.id,
    actorId: ownerId,
    action: 'OWNERSHIP_TRANSFERRED',
    targetType: 'USER',
    targetId: targetUserId,
    metadata: { fromUserId: ownerId, toUserId: targetUserId },
  });
}
```

- [ ] **Step 2: Inject AuditLogService**

Check if `AuditLogService` is already injected in the constructor. If not, add it:

```typescript
constructor(
  private prisma: PrismaService,
  private studioXpService: StudioXpService,
  private auditLog: AuditLogService,  // Add this
) {}
```

Also add the import at the top:
```typescript
import { AuditLogService } from '../audit-log/audit-log.service';
import { StudioRole } from '@playmorrow/database';
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/studios/studios.service.ts
git commit -m "feat: add member management methods to studios service"
```

---

### Task 3: Add Endpoints to StudiosController

**Files:**
- Modify: `apps/api/src/studios/studios.controller.ts`

- [ ] **Step 1: Add the new endpoints**

Add before the closing `}` of the class:

```typescript
@Patch(':slug/members/:userId')
@UseGuards(SessionAuthGuard, StudioRolesGuard)
@StudioRoles(StudioRole.OWNER, StudioRole.ADMIN)
@ApiOkResponse({ description: 'Member updated.' })
async updateMember(
  @Param('slug') slug: string,
  @Param('userId') userId: string,
  @Body() dto: { role?: StudioRole; title?: string },
  @CurrentUser() user: { id: string },
) {
  return this.studiosService.updateMemberRole(user.id, slug, userId, dto);
}

@Delete(':slug/members/:userId')
@UseGuards(SessionAuthGuard, StudioRolesGuard)
@StudioRoles(StudioRole.OWNER, StudioRole.ADMIN)
@ApiOkResponse({ description: 'Member removed.' })
async removeMember(
  @Param('slug') slug: string,
  @Param('userId') userId: string,
  @CurrentUser() user: { id: string },
) {
  return this.studiosService.removeMember(user.id, slug, userId);
}

@Post(':slug/members/leave')
@UseGuards(SessionAuthGuard, StudioRolesGuard)
@StudioRoles(StudioRole.ADMIN, StudioRole.MODERATOR, StudioRole.MEMBER)
@ApiOkResponse({ description: 'Left the studio.' })
async leaveStudio(
  @Param('slug') slug: string,
  @CurrentUser() user: { id: string },
) {
  return this.studiosService.leaveStudio(user.id, slug);
}

@Post(':slug/transfer')
@UseGuards(SessionAuthGuard, StudioRolesGuard)
@StudioRoles(StudioRole.OWNER)
@ApiOkResponse({ description: 'Ownership transferred.' })
async transferOwnership(
  @Param('slug') slug: string,
  @Body() dto: { targetUserId: string },
  @CurrentUser() user: { id: string },
) {
  return this.studiosService.transferOwnership(user.id, slug, dto.targetUserId);
}
```

- [ ] **Step 2: Add imports at the top**

```typescript
import { Patch, Post } from '@nestjs/common';  // Add Post if not already imported
import { StudioRoles, StudioRolesGuard } from './guards/studio-roles.decorator';
// And import the guard:
import { StudioRolesGuard } from './guards/studio-roles.guard';
import { StudioRole } from '@playmorrow/database';
```

Wait — import the decorator and guard from their files:
```typescript
import { StudioRoles } from './guards/studio-roles.decorator';
import { StudioRolesGuard } from './guards/studio-roles.guard';
```

- [ ] **Step 3: Build to verify**

```bash
pnpm --filter @playmorrow/api build 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 4: Commit and push**

```bash
git add apps/api/src/studios/studios.controller.ts apps/api/src/studios/studios.module.ts
git commit -m "feat: add member management endpoints"
git push
```

Note: Also check if `apps/api/src/studios/studios.module.ts` needs updating to include `StudioRolesGuard` and `AuditLogService` in its providers. The guard uses `PrismaService` which is already available via the module's imports.
