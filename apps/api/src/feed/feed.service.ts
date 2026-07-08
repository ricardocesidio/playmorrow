import { Injectable } from '@nestjs/common';
import type { Prisma } from '@playmorrow/database';

import { PrismaService } from '../prisma/prisma.service';

interface FeedItem {
  id: string;
  type: 'DEVLOG' | 'ROADMAP_ITEM';
  createdAt: string;
  publishedAt: string | null;
  title: string;
  summary: string;
  status?: string;
  targetDate?: string | null;
  game: { id: string; title: string; slug: string; coverUrl: string | null };
  studio: { id: string; name: string; slug: string; logoUrl: string | null };
  target: { kind: 'DEVLOG' | 'ROADMAP_ITEM'; id: string };
}

export interface FeedResult {
  items: FeedItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const DEVLOG_FEED_INCLUDE = {
  game: {
    select: { id: true, title: true, slug: true, coverUrl: true, studioId: true },
  },
} satisfies Prisma.DevlogInclude;

const ROADMAP_FEED_INCLUDE = {
  game: {
    select: { id: true, title: true, slug: true, coverUrl: true, studioId: true },
  },
} satisfies Prisma.RoadmapItemInclude;

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getPersonalFeed(
    userId: string,
    page: number,
    pageSize: number,
    type: 'all' | 'devlogs' | 'roadmap',
  ): Promise<FeedResult> {
    const cappedSize = Math.min(pageSize, 50);

    // Resolve followed studio IDs and game IDs
    const follows = await this.prisma.follow.findMany({
      where: { userId },
      select: { targetType: true, studioId: true, gameId: true },
    });

    const followedStudioIds = follows
      .filter((f) => f.targetType === 'STUDIO' && f.studioId)
      .map((f) => f.studioId!);

    const followedGameIds = follows
      .filter((f) => f.targetType === 'GAME' && f.gameId)
      .map((f) => f.gameId!);

    // Find games belonging to followed studios
    const studioGames = followedStudioIds.length > 0
      ? await this.prisma.game.findMany({
          where: { studioId: { in: followedStudioIds } },
          select: { id: true },
        })
      : [];

    const allGameIds = new Set([
      ...followedGameIds,
      ...studioGames.map((g) => g.id),
    ]);

    if (allGameIds.size === 0) {
      return { items: [], total: 0, page, pageSize: cappedSize, hasMore: false };
    }

    const gameIdArray = Array.from(allGameIds);

    if (gameIdArray.length === 0) {
      return { items: [], total: 0, page, pageSize: cappedSize, hasMore: false };
    }

    // Fetch devlogs and roadmap items
    const [devlogs, roadmapItems] = await Promise.all([
      type !== 'roadmap'
        ? this.prisma.devlog.findMany({
            where: { gameId: { in: gameIdArray }, isPublished: true },
            include: DEVLOG_FEED_INCLUDE,
            orderBy: { publishedAt: 'desc' },
          })
        : Promise.resolve([]),
      type !== 'devlogs'
        ? this.prisma.roadmapItem.findMany({
            where: { gameId: { in: gameIdArray } },
            include: ROADMAP_FEED_INCLUDE,
            orderBy: { updatedAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    // Resolve studio info for all unique game IDs
    const gameIds = new Set<string>();
    for (const d of devlogs) gameIds.add(d.gameId);
    for (const r of roadmapItems) gameIds.add(r.gameId);

    const gamesWithStudio = gameIds.size > 0
      ? await this.prisma.game.findMany({
          where: { id: { in: Array.from(gameIds) } },
          select: { id: true, studio: { select: { id: true, name: true, slug: true, logoUrl: true } } },
        })
      : [];
    const studioMap = new Map(gamesWithStudio.map((g) => [g.id, g.studio]));

    // Build feed items
    const feedItems: FeedItem[] = [];

    for (const d of devlogs) {
      const studio = studioMap.get(d.gameId);
      feedItems.push({
        id: d.id,
        type: 'DEVLOG',
        createdAt: d.createdAt.toISOString(),
        publishedAt: d.publishedAt?.toISOString() ?? null,
        title: d.title,
        summary: d.body.length > 200 ? `${d.body.slice(0, 200)}...` : d.body,
        game: { id: d.game.id, title: d.game.title, slug: d.game.slug, coverUrl: d.game.coverUrl },
        studio: studio ?? { id: d.game.studioId, name: '', slug: '', logoUrl: null },
        target: { kind: 'DEVLOG', id: d.id },
      });
    }

    for (const r of roadmapItems) {
      const studio = studioMap.get(r.gameId);
      feedItems.push({
        id: r.id,
        type: 'ROADMAP_ITEM',
        createdAt: r.createdAt.toISOString(),
        publishedAt: null,
        title: r.title,
        summary: r.description ?? '',
        status: r.status,
        targetDate: r.targetDate?.toISOString() ?? null,
        game: { id: r.game.id, title: r.game.title, slug: r.game.slug, coverUrl: r.game.coverUrl },
        studio: studio ?? { id: r.game.studioId, name: '', slug: '', logoUrl: null },
        target: { kind: 'ROADMAP_ITEM', id: r.id },
      });
    }

    // Sort: use publishedAt for devlogs, updatedAt for roadmap (but we don't have updatedAt in the query)
    // Better to use createdAt as the common sort key
    feedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = feedItems.length;
    const start = (page - 1) * cappedSize;
    const paged = feedItems.slice(start, start + cappedSize);

    return {
      items: paged,
      total,
      page,
      pageSize: cappedSize,
      hasMore: start + cappedSize < total,
    };
  }

  async getPublicFeed(
    page: number,
    pageSize: number,
    type: 'all' | 'devlogs' | 'roadmap',
  ): Promise<FeedResult> {
    const cappedSize = Math.min(pageSize, 50);

    const [devlogs, roadmapItems] = await Promise.all([
      type !== 'roadmap'
        ? this.prisma.devlog.findMany({
            where: { isPublished: true },
            include: DEVLOG_FEED_INCLUDE,
            orderBy: { publishedAt: 'desc' },
            take: type === 'all' ? cappedSize * 2 : cappedSize,
          })
        : Promise.resolve([]),
      type !== 'devlogs'
        ? this.prisma.roadmapItem.findMany({
            include: ROADMAP_FEED_INCLUDE,
            orderBy: { updatedAt: 'desc' },
            take: type === 'all' ? cappedSize * 2 : cappedSize,
          })
        : Promise.resolve([]),
    ]);

    // Resolve studio info
    const gameIds = new Set<string>();
    for (const d of devlogs) gameIds.add(d.gameId);
    for (const r of roadmapItems) gameIds.add(r.gameId);

    const gamesWithStudio = gameIds.size > 0
      ? await this.prisma.game.findMany({
          where: { id: { in: Array.from(gameIds) } },
          select: { id: true, studio: { select: { id: true, name: true, slug: true, logoUrl: true } } },
        })
      : [];
    const studioMap = new Map(gamesWithStudio.map((g) => [g.id, g.studio]));

    const feedItems: FeedItem[] = [];

    for (const d of devlogs) {
      const studio = studioMap.get(d.gameId);
      feedItems.push({
        id: d.id,
        type: 'DEVLOG',
        createdAt: d.createdAt.toISOString(),
        publishedAt: d.publishedAt?.toISOString() ?? null,
        title: d.title,
        summary: d.body.length > 200 ? `${d.body.slice(0, 200)}...` : d.body,
        game: { id: d.game.id, title: d.game.title, slug: d.game.slug, coverUrl: d.game.coverUrl },
        studio: studio ?? { id: d.game.studioId, name: '', slug: '', logoUrl: null },
        target: { kind: 'DEVLOG', id: d.id },
      });
    }

    for (const r of roadmapItems) {
      const studio = studioMap.get(r.gameId);
      feedItems.push({
        id: r.id,
        type: 'ROADMAP_ITEM',
        createdAt: r.createdAt.toISOString(),
        publishedAt: null,
        title: r.title,
        summary: r.description ?? '',
        status: r.status,
        targetDate: r.targetDate?.toISOString() ?? null,
        game: { id: r.game.id, title: r.game.title, slug: r.game.slug, coverUrl: r.game.coverUrl },
        studio: studio ?? { id: r.game.studioId, name: '', slug: '', logoUrl: null },
        target: { kind: 'ROADMAP_ITEM', id: r.id },
      });
    }

    feedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = feedItems.length;
    const start = (page - 1) * cappedSize;
    const paged = feedItems.slice(start, start + cappedSize);

    return {
      items: paged,
      total,
      page,
      pageSize: cappedSize,
      hasMore: start + cappedSize < total,
    };
  }

  async getFeedEvents(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.feedEvent.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.feedEvent.count(),
    ]);
    return { items, total, page, pageSize, hasMore: skip + pageSize < total };
  }
}
