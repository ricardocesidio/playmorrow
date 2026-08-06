import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma, GameStatus } from '@playmorrow/database';

export interface SearchFilters {
  genre?: string;
  status?: string;
  platform?: string;
  tag?: string;
  engine?: string;
  isFree?: boolean;
  demoStatus?: string;
  sort?: 'relevance' | 'popularity' | 'newest' | 'most_wishlisted';
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    q: string,
    filters: SearchFilters = {},
    page = 1,
    pageSize = 10,
  ) {
    const term = q.trim();
    const skip = (page - 1) * pageSize;
    const cappedSize = Math.min(pageSize, 50);

    const gameWhere: Prisma.GameWhereInput = this.buildGameWhere(term, filters);

    const [games, gamesTotal, studios, studiosTotal, devlogs, devlogsTotal] =
      await Promise.all([
        this.prisma.game.findMany({
          where: gameWhere,
          select: {
            id: true,
            title: true,
            slug: true,
            tagline: true,
            coverUrl: true,
            status: true,
            genres: true,
            engine: true,
            isFree: true,
            priceCents: true,
            followersCount: true,
            wishlistsCount: true,
            createdAt: true,
            studio: { select: { id: true, name: true, slug: true, logoUrl: true } },
          },
          skip,
          take: cappedSize,
          orderBy: this.buildSort(filters.sort),
        }),
        this.prisma.game.count({ where: gameWhere }),
        this.prisma.studio.findMany({
          where: {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { tagline: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
            ],
          },
          select: { id: true, name: true, slug: true, logoUrl: true, tagline: true },
          skip,
          take: cappedSize,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.studio.count({
          where: {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { tagline: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
            ],
          },
        }),
        this.prisma.devlog.findMany({
          where: {
            isPublished: true,
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { body: { contains: term, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true, title: true, slug: true, publishedAt: true,
            game: { select: { id: true, title: true, slug: true } },
          },
          skip,
          take: cappedSize,
          orderBy: { publishedAt: 'desc' },
        }),
        this.prisma.devlog.count({
          where: {
            isPublished: true,
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { body: { contains: term, mode: 'insensitive' } },
            ],
          },
        }),
      ]);

    const hasMore = skip + cappedSize < gamesTotal;

    return {
      games: { items: games, total: gamesTotal },
      studios: { items: studios, total: studiosTotal },
      devlogs: { items: devlogs, total: devlogsTotal },
      query: term,
      page,
      pageSize: cappedSize,
      hasMore,
      nextPage: hasMore ? page + 1 : null,
    };
  }

  private buildGameWhere(term: string, filters: SearchFilters): Prisma.GameWhereInput {
    const and: Prisma.GameWhereInput[] = [];

    // Text search on games
    if (term) {
      and.push({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { tagline: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { genres: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    // Filters
    if (filters.genre) {
      and.push({ genres: { contains: filters.genre, mode: 'insensitive' } });
    }
    if (filters.status) {
      and.push({ status: filters.status as GameStatus });
    }
    if (filters.platform) {
      // Platform links are in PlatformLink model — query via game id
      // Filter after initial fetch if needed
    }
    if (filters.tag) {
      and.push({ tags: { some: { tag: { name: filters.tag } } } });
    }
    if (filters.engine) {
      and.push({ engine: { contains: filters.engine, mode: 'insensitive' } });
    }
    if (filters.isFree !== undefined) {
      and.push({ isFree: filters.isFree });
    }
    if (filters.demoStatus) {
      and.push({ demoStatus: filters.demoStatus });
    }

    return and.length > 0 ? { AND: and } : {};
  }

  private buildSort(sort?: string): Prisma.GameOrderByWithRelationInput {
    switch (sort) {
      case 'popularity': return { followersCount: 'desc' };
      case 'newest': return { createdAt: 'desc' };
      case 'most_wishlisted': return { wishlistsCount: 'desc' };
      case 'relevance':
      default:
        return { createdAt: 'desc' };
    }
  }
}
