import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@playmorrow/database';
import { StudioRole } from '@playmorrow/database';

import { assertStudioAccess } from '../common/studio-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { StudioXpService } from './studio-xp.service';
import type { CreateStudioDto } from './dto/create-studio.dto';
import type { UpdateStudioDto } from './dto/update-studio.dto';

const STUDIO_INCLUDE = {
  _count: { select: { members: true, games: true, followers: true } },
} satisfies Prisma.StudioInclude;

export type StudioResponse = Awaited<ReturnType<StudiosService['findBySlug']>>;

@Injectable()
export class StudiosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studioXpService: StudioXpService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(userId: string, dto: CreateStudioDto) {
    const slug = dto.slug.toLowerCase();

    const existing = await this.prisma.studio.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('A studio with this slug already exists');
    }

    const studio = await this.prisma.studio.create({
      data: {
        name: dto.name,
        slug,
        tagline: dto.tagline,
        description: dto.description,
        location: dto.location,
        websiteUrl: dto.websiteUrl,
        logoUrl: dto.logoUrl,
        bannerUrl: dto.bannerUrl,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
      include: STUDIO_INCLUDE,
    });

    const allFields = [studio.name, studio.tagline, studio.description, studio.location, studio.websiteUrl, studio.logoUrl, studio.bannerUrl];
    if (allFields.every(Boolean)) {
      await this.studioXpService.award(studio.id, 'PROFILE_COMPLETE');
    }

    return this.toResponse(studio);
  }

  async findAll(page = 1, pageSize = 20, search?: string) {
    const where: Prisma.StudioWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [studios, total] = await Promise.all([
      this.prisma.studio.findMany({
        where,
        include: STUDIO_INCLUDE,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.studio.count({ where }),
    ]);

    return {
      items: studios.map((s) => this.toResponse(s)),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async findBySlug(slug: string) {
    const studio = await this.prisma.studio.findUnique({
      where: { slug: slug.toLowerCase() },
      include: STUDIO_INCLUDE,
    });

    if (!studio) {
      return null;
    }

    return this.toResponse(studio);
  }

  async update(userId: string, slug: string, dto: UpdateStudioDto) {
    const studio = await this.prisma.studio.findUnique({
      where: { slug: slug.toLowerCase() },
      include: { members: true },
    });

    if (!studio) {
      throw new NotFoundException('Studio not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    assertStudioAccess({ id: userId, role: user?.role }, studio.members, [StudioRole.OWNER, StudioRole.ADMIN]);

    const updated = await this.prisma.studio.update({
      where: { id: studio.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.tagline !== undefined && { tagline: dto.tagline }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.websiteUrl !== undefined && { websiteUrl: dto.websiteUrl }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.bannerUrl !== undefined && { bannerUrl: dto.bannerUrl }),
      },
      include: STUDIO_INCLUDE,
    });

    return this.toResponse(updated);
  }

  async remove(userId: string, slug: string) {
    const studio = await this.prisma.studio.findUnique({
      where: { slug: slug.toLowerCase() },
      include: { members: true },
    });

    if (!studio) {
      throw new NotFoundException('Studio not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    assertStudioAccess({ id: userId, role: user?.role }, studio.members, [StudioRole.OWNER, StudioRole.ADMIN]);

    // Schema uses onDelete: Cascade, so games/devlogs/etc. are removed with it.
    await this.prisma.studio.delete({ where: { id: studio.id } });

    return { success: true };
  }

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

    if (dto.role === 'ADMIN' && actorMembership.role !== 'OWNER') {
      throw new ForbiddenException('Only the Owner can promote to Admin');
    }

    if (actorMembership.role === 'ADMIN' && targetMember.role !== 'MODERATOR' && targetMember.role !== 'MEMBER') {
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

    if (actorMembership.role === 'ADMIN' && targetMember.role !== 'MODERATOR' && targetMember.role !== 'MEMBER') {
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

  async findMyStudios(userId: string) {
    const memberships = await this.prisma.studioMember.findMany({
      where: { userId },
      include: { studio: { include: STUDIO_INCLUDE } },
    });

    return memberships.map((m) => this.toResponse(m.studio));
  }

  async findBySlugWithMembers(slug: string) {
    const studio = await this.prisma.studio.findUnique({
      where: { slug: slug.toLowerCase() },
      include: {
        ...STUDIO_INCLUDE,
        members: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!studio) {
      return null;
    }

    return {
      ...this.toResponse(studio),
      members: studio.members.map((m) => ({
        id: m.id,
        role: m.role,
        title: m.title,
        user: m.user,
      })),
    };
  }

  async isStudioMember(userId: string, studioSlug: string, allowedRoles?: StudioRole[]) {
    const roles = allowedRoles ?? ['OWNER', 'ADMIN', 'MEMBER'];
    const member = await this.prisma.studioMember.findFirst({
      where: {
        userId,
        studio: { slug: studioSlug.toLowerCase() },
        role: { in: roles },
      },
    });
    return !!member;
  }

  async isStudioAdmin(userId: string, studioSlug: string) {
    return this.isStudioMember(userId, studioSlug, ['OWNER', 'ADMIN']);
  }

  async isStudioOwner(userId: string, studioSlug: string) {
    return this.isStudioMember(userId, studioSlug, ['OWNER']);
  }

  private toResponse(studio: {
    id: string;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    websiteUrl: string | null;
    location: string | null;
    foundedYear: number | null;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: { members: number; games: number; followers: number };
  }) {
    return {
      id: studio.id,
      name: studio.name,
      slug: studio.slug,
      tagline: studio.tagline,
      description: studio.description,
      logoUrl: studio.logoUrl,
      bannerUrl: studio.bannerUrl,
      websiteUrl: studio.websiteUrl,
      location: studio.location,
      foundedYear: studio.foundedYear,
      isVerified: studio.isVerified,
      membersCount: studio._count?.members ?? 0,
      gamesCount: studio._count?.games ?? 0,
      followersCount: studio._count?.followers ?? 0,
      createdAt: studio.createdAt.toISOString(),
      updatedAt: studio.updatedAt.toISOString(),
    };
  }
}
