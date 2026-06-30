# Studio Roles Phase 2 — Invitation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend invitation system supporting two invite methods (by email, by existing user), secure token-based acceptance, role limits, and notifications.

**Architecture:** New InvitationsModule with service (business logic) and controller (routes). Token uses UUID v4 → SHA-256 hash stored in DB. AuditLog entries for all invitation actions. Role limits (2 Admin, 5 Moderator) enforced server-side.

**Tech Stack:** NestJS 11, Prisma, crypto (Node built-in)

## Global Constraints

- Token = `crypto.randomUUID()`, stored as `createHash('sha256').update(token).digest('hex')`
- All invitation endpoints under `/studios/:slug/invitations` require `assertStudioAccess(user, members, [OWNER, ADMIN])`
- Role limits: max 2 ADMIN, max 5 MODERATOR (counts existing members + pending invitations)
- Default expiration: 7 days from creation
- AuditLog entries for: create, accept, decline, cancel

---

### Task 1: Create Invitation DTO and Service

**Files:**
- Create: `apps/api/src/invitations/dto/create-invitation.dto.ts`
- Create: `apps/api/src/invitations/invitations.service.ts`

- [ ] **Step 1: Create the DTO**

```typescript
// apps/api/src/invitations/dto/create-invitation.dto.ts
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { StudioRole } from '@playmorrow/database';

export class CreateInvitationDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsEnum(StudioRole)
  role!: StudioRole;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
```

- [ ] **Step 2: Create InvitationsService**

```typescript
// apps/api/src/invitations/invitations.service.ts
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { StudioRole } from '@playmorrow/database';

const INVITATION_EXPIRY_DAYS = 7;
const ROLE_LIMITS: Partial<Record<StudioRole, number>> = { ADMIN: 2, MODERATOR: 5 };

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private notifications: NotificationsService,
  ) {}

  async create(studioId: string, inviterId: string, dto: CreateInvitationDto, ipAddress?: string, userAgent?: string) {
    if (!dto.email && !dto.userId) throw new BadRequestException('Provide either email or userId');
    if (dto.email && dto.userId) throw new BadRequestException('Provide either email or userId, not both');
    if (dto.role === StudioRole.OWNER) throw new BadRequestException('Cannot invite an Owner');

    // Validate role limits
    await this.enforceRoleLimit(studioId, dto.role);

    // Check not already a member
    if (dto.userId) {
      const existing = await this.prisma.studioMember.findUnique({
        where: { studioId_userId: { studioId, userId: dto.userId } },
      });
      if (existing) throw new ConflictException('User is already a member of this studio');
    }

    // Check no duplicate pending invite
    if (dto.email) {
      const dup = await this.prisma.studioInvitation.findFirst({
        where: { studioId, email: dto.email, status: 'PENDING' },
      });
      if (dup) throw new ConflictException('There is already a pending invitation for this email');
    }
    if (dto.userId) {
      const dup = await this.prisma.studioInvitation.findFirst({
        where: { studioId, userId: dto.userId, status: 'PENDING' },
      });
      if (dup) throw new ConflictException('There is already a pending invitation for this user');
    }

    const rawToken = randomUUID();
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.studioInvitation.create({
      data: {
        studioId,
        invitedById: inviterId,
        email: dto.email ?? null,
        userId: dto.userId ?? null,
        role: dto.role,
        token: hashedToken,
        expiresAt,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });

    await this.auditLog.log({
      studioId,
      actorId: inviterId,
      action: 'MEMBER_INVITED',
      targetType: dto.userId ? 'USER' : 'EMAIL',
      targetId: dto.userId ?? dto.email,
      metadata: { role: dto.role, invitationId: invitation.id },
    });

    // Notify invited user (if Method B)
    if (dto.userId) {
      const studio = await this.prisma.studio.findUnique({ where: { id: studioId } });
      if (studio) {
        await this.notifications.create({
          recipientId: dto.userId,
          type: 'STUDIO_INVITATION' as any,
          title: `You've been invited to ${studio.name}`,
          body: `Role: ${dto.role}`,
          targetType: 'STUDIO' as any,
          targetId: studio.id,
        });
      }
    }

    return { ...invitation, token: rawToken };
  }

  async findByToken(rawToken: string) {
    const hashed = createHash('sha256').update(rawToken).digest('hex');
    const invitation = await this.prisma.studioInvitation.findUnique({
      where: { token: hashed },
      include: { studio: { select: { id: true, name: true, slug: true, logoUrl: true } }, invitedBy: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    return invitation;
  }

  async accept(rawToken: string, userId: string) {
    const hashed = createHash('sha256').update(rawToken).digest('hex');
    const invitation = await this.prisma.studioInvitation.findUnique({ where: { token: hashed } });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== 'PENDING') throw new BadRequestException('Invitation is no longer pending');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('Invitation has expired');

    // Verify user matches
    if (invitation.userId && invitation.userId !== userId) throw new ForbiddenException('This invitation is not for you');

    // Create membership
    const member = await this.prisma.studioMember.create({
      data: { studioId: invitation.studioId, userId, role: invitation.role },
    });

    await this.prisma.studioInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    await this.auditLog.log({
      studioId: invitation.studioId,
      actorId: userId,
      action: 'INVITATION_ACCEPTED',
      targetType: 'INVITATION',
      targetId: invitation.id,
      metadata: { role: invitation.role },
    });

    return member;
  }

  async decline(rawToken: string, userId: string) {
    const hashed = createHash('sha256').update(rawToken).digest('hex');
    const invitation = await this.prisma.studioInvitation.findUnique({ where: { token: hashed } });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== 'PENDING') throw new BadRequestException('Invitation is no longer pending');

    await this.prisma.studioInvitation.update({
      where: { id: invitation.id },
      data: { status: 'REJECTED', rejectedAt: new Date() },
    });
  }

  async cancel(invitationId: string, studioId: string, actorId: string) {
    const invitation = await this.prisma.studioInvitation.findFirst({
      where: { id: invitationId, studioId, status: 'PENDING' },
    });
    if (!invitation) throw new NotFoundException('Pending invitation not found');

    await this.prisma.studioInvitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' },
    });

    await this.auditLog.log({
      studioId,
      actorId,
      action: 'INVITATION_CANCELLED',
      targetType: 'INVITATION',
      targetId: invitationId,
    });
  }

  async findByStudio(studioId: string, status?: string) {
    const where: any = { studioId };
    if (status) where.status = status;
    return this.prisma.studioInvitation.findMany({
      where,
      include: { invitedBy: { select: { id: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyInvitations(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];
    return this.prisma.studioInvitation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { gt: new Date() },
        OR: [
          { userId },
          { email: user.email },
        ],
      },
      include: { studio: { select: { id: true, name: true, slug: true, logoUrl: true } }, invitedBy: { select: { id: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async enforceRoleLimit(studioId: string, role: StudioRole) {
    const limit = ROLE_LIMITS[role];
    if (!limit) return;

    const [memberCount, pendingCount] = await Promise.all([
      this.prisma.studioMember.count({ where: { studioId, role } }),
      this.prisma.studioInvitation.count({ where: { studioId, role, status: 'PENDING' } }),
    ]);

    if (memberCount + pendingCount >= limit) {
      throw new BadRequestException(`Studio already has the maximum number of ${role} roles (${limit})`);
    }
  }
}
```

- [ ] **Step 3: Build to verify**

```bash
pnpm --filter @playmorrow/api build 2>&1 | tail -5
```

Expected: no errors. If `NotificationsService.create()` has a different signature, check the existing implementation and adjust.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/invitations/
git commit -m "feat: create invitation DTO and service"
```

---

### Task 2: Create InvitationsController and Module

**Files:**
- Create: `apps/api/src/invitations/invitations.controller.ts`
- Create: `apps/api/src/invitations/invitations.module.ts`

- [ ] **Step 1: Create the controller**

```typescript
// apps/api/src/invitations/invitations.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { assertStudioAccess } from '../common/studio-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { StudioRole } from '@playmorrow/database';
import type { Request } from 'express';

@ApiTags('Invitations')
@Controller()
export class InvitationsController {
  constructor(
    private invitationsService: InvitationsService,
    private prisma: PrismaService,
  ) {}

  @Post('studios/:slug/invitations')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Invitation created.' })
  async create(
    @Param('slug') slug: string,
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const studio = await this.prisma.studio.findUnique({
      where: { slug },
      include: { members: true },
    });
    if (!studio) throw new NotFoundException('Studio not found');

    assertStudioAccess(user, studio.members, [StudioRole.OWNER, StudioRole.ADMIN]);

    // Only OWNER can invite ADMIN
    if (dto.role === StudioRole.ADMIN) {
      const membership = studio.members.find(m => m.userId === user.id);
      if (!membership || membership.role !== StudioRole.OWNER) {
        throw new ForbiddenException('Only the Owner can invite Admins');
      }
    }

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip;
    const ua = req.headers['user-agent'];

    return this.invitationsService.create(studio.id, user.id, dto, ip, ua);
  }

  @Get('studios/:slug/invitations')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'List of invitations.' })
  async list(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
  ) {
    const studio = await this.prisma.studio.findUnique({
      where: { slug },
      include: { members: true },
    });
    if (!studio) throw new NotFoundException('Studio not found');
    assertStudioAccess(user, studio.members, [StudioRole.OWNER, StudioRole.ADMIN]);
    return this.invitationsService.findByStudio(studio.id);
  }

  @Delete('studios/:slug/invitations/:id')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Invitation cancelled.' })
  async cancel(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    const studio = await this.prisma.studio.findUnique({
      where: { slug },
      include: { members: true },
    });
    if (!studio) throw new NotFoundException('Studio not found');
    assertStudioAccess(user, studio.members, [StudioRole.OWNER, StudioRole.ADMIN]);
    return this.invitationsService.cancel(id, studio.id, user.id);
  }

  @Get('invitations/:token')
  @UseGuards(OptionalSessionGuard)
  @ApiOkResponse({ description: 'Invitation details.' })
  async show(@Param('token') token: string) {
    return this.invitationsService.findByToken(token);
  }

  @Post('invitations/:token/accept')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Invitation accepted.' })
  async accept(
    @Param('token') token: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.invitationsService.accept(token, user.id);
  }

  @Post('invitations/:token/decline')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Invitation declined.' })
  async decline(
    @Param('token') token: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.invitationsService.decline(token, user.id);
  }

  @Get('me/invitations')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: "Current user's pending invitations." })
  async myInvitations(@CurrentUser() user: { id: string }) {
    return this.invitationsService.findMyInvitations(user.id);
  }
}
```

- [ ] **Step 2: Create the module**

```typescript
// apps/api/src/invitations/invitations.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditLogModule, NotificationsModule],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
```

- [ ] **Step 3: Build to verify**

```bash
pnpm --filter @playmorrow/api build 2>&1 | tail -10
```

If there are import errors, fix them. The `CurrentUser` decorator path might need checking.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/invitations/
git commit -m "feat: create invitations controller and module"
```

---

### Task 3: Register Module and Build

**Files:**
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Register InvitationsModule in AppModule**

Open `apps/api/src/app.module.ts` and add `InvitationsModule` to the imports array (after existing modules).

- [ ] **Step 2: Build to verify**

```bash
pnpm --filter @playmorrow/api build 2>&1 | tail -5
```

Expected: `$ nest build` with no errors.

- [ ] **Step 3: Push**

```bash
git add apps/api/src/app.module.ts
git commit -m "feat: register InvitationsModule"
git push
```
