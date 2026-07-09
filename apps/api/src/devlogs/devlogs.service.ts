import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { StudioRole } from '@playmorrow/database';
import type { Prisma } from '@playmorrow/database';

import { assertStudioAccess } from '../common/studio-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { StudioXpService } from '../studios/studio-xp.service';
import { FeedEngineService } from '../feed/feed-events.service';
import { logger } from '../common/logger';
import type { CreateDevlogDto } from './dto/create-devlog.dto';
import type { UpdateDevlogDto } from './dto/update-devlog.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

const DEVLOG_INCLUDE = {
  game: { select: { id: true, title: true, slug: true, studioId: true } },
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true, role: true } },
  screenshots: { orderBy: { order: 'asc' as const } },
  _count: { select: { reactions: true, comments: true, likes: true } },
} satisfies Prisma.DevlogInclude;

@Injectable()
export class DevlogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xp: StudioXpService,
    private readonly audit: AuditLogService,
    private readonly feedEngine: FeedEngineService,
  ) {}

  async create(userId: string, gameSlug: string, dto: CreateDevlogDto) {
    const game = await this.prisma.game.findUnique({
      where: { slug: gameSlug.toLowerCase() },
      include: { studio: { include: { members: true } } },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    assertStudioAccess({ id: userId, role: user.role }, game.studio.members, [StudioRole.OWNER, StudioRole.ADMIN, StudioRole.MODERATOR, StudioRole.MEMBER]);

    const slug = dto.slug.toLowerCase();
    const existing = await this.prisma.devlog.findUnique({
      where: { gameId_slug: { gameId: game.id, slug } },
    });
    if (existing) {
      throw new ConflictException('A devlog with this slug already exists for this game');
    }

    const isPublished = dto.isPublished ?? (dto.status === 'PUBLISHED');
    const publishedAt = isPublished ? (dto.publishedAt ? new Date(dto.publishedAt) : new Date()) : null;
    const readingTimeMin = dto.readingTimeMin ?? Math.ceil(dto.body.split(/\s+/).length / 200);

    const devlog = await this.prisma.devlog.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        slug,
        body: dto.body,
        status: (dto.status ?? (isPublished ? 'PUBLISHED' : 'DRAFT')) as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED',
        isPublished,
        publishedAt,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        readingTimeMin,
        category: dto.category,
        tags: dto.tags ?? [],
        gameId: game.id,
        authorId: userId,
        screenshots: dto.screenshots?.length
          ? { create: dto.screenshots.map((s) => ({ url: s.url, order: s.order, caption: s.caption })) }
          : undefined,
      },
      include: { ...DEVLOG_INCLUDE, screenshots: true },
    });

    let feedEventId: string | undefined;

    if (isPublished) {
      await this.xp.award(game.studio.id, 'DEVLOG_PUBLISH', undefined, devlog.id);
      const feedEvent = await this.feedEngine.onDevlogPublished({
        devlog: { id: devlog.id, title: devlog.title, slug: devlog.slug, gameId: devlog.gameId, studioId: game.studioId, authorId: userId },
        gameTitle: game.title,
      });
      feedEventId = (feedEvent as { id: string }).id;
    }

    await this.audit.log({
      studioId: game.studioId,
      actorId: userId,
      action: 'DEVLOG_CREATED',
      targetType: 'DEVLOG',
      targetId: devlog.id,
      metadata: { title: devlog.title },
    });

    return { ...this.toResponse(devlog), feedEventId };
  }

  async findByGameSlug(gameSlug: string, page = 1, pageSize = 20, includeDrafts = false, userId?: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug: gameSlug.toLowerCase() },
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const where: Prisma.DevlogWhereInput = { gameId: game.id };

    if (!includeDrafts) {
      where.isPublished = true;
    } else if (userId) {
      // If includeDrafts is set, check if user is authorized
      const studio = await this.prisma.studio.findUnique({
        where: { id: game.studioId },
        include: { members: true },
      });
      if (studio) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const isAuthorized =
          user?.role === 'ADMIN' ||
          studio.members.some(
            (m) => m.userId === userId && (m.role === 'OWNER' || m.role === 'ADMIN'),
          );
        if (!isAuthorized) {
          where.isPublished = true;
        }
      } else {
        where.isPublished = true;
      }
    } else {
      where.isPublished = true;
    }

    const [devlogs, total] = await Promise.all([
      this.prisma.devlog.findMany({
        where,
        include: DEVLOG_INCLUDE,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.devlog.count({ where }),
    ]);

    return {
      items: devlogs.map((d) => this.toResponse(d)),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async findAllPublished(page = 1, pageSize = 20, search?: string) {
    const where: Prisma.DevlogWhereInput = { isPublished: true };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { body: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [devlogs, total] = await Promise.all([
      this.prisma.devlog.findMany({
        where,
        include: DEVLOG_INCLUDE,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.devlog.count({ where }),
    ]);

    return {
      items: devlogs.map((d) => this.toResponse(d)),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async findById(id: string, userId?: string) {
    const devlog = await this.prisma.devlog.findUnique({
      where: { id },
      include: {
        ...DEVLOG_INCLUDE,
        game: { include: { studio: { include: { members: true } } } },
      },
    });

    if (!devlog) {
      return null;
    }

    // Drafts require authorization
    if (!devlog.isPublished) {
      if (!userId) {
        return null;
      }
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const isAuthorized =
        user?.role === 'ADMIN' ||
        devlog.game.studio.members.some(
          (m) => m.userId === userId && (m.role === 'OWNER' || m.role === 'ADMIN'),
        );
      if (!isAuthorized) {
        return null;
      }
    }

    return this.toResponse(devlog);
  }

  async update(userId: string, id: string, dto: UpdateDevlogDto) {
    const devlog = await this.prisma.devlog.findUnique({
      where: { id },
      include: { game: { include: { studio: { include: { members: true } } } } },
    });

    if (!devlog) {
      throw new NotFoundException('Devlog not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    assertStudioAccess({ id: userId, role: user.role }, devlog.game.studio.members, [StudioRole.OWNER, StudioRole.ADMIN, StudioRole.MODERATOR, StudioRole.MEMBER]);

    const data: Prisma.DevlogUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.body !== undefined) {
      data.body = dto.body;
      data.readingTimeMin = Math.ceil(dto.body.split(/\s+/).length / 200);
    }

    if (dto.isPublished !== undefined) {
      data.isPublished = dto.isPublished;
      if (dto.isPublished) {
        data.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : new Date();
      } else {
        data.publishedAt = null;
      }
    }

    if (dto.slug !== undefined) {
      const newSlug = dto.slug.toLowerCase();
      const existing = await this.prisma.devlog.findFirst({
        where: { gameId: devlog.gameId, slug: newSlug, id: { not: devlog.id } },
      });
      if (existing) {
        throw new ConflictException('A devlog with this slug already exists for this game');
      }
      data.slug = newSlug;
    }

    const updated = await this.prisma.devlog.update({
      where: { id },
      data: { ...data, editedAt: new Date() },
      include: DEVLOG_INCLUDE,
    });

    await this.audit.log({
      studioId: devlog.game.studioId,
      actorId: userId,
      action: 'DEVLOG_UPDATED',
      targetType: 'DEVLOG',
      targetId: id,
    });

    return this.toResponse(updated);
  }

  async toggleLike(userId: string, devlogId: string) {
    const existing = await this.prisma.devlogLike.findUnique({
      where: { devlogId_userId: { devlogId, userId } },
    });
    if (existing) {
      await this.prisma.devlogLike.delete({ where: { id: existing.id } });
      return { liked: false };
    }
    await this.prisma.devlogLike.create({ data: { devlogId, userId } });
    return { liked: true };
  }

  async remove(userId: string, id: string) {
    const devlog = await this.prisma.devlog.findUnique({
      where: { id },
      include: { game: { include: { studio: { include: { members: true } } } } },
    });

    if (!devlog) throw new NotFoundException('Devlog not found');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    assertStudioAccess({ id: userId, role: user.role }, devlog.game.studio.members, [StudioRole.OWNER, StudioRole.ADMIN, StudioRole.MODERATOR, StudioRole.MEMBER]);

    await this.audit.log({
      studioId: devlog.game.studioId,
      actorId: userId,
      action: 'DEVLOG_DELETED',
      targetType: 'DEVLOG',
      targetId: id,
    });

    // onDelete: Cascade removes comments and reactions.
    await this.prisma.devlog.delete({ where: { id } });

    return { success: true };
  }

  async findAllByAuthorId(userId: string) {
    const devlogs = await this.prisma.devlog.findMany({
      where: { authorId: userId },
      include: {
        game: { select: { id: true, title: true, slug: true, studioId: true } },
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return devlogs.map((d) => this.toResponse(d));
  }

  private toResponse(devlog: {
    id: string;
    title: string;
    subtitle: string | null;
    slug: string;
    body: string;
    status: string;
    isPublished: boolean;
    publishedAt: Date | null;
    scheduledFor: Date | null;
    editedAt: Date | null;
    readingTimeMin: number | null;
    category: string | null;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    game: { id: string; title: string; slug: string; studioId: string };
    author: { id: string; username: string; displayName: string; avatarUrl: string | null; role?: string };
    screenshots?: { id: string; url: string; order: number; caption: string | null }[];
    _count?: { reactions?: number; comments?: number; likes?: number };
  }) {
    return {
      id: devlog.id,
      title: devlog.title,
      subtitle: devlog.subtitle,
      slug: devlog.slug,
      excerpt: devlog.body.length > 200 ? `${devlog.body.slice(0, 200)}...` : devlog.body,
      body: devlog.body,
      status: devlog.status,
      isPublished: devlog.isPublished,
      publishedAt: devlog.publishedAt?.toISOString() ?? null,
      scheduledFor: devlog.scheduledFor?.toISOString() ?? null,
      editedAt: devlog.editedAt?.toISOString() ?? null,
      readingTimeMin: devlog.readingTimeMin,
      category: devlog.category,
      tags: devlog.tags,
      game: {
        id: devlog.game.id,
        title: devlog.game.title,
        slug: devlog.game.slug,
      },
      studio: { id: devlog.game.studioId },
      author: devlog.author,
      screenshots: devlog.screenshots ?? [],
      reactionsCount: devlog._count?.reactions ?? 0,
      commentsCount: devlog._count?.comments ?? 0,
      likesCount: devlog._count?.likes ?? 0,
      createdAt: devlog.createdAt.toISOString(),
      updatedAt: devlog.updatedAt.toISOString(),
    };
  }
}
