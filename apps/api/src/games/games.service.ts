import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@playmorrow/database';

import { assertStudioWriteAccess } from '../common/studio-permissions';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateGameDto } from './dto/create-game.dto';
import type { UpdateGameDto } from './dto/update-game.dto';

const GAME_INCLUDE = {
  studio: { select: { id: true, name: true, slug: true } },
  media: { orderBy: { position: 'asc' as const } },
  platformLinks: { orderBy: { position: 'asc' as const } },
  tags: { include: { tag: true } },
  _count: { select: { followers: true } },
} satisfies Prisma.GameInclude;

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

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

    assertStudioWriteAccess({ id: userId, role: user.role }, studio.members);

    const existing = await this.prisma.game.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('A game with this slug already exists');
    }

    const game = await this.prisma.game.create({
      data: {
        title: dto.title,
        slug,
        studioId: studio.id,
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

    return this.toResponse(game);
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

    assertStudioWriteAccess({ id: userId, role: user.role }, game.studio.members);

    const data: Prisma.GameUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.tagline !== undefined) data.tagline = dto.tagline;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status as never;
    if (dto.releaseDate !== undefined) data.releaseDate = new Date(dto.releaseDate);
    if (dto.expectedReleaseText !== undefined) data.expectedReleaseText = dto.expectedReleaseText;
    if (dto.priceCents !== undefined) data.priceCents = dto.priceCents;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.isFree !== undefined) data.isFree = dto.isFree;
    if (dto.coverUrl !== undefined) data.coverUrl = dto.coverUrl;
    if (dto.bannerUrl !== undefined) data.bannerUrl = dto.bannerUrl;

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

    return this.toResponse(updated);
  }

  private toResponse(game: {
    id: string;
    title: string;
    slug: string;
    studioId: string;
    tagline: string | null;
    description: string | null;
    status: string;
    releaseDate: Date | null;
    expectedReleaseText: string | null;
    priceCents: number | null;
    currency: string | null;
    isFree: boolean;
    coverUrl: string | null;
    bannerUrl: string | null;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    studio: { id: string; name: string; slug: string };
    media: { id: string; type: string; url: string; caption: string | null; position: number }[];
    platformLinks: { id: string; kind: string; url: string; label: string | null; position: number }[];
    tags: { tag: { slug: string; name: string; kind: string | null } }[];
    _count?: { followers: number };
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
      followersCount: game._count?.followers ?? 0,
      studio: game.studio,
      media: game.media,
      platformLinks: game.platformLinks.map((pl) => ({
        id: pl.id,
        platform: pl.kind,
        url: pl.url,
        label: pl.label,
      })),
      tags: game.tags.map((gt) => gt.tag.slug),
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
    };
  }
}
