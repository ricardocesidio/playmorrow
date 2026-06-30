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

    await this.enforceRoleLimit(studioId, dto.role);

    if (dto.userId) {
      const existing = await this.prisma.studioMember.findUnique({
        where: { studioId_userId: { studioId, userId: dto.userId } },
      });
      if (existing) throw new ConflictException('User is already a member of this studio');
    }

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

    if (dto.userId) {
      const studio = await this.prisma.studio.findUnique({ where: { id: studioId } });
      if (studio) {
        await this.notifications.create({
          recipientId: dto.userId,
          actorId: inviterId,
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

    if (invitation.userId && invitation.userId !== userId) throw new ForbiddenException('This invitation is not for you');

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
