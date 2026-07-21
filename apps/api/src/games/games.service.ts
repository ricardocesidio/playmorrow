import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { StudioRole } from '@playmorrow/database';
import type { Prisma } from '@playmorrow/database';

import { assertStudioAccess } from '../common/studio-permissions';
import { CountersService } from '../common/counters.service';
import { logger } from '../common/logger';
import { PrismaService } from '../prisma/prisma.service';
import { StudioXpService } from '../studios/studio-xp.service';
import type { CreateGameDto } from './dto/create-game.dto';
import type { UpdateGameDto } from './dto/update-game.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { FeedEngineService } from '../feed/feed-events.service';

const GAME_INCLUDE = {
  studio: { select: { id: true, name: true, slug: true } },
  media: { orderBy: { position: 'asc' as const } },
  platformLinks: { orderBy: { position: 'asc' as const } },
  tags: { include: { tag: true } },
  devlogs: { where: { status: { not: 'DRAFT' } }, orderBy: { createdAt: 'desc' as const }, take: 10, include: { screenshots: { orderBy: { order: 'asc' as const }, take: 1 } } },
  roadmapItems: { orderBy: { position: 'asc' as const } },
  _count: { select: { followers: true } },
} as const;

// Slimmer include for list endpoints (homepage feed, /games) — explicit fields only (performance audit item)
const GAME_LIST_INCLUDE = {
  studio: { select: { id: true, name: true, slug: true, logoUrl: true } },
  media: { where: { type: 'SCREENSHOT' as const }, take: 1, orderBy: { position: 'asc' as const } },
  platformLinks: { take: 4, orderBy: { position: 'asc' as const } },
  tags: { include: { tag: true }, take: 6 },
  _count: { select: { followers: true, wishlistItems: true } },
} as const;

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studioXpService: StudioXpService,
    private readonly auditLog: AuditLogService,
    private readonly feedEngine: FeedEngineService,
    private readonly countersService: CountersService,
  ) {}

  async create(userId: string, studioSlug: string, dto: CreateGameDto) {
    const slug = dto.slug.toLowerCase();

    const studio = await this.prisma.studio.findUnique({
      where: { slug: studioSlug.toLowerCase() },
      include: { members: true },
    });
    if (!studio) {
      throw new NotFoundException('Studio not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    assertStudioAccess({ id: userId, role: user.role }, studio.members, [StudioRole.OWNER, StudioRole.ADMIN, StudioRole.MODERATOR, StudioRole.MEMBER]);

    const existing = await this.prisma.game.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('A game with this slug already exists');
    }

    const game = await this.prisma.game.create({
      data: {
        title: dto.title,
        slug,
        studioId: studio.id,
        createdBy: userId,
        tagline: dto.tagline,
        description: dto.description,
        status: dto.status ?? 'IN_DEVELOPMENT',
        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
        expectedReleaseText: dto.expectedReleaseText,
        priceCents: dto.priceCents,
        currency: dto.currency,
        isFree: dto.isFree,
        coverUrl: dto.coverUrl,
        bannerUrl: dto.bannerUrl,
        trailerUrl: dto.trailerUrl,
        media: dto.media
          ? {
              create: dto.media.map((m) => ({
                type: m.type,
                url: m.url,
                caption: m.caption,
                position: m.sortOrder ?? 0,
              })),
            }
          : undefined,
        platformLinks: dto.platformLinks
          ? {
              create: dto.platformLinks.map((pl, i) => ({
                kind: pl.platform,
                url: pl.url,
                label: pl.label,
                position: i,
              })),
            }
          : undefined,
        tags: dto.tags
          ? {
              create: await Promise.all(
                dto.tags.map(async (tagSlug) => {
                  const tag = await this.prisma.tag.upsert({
                    where: { slug: tagSlug.toLowerCase() },
                    update: {},
                    create: { slug: tagSlug.toLowerCase(), name: tagSlug },
                  });
                  return { tagId: tag.id };
                }),
              ),
            }
          : undefined,
      },
      include: GAME_INCLUDE,
    });

    await this.studioXpService.award(studio.id, 'GAME_CREATE', undefined, game.id);

    await this.auditLog.log({
      studioId: studio.id,
      actorId: userId,
      action: 'GAME_CREATED',
      targetType: 'GAME',
      targetId: game.id,
      metadata: { title: game.title },
    });

    this.feedEngine.emit('GAME_CREATED', {
      studioId: studio.id,
      gameId: game.id,
      actorId: userId,
      payload: { title: game.title, slug: game.slug },
    }).catch((err) => logger.error({ err }));

    logger.info({ msg: 'game created', gameId: game.id, studioId: studio.id, userId });

    return this.toResponse(game);
  }

  async findByStudioSlug(studioSlug: string, page = 1, pageSize = 20, status?: string) {
    const studio = await this.prisma.studio.findUnique({
      where: { slug: studioSlug.toLowerCase() },
    });
    if (!studio) {
      throw new NotFoundException('Studio not found');
    }

    const where: Prisma.GameWhereInput = { studioId: studio.id };
    if (status) {
      where.status = status as never;
    }

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        include: GAME_INCLUDE,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.game.count({ where }),
    ]);

    return {
      items: games.map((g) => this.toResponse(g)),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async findAll(
    page = 1,
    pageSize = 20,
    options?: { search?: string; status?: string; tag?: string },
  ) {
    const where: Prisma.GameWhereInput = {};
    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' as const } },
        { tagline: { contains: options.search, mode: 'insensitive' as const } },
      ];
    }
    if (options?.status) {
      where.status = options.status as never;
    }
    if (options?.tag) {
      where.tags = { some: { tag: { slug: options.tag.toLowerCase() } } };
    }

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        include: GAME_INCLUDE,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.game.count({ where }),
    ]);

    return {
      items: games.map((g) => this.toResponse(g)),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async findBySlug(slug: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug: slug.toLowerCase() },
      include: GAME_INCLUDE,
    });

    if (!game) {
      return null;
    }

    // Track view (increment async, don't block response)
    this.prisma.gameView.create({
      data: { gameId: game.id },
    }).catch((err) => logger.error({ err }));

    // Sync all denormalized counters
    this.syncGameCounters(game.id).catch((err) => logger.error({ err }));

    return this.toResponse(game);
  }

  async syncGameCounters(gameId: string) {
    await this.countersService.syncGameCounters(gameId);
  }

  async update(userId: string, slug: string, dto: UpdateGameDto) {
    const game = await this.prisma.game.findUnique({
      where: { slug: slug.toLowerCase() },
      include: { studio: { include: { members: true } } },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const memberRole = game.studio.members.find((m) => m.userId === userId)?.role;
    const isMember = memberRole === StudioRole.MEMBER;

    const data: Prisma.GameUpdateInput = { updatedBy: userId };

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.tagline !== undefined) data.tagline = dto.tagline;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.coverUrl !== undefined) data.coverUrl = dto.coverUrl;
    if (dto.bannerUrl !== undefined) data.bannerUrl = dto.bannerUrl;
    if (dto.trailerUrl !== undefined) data.trailerUrl = dto.trailerUrl;

    if (!isMember) {
      if (dto.status !== undefined) data.status = dto.status as never;
      if (dto.releaseDate !== undefined) data.releaseDate = new Date(dto.releaseDate);
      if (dto.expectedReleaseText !== undefined) data.expectedReleaseText = dto.expectedReleaseText;
      if (dto.priceCents !== undefined) data.priceCents = dto.priceCents;
      if (dto.currency !== undefined) data.currency = dto.currency;
      if (dto.isFree !== undefined) data.isFree = dto.isFree;
      // publishedBy/publishedAt must be set BEFORE the update call
      if (dto.status === 'RELEASED') {
        data.publishedBy = userId;
        data.publishedAt = new Date();
      }
    }

    assertStudioAccess({ id: userId, role: user.role }, game.studio.members, [StudioRole.OWNER, StudioRole.ADMIN, StudioRole.MODERATOR, StudioRole.MEMBER]);

    if (dto.media !== undefined) {
      await this.prisma.gameMedia.deleteMany({ where: { gameId: game.id } });
      data.media = {
        create: dto.media.map((m) => ({
          type: m.type,
          url: m.url,
          caption: m.caption,
          position: m.sortOrder ?? 0,
        })),
      };
    }

    if (dto.platformLinks !== undefined) {
      await this.prisma.platformLink.deleteMany({ where: { gameId: game.id } });
      data.platformLinks = {
        create: dto.platformLinks.map((pl, i) => ({
          kind: pl.platform,
          url: pl.url,
          label: pl.label,
          position: i,
        })),
      };
    }

    if (dto.tags !== undefined) {
      await this.prisma.gameTag.deleteMany({ where: { gameId: game.id } });
      data.tags = {
        create: await Promise.all(
          dto.tags.map(async (tagSlug) => {
            const tag = await this.prisma.tag.upsert({
              where: { slug: tagSlug.toLowerCase() },
              update: {},
              create: { slug: tagSlug.toLowerCase(), name: tagSlug },
            });
            return { tagId: tag.id };
          }),
        ),
      };
    }

    const updated = await this.prisma.game.update({
      where: { id: game.id },
      data,
      include: GAME_INCLUDE,
    });

    if (dto.status && dto.status !== game.status) {
      if (dto.status === 'BETA') {
        await this.studioXpService.award(game.studio.id, 'GAME_BETA', undefined, game.id);
      } else if (dto.status === 'RELEASED') {
        await this.studioXpService.award(game.studio.id, 'GAME_RELEASE', undefined, game.id);
      }
      this.feedEngine.emit('GAME_STATUS_CHANGED', {
        studioId: game.studioId,
        gameId: game.id,
        actorId: userId,
        payload: { title: game.title, status: dto.status, previousStatus: game.status },
      }).catch((err) => logger.error({ err }));
    }

    if (dto.trailerUrl !== undefined && dto.trailerUrl !== game.trailerUrl) {
      this.feedEngine.emit('TRAILER_UPDATED', {
        studioId: game.studioId,
        gameId: game.id,
        actorId: userId,
        payload: { title: game.title, trailerUrl: dto.trailerUrl },
      }).catch((err) => logger.error({ err }));
    }

    await this.auditLog.log({
      studioId: game.studioId,
      actorId: userId,
      action: 'GAME_UPDATED',
      targetType: 'GAME',
      targetId: game.id,
    });

    return this.toResponse(updated);
  }

  async remove(userId: string, slug: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug: slug.toLowerCase() },
      include: { studio: { include: { members: true } } },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    assertStudioAccess({ id: userId, role: user.role }, game.studio.members, [StudioRole.OWNER, StudioRole.ADMIN]);

    await this.auditLog.log({
      studioId: game.studioId,
      actorId: userId,
      action: 'GAME_DELETED',
      targetType: 'GAME',
      targetId: slug,
    });

    // onDelete: Cascade removes devlogs, media, platform links, etc.
    await this.prisma.game.delete({ where: { id: game.id } });

    return { success: true };
  }

  private toResponse(game: {
    id: string; slug: string; studioId: string; title: string; tagline: string | null;
    description: string | null; status: string; releaseDate: Date | null;
    expectedReleaseText: string | null; priceCents: number | null; currency: string | null;
    isFree: boolean; coverUrl: string | null; bannerUrl: string | null;
    readme: string | null; trailerUrl: string | null; demoStatus: string | null;
    demoUrl: string | null; edition: string | null; engine: string | null;
    languages: string | null; genres: string | null; modes: string | null;
    isPublished: boolean; followersCount: number; wishlistsCount: number;
    commentsCount: number; viewsCount: number; featured: boolean;
    createdBy: string | null; updatedBy: string | null; publishedBy: string | null;
    publishedAt: Date | null;
    createdAt: Date; updatedAt: Date;
    studio?: { id: string; name: string; slug: string; };
    media?: any[]; tags?: any[]; platformLinks?: any[];
    devlogs?: any[]; roadmapItems?: any[];
    _count?: { comments?: number; followers?: number; wishlistItems?: number; views?: number; };
  }) {
    return {
      id: game.id,
      title: game.title,
      slug: game.slug,
      tagline: game.tagline,
      description: game.description,
      status: game.status,
      releaseDate: game.releaseDate?.toISOString() ?? null,
      expectedReleaseText: game.expectedReleaseText,
      priceCents: game.priceCents,
      currency: game.currency,
      isFree: game.isFree,
      coverUrl: game.coverUrl,
      bannerUrl: game.bannerUrl,
      isPublished: game.isPublished,
      followersCount: game.followersCount ?? game._count?.followers ?? 0,
      wishlistsCount: game.wishlistsCount ?? 0,
      commentsCount: game.commentsCount ?? 0,
      viewsCount: game.viewsCount ?? 0,
      featured: game.featured ?? false,
      trailerUrl: game.trailerUrl ?? null,
      readme: game.readme ?? null,
      demoStatus: game.demoStatus ?? null,
      demoUrl: game.demoUrl ?? null,
      edition: game.edition ?? null,
      engine: game.engine ?? null,
      languages: game.languages ?? null,
      genres: game.genres ?? null,
      modes: game.modes ?? null,
      studio: game.studio,
      media: game.media,
      platformLinks: ((game.platformLinks ?? []) as Array<{ id: string; kind: string; url: string; label: string | null }>).map((pl) => ({
        id: pl.id,
        platform: pl.kind,
        url: pl.url,
        label: pl.label,
      })),
      tags: ((game.tags ?? []) as Array<{ tag: { slug: string } }>).map((gt) => gt.tag.slug),
      devlogs: game.devlogs ?? [],
      roadmapItems: game.roadmapItems ?? [],
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
    };
  }
}
