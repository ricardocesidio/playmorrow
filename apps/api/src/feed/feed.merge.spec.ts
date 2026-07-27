import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { EventBusModule } from '../common/event-bus.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MockEmailModule } from '../test/mock-email-service';
import { FeedModule } from './feed.module';
import { FeedService } from './feed.service';

const SUFFIX = `mg-${Date.now()}`;

describe('FeedService merge pagination bug', () => {
  vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

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
        MockEmailModule,
        NotificationsModule,
        FeedModule,
      ],
    }).compile();

    prisma = app.get(PrismaService);
    feedService = app.get(FeedService);

    const user = await prisma.user.create({
      data: {
        email: `usr_${SUFFIX}@example.com`,
        username: `usr_${SUFFIX}`,
        displayName: `User ${SUFFIX}`,
        passwordHash: 'not-a-real-hash',
        emailVerifiedAt: new Date(),
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

    const now = Date.now();
    const devlogData = Array.from({ length: 900 }, (_, i) => ({
      gameId: game.id,
      authorId: user.id,
      title: `Merge Test Devlog ${i}`,
      slug: `merge-devlog-${SUFFIX}-${i}`,
      body: `Body for devlog ${i}`,
      isPublished: true,
      publishedAt: new Date(now - i * 60_000),
      createdAt: new Date(now - i * 60_000),
    }));
    await prisma.devlog.createMany({ data: devlogData });

    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const roadmapData = Array.from({ length: 10 }, (_, i) => ({
      gameId: game.id,
      title: `Merge Test Roadmap ${i}`,
      status: 'PLANNED' as const,
      position: i,
      createdAt: new Date(thirtyDaysAgo.getTime() - i * 60_000),
      updatedAt: new Date(thirtyDaysAgo.getTime() - i * 60_000),
    }));
    await prisma.roadmapItem.createMany({ data: roadmapData });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.follow.deleteMany({ where: { userId } });
      await prisma.roadmapItem.deleteMany({ where: { gameId } });
      await prisma.devlog.deleteMany({ where: { gameId } });
      await prisma.game.deleteMany({ where: { id: gameId } });
      await prisma.studio.deleteMany({ where: { id: studioId } });
      await prisma.user.deleteMany({ where: { id: userId } });
      await prisma.$disconnect();
    }
  });

  it('should return items sorted by createdAt DESC on page 3 with both types present', async () => {
    const result = await feedService.getPersonalFeed(userId, 3, 20, 'all');

    const dates = result.items.map((i) => new Date(i.createdAt).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
    }

    const types = new Set(result.items.map((i) => i.type));
    expect(types.has('DEVLOG')).toBe(true);
    expect(types.has('ROADMAP_ITEM')).toBe(true);
  });
});
