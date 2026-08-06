import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { StudioWeeklyReport } from '@playmorrow/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WeeklyReportsService {
  constructor(private prisma: PrismaService) {}

  async generate(studioId: string): Promise<void> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    const studio = await this.prisma.studio.findUnique({
      where: { id: studioId },
      include: { games: { select: { id: true, title: true } } },
    });
    if (!studio) return;

    const gameIds = studio.games.map((g) => g.id);

    const [viewsResult, viewsUnique, followersChange, wishlistsChange, devlogCount, activityCount] =
      await Promise.all([
        this.prisma.analyticsEvent.count({
          where: { gameId: { in: gameIds }, eventType: 'game_view', timestamp: { gte: weekStart, lte: weekEnd } },
        }),
        this.prisma.analyticsEvent.groupBy({
          by: ['sessionId'],
          where: { gameId: { in: gameIds }, eventType: 'game_view', timestamp: { gte: weekStart, lte: weekEnd } },
          _count: { sessionId: true },
        }),
        this.prisma.follow.count({
          where: { studioId, createdAt: { gte: weekStart, lte: weekEnd } },
        }),
        this.prisma.wishlistItem.count({
          where: { game: { studioId }, createdAt: { gte: weekStart, lte: weekEnd } },
        }),
        this.prisma.devlog.count({
          where: { game: { studioId }, isPublished: true, publishedAt: { gte: weekStart, lte: weekEnd } },
        }),
        this.prisma.activityEvent.count({
          where: { studioId, createdAt: { gte: weekStart, lte: weekEnd } },
        }),
      ]);

    const topCountries = await this.prisma.analyticsEvent.groupBy({
      by: ['country'],
      where: { gameId: { in: gameIds }, timestamp: { gte: weekStart, lte: weekEnd }, country: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topSources = await this.prisma.analyticsEvent.groupBy({
      by: ['referrer'],
      where: { gameId: { in: gameIds }, timestamp: { gte: weekStart, lte: weekEnd }, referrer: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const data = {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      views: viewsResult,
      uniqueViewers: viewsUnique.length,
      newFollowers: followersChange,
      newWishlists: wishlistsChange,
      devlogsPublished: devlogCount,
      activities: activityCount,
      topCountries: topCountries.map((c) => ({ country: c.country, count: c._count.id })),
      topSources: topSources.map((s) => ({ source: s.referrer, count: s._count.id })),
    };

    const existing = await this.prisma.studioWeeklyReport.findFirst({
      where: { studioId, weekStart, weekEnd },
    });

    if (existing) {
      await this.prisma.studioWeeklyReport.update({
        where: { id: existing.id },
        data: { data, isDelivered: false, deliveredAt: null },
      });
    } else {
      await this.prisma.studioWeeklyReport.create({
        data: { studioId, weekStart, weekEnd, data, isDelivered: false },
      });
    }
  }

  async getReport(studioId: string): Promise<StudioWeeklyReport | null> {
    return this.prisma.studioWeeklyReport.findFirst({
      where: { studioId },
      orderBy: { weekStart: 'desc' },
    });
  }

  async getReports(studioId: string): Promise<StudioWeeklyReport[]> {
    return this.prisma.studioWeeklyReport.findMany({
      where: { studioId },
      orderBy: { weekStart: 'desc' },
      take: 12,
    });
  }

  @Cron('0 8 * * 1')
  async generateAll(): Promise<void> {
    const studios = await this.prisma.studio.findMany({ select: { id: true } });
    for (const studio of studios) {
      await this.generate(studio.id).catch(() => {});
    }
  }
}
