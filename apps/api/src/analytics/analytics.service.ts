import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AnalyticsEventInput {
  eventType: string;
  gameId?: string;
  studioId?: string;
  userId?: string;
  sessionId?: string;
  metadata?: any;
  ip?: string;
  referrer?: string;
  userAgent?: string;
}

export interface GameAnalytics {
  views: number;
  uniqueVisitors: number;
  wishlists: number;
  followers: number;
  comments: number;
  growth: {
    views: number;
    wishlists: number;
    followers: number;
    comments: number;
  };
  period: string;
}

export interface StudioAnalytics {
  totalViews: number;
  totalWishlists: number;
  totalFollowers: number;
  totalComments: number;
  gameCount: number;
  memberCount: number;
  topGames: TopGame[];
  period: string;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface TopGame {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  views: number;
  followers: number;
  wishlists: number;
}

export interface TrafficSource {
  source: string;
  count: number;
}

export interface CountryStat {
  country: string;
  count: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(event: AnalyticsEventInput): Promise<void> {
    await this.prisma.analyticsEvent.create({
      data: {
        eventType: event.eventType,
        gameId: event.gameId ?? null,
        studioId: event.studioId ?? null,
        userId: event.userId ?? null,
        sessionId: event.sessionId ?? null,
        metadata: event.metadata ?? undefined,
        ip: event.ip ?? null,
        referrer: event.referrer ?? null,
        userAgent: event.userAgent ?? null,
      },
    });
  }

  async getGameStats(
    gameId: string,
    period: '7d' | '30d' | '90d' | 'all' = '30d',
  ): Promise<GameAnalytics> {
    const { currentStart, previousStart, previousEnd } = this.getPeriodRanges(period);

    const currentFilter = currentStart ? { timestamp: { gte: currentStart } } : {};
    const previousFilter = previousStart
      ? { timestamp: { gte: previousStart, ...(previousEnd ? { lt: previousEnd } : {}) } }
      : {};

    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        followersCount: true,
        wishlistsCount: true,
        commentsCount: true,
      },
    });

    if (!game) {
      return {
        views: 0,
        uniqueVisitors: 0,
        wishlists: 0,
        followers: 0,
        comments: 0,
        growth: { views: 0, wishlists: 0, followers: 0, comments: 0 },
        period,
      };
    }

    const [
      views,
      viewsPrevious,
      wishlistsCurrent,
      wishlistsPrevious,
      followersCurrent,
      followersPrevious,
      commentsCurrent,
      commentsPrevious,
      uniqueSessions,
    ] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: { ...currentFilter, gameId, eventType: 'game_view' },
      }),
      period !== 'all'
        ? this.prisma.analyticsEvent.count({
            where: { ...previousFilter, gameId, eventType: 'game_view' },
          })
        : Promise.resolve(0),
      this.prisma.wishlistItem.count({
        where: { gameId, ...(currentStart ? { createdAt: { gte: currentStart } } : {}) },
      }),
      period !== 'all' && previousStart
        ? this.prisma.wishlistItem.count({
            where: { gameId, createdAt: { gte: previousStart, ...(previousEnd ? { lt: previousEnd } : {}) } },
          })
        : Promise.resolve(0),
      this.prisma.follow.count({
        where: { gameId, ...(currentStart ? { createdAt: { gte: currentStart } } : {}) },
      }),
      period !== 'all' && previousStart
        ? this.prisma.follow.count({
            where: { gameId, createdAt: { gte: previousStart, ...(previousEnd ? { lt: previousEnd } : {}) } },
          })
        : Promise.resolve(0),
      this.prisma.comment.count({
        where: { gameId, ...(currentStart ? { createdAt: { gte: currentStart } } : {}) },
      }),
      period !== 'all' && previousStart
        ? this.prisma.comment.count({
            where: { gameId, createdAt: { gte: previousStart, ...(previousEnd ? { lt: previousEnd } : {}) } },
          })
        : Promise.resolve(0),
      this.prisma.analyticsEvent.findMany({
        where: { ...currentFilter, gameId, eventType: 'game_view', sessionId: { not: null } },
        select: { sessionId: true },
        distinct: ['sessionId'],
      }),
    ]);

    return {
      views,
      uniqueVisitors: uniqueSessions.length,
      wishlists: game.wishlistsCount,
      followers: game.followersCount,
      comments: game.commentsCount,
      growth: {
        views: this.calcGrowth(views, viewsPrevious),
        wishlists: this.calcGrowth(wishlistsCurrent, wishlistsPrevious),
        followers: this.calcGrowth(followersCurrent, followersPrevious),
        comments: this.calcGrowth(commentsCurrent, commentsPrevious),
      },
      period,
    };
  }

  async getStudioStats(
    studioId: string,
    period: '7d' | '30d' | '90d' | 'all' = '30d',
  ): Promise<StudioAnalytics> {
    const { currentStart } = this.getPeriodRanges(period);

    const games = await this.prisma.game.findMany({
      where: { studioId },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        viewsCount: true,
        wishlistsCount: true,
        followersCount: true,
        commentsCount: true,
      },
    });

    const studio = await this.prisma.studio.findUnique({
      where: { id: studioId },
      select: { _count: { select: { members: true } } },
    });

    const gameIds = games.map((g) => g.id);

    const viewCounts = gameIds.length > 0
      ? await this.prisma.analyticsEvent.groupBy({
          by: ['gameId'],
          where: {
            gameId: { in: gameIds },
            eventType: 'game_view',
            ...(currentStart ? { timestamp: { gte: currentStart } } : {}),
          },
          _count: { id: true },
        })
      : [];

    const viewCountMap = new Map(viewCounts.map((v) => [v.gameId, v._count.id]));

    const topGamesData = games.map((g) => ({
      id: g.id,
      title: g.title,
      slug: g.slug,
      coverUrl: g.coverUrl,
      views: viewCountMap.get(g.id) ?? 0,
      followers: g.followersCount,
      wishlists: g.wishlistsCount,
    }));

    topGamesData.sort((a, b) => b.views - a.views);

    return {
      totalViews: games.reduce((s, g) => s + g.viewsCount, 0),
      totalWishlists: games.reduce((s, g) => s + g.wishlistsCount, 0),
      totalFollowers: games.reduce((s, g) => s + g.followersCount, 0),
      totalComments: games.reduce((s, g) => s + g.commentsCount, 0),
      gameCount: games.length,
      memberCount: studio?._count?.members ?? 0,
      topGames: topGamesData,
      period,
    };
  }

  async getTimeSeries(
    gameId: string,
    eventType: string,
    days: number,
  ): Promise<TimeSeriesPoint[]> {
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        gameId,
        eventType,
        timestamp: { gte: start },
      },
      select: { timestamp: true },
      orderBy: { timestamp: 'asc' },
    });

    const dayMap = new Map<string, number>();
    for (const e of events) {
      const key = e.timestamp.toISOString().slice(0, 10);
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }

    const points: TimeSeriesPoint[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i + 1);
      const key = d.toISOString().slice(0, 10);
      points.push({ date: key, count: dayMap.get(key) ?? 0 });
    }

    return points;
  }

  async getTopGames(studioId: string): Promise<TopGame[]> {
    const games = await this.prisma.game.findMany({
      where: { studioId },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        viewsCount: true,
        followersCount: true,
        wishlistsCount: true,
      },
    });

    const top: TopGame[] = games.map((g) => ({
      id: g.id,
      title: g.title,
      slug: g.slug,
      coverUrl: g.coverUrl,
      views: g.viewsCount,
      followers: g.followersCount,
      wishlists: g.wishlistsCount,
    }));

    top.sort((a, b) => b.views - a.views);
    return top.slice(0, 10);
  }

  async getTrafficSources(gameId: string): Promise<TrafficSource[]> {
    const groups = await this.prisma.analyticsEvent.groupBy({
      by: ['referrer'],
      where: { gameId, eventType: 'game_view' },
      _count: true,
    });

    const sources: TrafficSource[] = groups.map((g) => ({
      source: g.referrer || 'direct',
      count: g._count,
    }));

    sources.sort((a, b) => b.count - a.count);
    return sources;
  }

  async getCountries(gameId: string): Promise<CountryStat[]> {
    const groups = await this.prisma.analyticsEvent.groupBy({
      by: ['country'],
      where: { gameId, eventType: 'game_view', country: { not: null } },
      _count: true,
    });

    const stats: CountryStat[] = groups.map((g) => ({
      country: g.country!,
      count: g._count,
    }));

    stats.sort((a, b) => b.count - a.count);
    return stats;
  }

  async runDailyAggregation(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const eventTypes = await this.prisma.analyticsEvent.groupBy({
      by: ['eventType', 'gameId', 'studioId'],
      where: {
        timestamp: { gte: startOfDay, lt: endOfDay },
      },
      _count: true,
    });

    const allDistinctSessions = eventTypes.length > 0
      ? await this.prisma.analyticsEvent.findMany({
          where: {
            timestamp: { gte: startOfDay, lt: endOfDay },
            sessionId: { not: null },
          },
          select: { eventType: true, gameId: true, studioId: true, sessionId: true },
          distinct: ['eventType', 'gameId', 'studioId', 'sessionId'],
        })
      : [];

    const uniqueCountMap = new Map<string, number>();
    for (const row of allDistinctSessions) {
      const key = `${row.eventType}:${row.gameId ?? ''}:${row.studioId ?? ''}`;
      uniqueCountMap.set(key, (uniqueCountMap.get(key) ?? 0) + 1);
    }

    for (const group of eventTypes) {
      const key = `${group.eventType}:${group.gameId ?? ''}:${group.studioId ?? ''}`;
      const uniqueCount = uniqueCountMap.get(key) ?? 0;

      await this.prisma.analyticsDailyAggregate.upsert({
        where: {
          date_gameId_studioId_eventType: {
            date: startOfDay,
            gameId: group.gameId ?? '',
            studioId: group.studioId ?? '',
            eventType: group.eventType,
          },
        },
        create: {
          date: startOfDay,
          gameId: group.gameId,
          studioId: group.studioId,
          eventType: group.eventType,
          count: group._count,
          uniqueCount,
        },
        update: {
          count: group._count,
          uniqueCount,
        },
      });
    }
  }

  private getPeriodRanges(period: '7d' | '30d' | '90d' | 'all'): {
    currentStart: Date | null;
    previousStart: Date | null;
    previousEnd: Date | null;
  } {
    if (period === 'all') {
      return { currentStart: null, previousStart: null, previousEnd: null };
    }

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const now = new Date();

    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - days);
    currentStart.setHours(0, 0, 0, 0);

    const previousEnd = new Date(currentStart);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - days);

    return { currentStart, previousStart, previousEnd };
  }

  private calcGrowth(current: number, previous: number): number {
    if (previous === 0 && current === 0) return 0;
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  }
}
