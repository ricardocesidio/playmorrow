import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string, page = 1, pageSize = 10) {
    const term = q.trim();
    const skip = (page - 1) * pageSize;

    const [games, gamesTotal, studios, studiosTotal, devlogs, devlogsTotal] =
      await Promise.all([
        this.prisma.game.findMany({
          where: {
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { tagline: { contains: term, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            title: true,
            slug: true,
            tagline: true,
            studio: { select: { id: true, name: true, slug: true } },
          },
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.game.count({
          where: {
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { tagline: { contains: term, mode: 'insensitive' } },
            ],
          },
        }),
        this.prisma.studio.findMany({
          where: {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { tagline: { contains: term, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            tagline: true,
          },
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.studio.count({
          where: {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { tagline: { contains: term, mode: 'insensitive' } },
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
            id: true,
            title: true,
            slug: true,
            publishedAt: true,
            game: { select: { id: true, title: true, slug: true } },
          },
          skip,
          take: pageSize,
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

    return {
      games: { items: games, total: gamesTotal },
      studios: { items: studios, total: studiosTotal },
      devlogs: { items: devlogs, total: devlogsTotal },
      query: term,
      page,
      pageSize,
    };
  }
}
