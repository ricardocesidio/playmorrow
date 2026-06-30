import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { StudioRole } from '@playmorrow/database';
import type { Prisma } from '@playmorrow/database';

import { assertStudioAccess } from '../common/studio-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { StudioXpService } from '../studios/studio-xp.service';
import type { CreateDevlogDto } from './dto/create-devlog.dto';
import type { UpdateDevlogDto } from './dto/update-devlog.dto';

const DEVLOG_INCLUDE = {
  game: { select: { id: true, title: true, slug: true, studioId: true } },
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
} satisfies Prisma.DevlogInclude;

@Injectable()
export class DevlogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studioXpService: StudioXpService,
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

    const isPublished = dto.isPublished ?? false;
    const publishedAt = isPublished ? (dto.publishedAt ? new Date(dto.publishedAt) : new Date()) : null;

    const devlog = await this.prisma.devlog.create({
      data: {
        title: dto.title,
        slug,
        body: dto.body,
        coverUrl: dto.coverUrl,
        isPublished,
        publishedAt,
        gameId: game.id,
        authorId: userId,
      },
      include: DEVLOG_INCLUDE,
    });

    if (isPublished) {
      await this.studioXpService.award(game.studio.id, 'DEVLOG_PUBLISH', undefined, devlog.id);
    }

    return this.toResponse(devlog);
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
    if (dto.body !== undefined) data.body = dto.body;
    if (dto.coverUrl !== undefined) data.coverUrl = dto.coverUrl;

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
      data,
      include: DEVLOG_INCLUDE,
    });

    return this.toResponse(updated);
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
    slug: string;
    body: string;
    coverUrl: string | null;
    isPublished: boolean;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    game: { id: string; title: string; slug: string; studioId: string };
    author: { id: string; username: string; displayName: string; avatarUrl: string | null };
  }) {
    return {
      id: devlog.id,
      title: devlog.title,
      slug: devlog.slug,
      excerpt: devlog.body.length > 200 ? `${devlog.body.slice(0, 200)}...` : devlog.body,
      body: devlog.body,
      coverUrl: devlog.coverUrl,
      isPublished: devlog.isPublished,
      publishedAt: devlog.publishedAt?.toISOString() ?? null,
      game: {
        id: devlog.game.id,
        title: devlog.game.title,
        slug: devlog.game.slug,
      },
      studio: { id: devlog.game.studioId },
      author: devlog.author,
      createdAt: devlog.createdAt.toISOString(),
      updatedAt: devlog.updatedAt.toISOString(),
    };
  }
}
