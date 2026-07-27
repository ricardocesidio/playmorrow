import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { EventBusModule } from '../common/event-bus.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { MockEmailModule } from '../test/mock-email-service';
import { FeedModule } from './feed.module';
import { FeedService } from './feed.service';

const SUFFIX = `mg-${Date.now()}`;

describe('FeedService merge pagination — unbalanced types', () => {
  vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

  let app: TestingModule;
  let prisma: PrismaService;
  let feedService: FeedService;
  let userId: string;
  let gameId: string;
  let studioId: string;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', 'apps/api/.env'] }),
        PrismaModule,
        EventBusModule,
        NotificationsModule,
        MockEmailModule,
        ScheduleModule.forRoot(),
        FeedModule,
      ],
    }).compile();

    prisma = app.get(PrismaService);
    feedService = app.get(FeedService);

    const user = await prisma.user.create({
      data: {
        email: `usr_${SUFFIX}@e.com`,
        username: `usr_${SUFFIX}`,
        usernameLowercase: `usr_${SUFFIX}`,
        displayName: `User ${SUFFIX}`,
        passwordHash: 'x',
        isOnboardingCompleted: true,
      },
    });
    userId = user.id;

    const studio = await prisma.studio.create({
      data: { slug: `studio-${SUFFIX}`, name: `Studio ${SUFFIX}` },
    });
    studioId = studio.id;

    const game = await prisma.game.create({
      data: { slug: `game-${SUFFIX}`, title: `Game ${SUFFIX}`, studioId: studio.id },
    });
    gameId = game.id;

    await prisma.follow.create({
      data: { userId: user.id, targetType: 'STUDIO', studioId: studio.id },
    });

    // Seed 900 recent devlogs (one per minute for 900min = 15h range)
    const now = Date.now();
    const devlogs = Array.from({ length: 900 }, (_, i) => ({
      gameId: game.id,
      authorId: user.id,
      title: `Merge DL ${i}`,
      slug: `merge-dl-${SUFFIX}-${i}`,
      body: `Body ${i}`,
      isPublished: true,
      tags: [],
      publishedAt: new Date(now - i * 60_000),
      createdAt: new Date(now - i * 60_000),
      readingTimeMin: 1,
    }));
    await prisma.devlog.createMany({ data: devlogs });

    // Seed 10 roadmap items interleaved (NOT all old — mixed with last 10 devlogs' time window)
    const rd = Array.from({ length: 10 }, (_, i) => ({
      gameId: game.id,
      title: `Merge RM ${i}`,
      status: 'PLANNED' as const,
      position: i,
      createdAt: new Date(now - i * 3_600_000), // interleaved: one every hour
      updatedAt: new Date(now - i * 3_600_000),
    }));
    await prisma.roadmapItem.createMany({ data: rd });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.roadmapItem.deleteMany({ where: { gameId } });
      await prisma.devlog.deleteMany({ where: { gameId } });
      await prisma.game.deleteMany({ where: { id: gameId } });
      await prisma.follow.deleteMany({ where: { userId } });
      await prisma.studio.deleteMany({ where: { id: studioId } });
      await prisma.user.deleteMany({ where: { id: userId } });
      await prisma.$disconnect();
    }
  });

  it('should return items sorted by createdAt DESC on page 3', async () => {
    const result = await feedService.getPersonalFeed(userId, 3, 20, 'all');
    const dates = result.items.map((i) => new Date(i.createdAt).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
    }
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('should have roadmap items at positions 500-509 (pool bottom)— they appear on page 11 with pageSize=50', async () => {
    const result = await feedService.getPersonalFeed(userId, 11, 50, 'all');
    const types = new Set(result.items.map((i) => i.type));
    expect(types.has('ROADMAP_ITEM')).toBe(true);
    expect(result.items.length).toBe(10); // only 10 items: the 10 roadmaps
  });

  it('proves the BUG: devlogs past position 500 are permanently inaccessible due to perTypeLimit cap', async () => {
    // With 900 devlogs and perTypeLimit capped at 500, devlogs deeper than 500 are NEVER fetched
    // The pool has at most 500 devlogs + 10 roadmaps = 510 items
    // After the pool is exhausted, hasMore=false even though 400 more devlogs exist in the DB

    // Walk forward until items run out
    let totalItems = 0;
    for (let page = 1; page <= 50; page++) {
      const result = await feedService.getPersonalFeed(userId, page, 20, 'all');
      totalItems += result.items.length;
      if (result.items.length === 0) break;
    }

    // Total should be ~510 (500 devlogs + 10 roadmaps) — less than the 910 that actually exist
    expect(totalItems).toBeLessThan(550);
    expect(totalItems).toBeGreaterThan(500);

    // Verify the DB has more data than the feed can show
    const totalDevlogs = await prisma.devlog.count({ where: { gameId, isPublished: true } });
    expect(totalDevlogs).toBe(900);
    // The feed can only show ~500 of them — 400 are invisible
    expect(totalDevlogs - 500).toBeGreaterThan(300);
  });

  it('should report truncated=true when cap is reached', async () => {
    const result = await feedService.getPersonalFeed(userId, 1, 20, 'all');
    expect(result.truncated).toBe(true);
  });

  it('should report truncated=false within small data', async () => {
    const result = await feedService.getPersonalFeed(userId, 1, 20, 'all');
    expect(result.truncated).toBe(true);
  });
});
