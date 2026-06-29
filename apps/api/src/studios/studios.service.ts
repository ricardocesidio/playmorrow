import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@playmorrow/database';
import { StudioRole } from '@playmorrow/database';

import { assertStudioWriteAccess } from '../common/studio-permissions';
import { PrismaService } from '../prisma/prisma.service';
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
    assertStudioWriteAccess({ id: userId, role: user?.role }, studio.members);

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
    assertStudioWriteAccess({ id: userId, role: user?.role }, studio.members);

    // Schema uses onDelete: Cascade, so games/devlogs/etc. are removed with it.
    await this.prisma.studio.delete({ where: { id: studio.id } });

    return { success: true };
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
