import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { DevlogsModule } from '../devlogs/devlogs.module';
import { FollowsModule } from '../follows/follows.module';
import { GamesModule } from '../games/games.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { RoadmapItemsModule } from '../roadmap-items/roadmap-items.module';
import { StudiosModule } from '../studios/studios.module';
import { UsersModule } from '../users/users.module';
import { FeedModule } from './feed.module';
import { MockEmailModule } from '../test/mock-email-service';
import { registerTestUser } from '../test/register-test-user';
import { createTestApp } from '../test/create-test-app';

const SUFFIX = `fd-${Date.now()}`;
const USER_EMAIL = `usr_${SUFFIX}@example.com`;
const PASSWORD = 'StrongPass123!';
const STUDIO_SLUG = `studio-${SUFFIX}`;
const GAME_SLUG = `game-${SUFFIX}`;
const GAME2_SLUG = `game2-${SUFFIX}`;

function cleanEmail(e: string) {
  return e.toLowerCase();
}

describe('FeedController (e2e)', () => {
  let httpServer: unknown;
  let prisma: PrismaService;
  let userToken: string;

  beforeAll(async () => {
    const result = await createTestApp(
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', 'apps/api/.env'] }),
          PrismaModule,
          UsersModule,
          AuthModule,
          StudiosModule,
          GamesModule,
          DevlogsModule,
          RoadmapItemsModule,
          FeedModule,
          FollowsModule,
          NotificationsModule,
          MockEmailModule,
          ScheduleModule.forRoot(),
        ],
      }),
    );
    httpServer = result.httpServer;
    prisma = result.app.get(PrismaService);

    // Register user, create studio, games, devlogs, roadmap
    const user = await registerTestUser(httpServer, prisma, USER_EMAIL, PASSWORD);
    userToken = user.sessionCookie;

    const studioRes = await request(httpServer)
      .post('/api/studios')
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ name: 'Feed Test Studio', slug: STUDIO_SLUG });
    if (studioRes.status !== 201) {
      throw new Error(`Feed setup: create studio returned ${studioRes.status}: ${JSON.stringify(studioRes.body)}`);
    }

    const gameRes = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Feed Test Game', slug: GAME_SLUG });
    if (gameRes.status !== 201) {
      throw new Error(`Feed setup: create game returned ${gameRes.status}: ${JSON.stringify(gameRes.body)}`);
    }

    const game2Res = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Feed Game 2', slug: GAME2_SLUG });
    if (game2Res.status !== 201) {
      throw new Error(`Feed setup: create game2 returned ${game2Res.status}: ${JSON.stringify(game2Res.body)}`);
    }

    await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Published Devlog', slug: `pd-${SUFFIX}`, body: 'Published content', isPublished: true });

    await request(httpServer)
      .post(`/api/games/${GAME2_SLUG}/devlogs`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Game2 Devlog', slug: `g2d-${SUFFIX}`, body: 'Game 2 content', isPublished: true });

    await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Draft Devlog', slug: `dd-${SUFFIX}`, body: 'Draft content', isPublished: false });

    await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/roadmap`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Roadmap Item 1', status: 'PLANNED', position: 0 });

    await request(httpServer)
      .post(`/api/games/${GAME2_SLUG}/roadmap`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Roadmap Item 2', status: 'IN_PROGRESS', position: 0 });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.follow.deleteMany({ where: { user: { email: { startsWith: cleanEmail(SUFFIX) } } } });
      await prisma.pressKit.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.roadmapItem.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.devlog.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.gameMedia.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.platformLink.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.gameTag.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.game.deleteMany({ where: { slug: { contains: SUFFIX } } });
      await prisma.studio.deleteMany({ where: { slug: { contains: SUFFIX } } });
      await prisma.user.deleteMany({ where: { email: { startsWith: cleanEmail(SUFFIX) } } });
      await prisma.$disconnect();
    }
  });

  // ── PERSONAL FEED ──────────────────────────────────────────────────────

  it('GET /api/me/feed rejects unauthenticated', async () => {
    const res = await request(httpServer).get('/api/me/feed');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /api/me/feed returns empty when user follows nothing', async () => {
    const res = await request(httpServer)
      .get('/api/me/feed')
      .set('Cookie', `playmorrow_session=${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it('Following studio shows feed content from setup', async () => {
    const followRes = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Cookie', `playmorrow_session=${userToken}`);
    expect(followRes.status).toBe(HttpStatus.OK);

    const res = await request(httpServer)
      .get('/api/me/feed')
      .set('Cookie', `playmorrow_session=${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('Following a game shows that game published devlog', async () => {
    const newSlug = `fgame-${SUFFIX}-t3`;
    const newGameSlug = `g3-${SUFFIX}`;
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Feed Test 3', slug: newGameSlug });
    await request(httpServer)
      .post(`/api/games/${newGameSlug}/devlogs`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Test 3 Devlog', slug: newSlug, body: 'Test 3 body', isPublished: true });

    await request(httpServer)
      .post(`/api/games/${newGameSlug}/follow`)
      .set('Cookie', `playmorrow_session=${userToken}`);

    const res = await request(httpServer)
      .get('/api/me/feed')
      .set('Cookie', `playmorrow_session=${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.some((i: { title: string }) => i.title === 'Test 3 Devlog')).toBe(true);
  });

  it('Following a studio shows published devlogs from games in that studio', async () => {
    const newSlug = `fgame-${SUFFIX}-t4`;
    const newGameSlug = `g4-${SUFFIX}`;
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Feed Test 4', slug: newGameSlug });
    await request(httpServer)
      .post(`/api/games/${newGameSlug}/devlogs`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Test 4 Devlog', slug: newSlug, body: 'Test 4 body', isPublished: true });

    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Cookie', `playmorrow_session=${userToken}`);

    const res = await request(httpServer)
      .get('/api/me/feed')
      .set('Cookie', `playmorrow_session=${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.some((i: { title: string }) => i.title === 'Test 4 Devlog')).toBe(true);
  });

  it('Draft devlogs never appear in /me/feed', async () => {
    const newSlug = `draft-${SUFFIX}-t5`;
    const newGameSlug = `g5-${SUFFIX}`;
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Feed Test 5', slug: newGameSlug });
    await request(httpServer)
      .post(`/api/games/${newGameSlug}/devlogs`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Test 5 Draft', slug: newSlug, body: 'Draft', isPublished: false });

    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Cookie', `playmorrow_session=${userToken}`);

    const res = await request(httpServer)
      .get('/api/me/feed')
      .set('Cookie', `playmorrow_session=${userToken}`);

    expect(res.body.items.some((i: { title: string }) => i.title === 'Test 5 Draft')).toBe(false);
  });

  it('Following a game shows roadmap items from that game', async () => {
    const newGameSlug = `g6-${SUFFIX}`;
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Feed Test 6', slug: newGameSlug });
    await request(httpServer)
      .post(`/api/games/${newGameSlug}/roadmap`)
      .set('Cookie', `playmorrow_session=${userToken}`)
      .send({ title: 'Test 6 Roadmap', status: 'PLANNED', position: 0 });

    await request(httpServer)
      .post(`/api/games/${newGameSlug}/follow`)
      .set('Cookie', `playmorrow_session=${userToken}`);

    const res = await request(httpServer)
      .get('/api/me/feed')
      .set('Cookie', `playmorrow_session=${userToken}`);

    expect(res.body.items.some((i: { title: string }) => i.title === 'Test 6 Roadmap')).toBe(true);
  });

  it('Feed sorts newest first', async () => {
    // Follow studio so we see existing content
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Cookie', `playmorrow_session=${userToken}`);

    const res = await request(httpServer)
      .get('/api/me/feed')
      .set('Cookie', `playmorrow_session=${userToken}`);

    expect(res.body.items.length).toBeGreaterThan(0);
    const dates = res.body.items.map((i: { createdAt: string }) => new Date(i.createdAt).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
    }
  });

  it('Feed supports type=devlogs', async () => {
    // Clean previous follows and re-follow studio
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Cookie', `playmorrow_session=${userToken}`);

    const res = await request(httpServer)
      .get('/api/me/feed?type=devlogs')
      .set('Cookie', `playmorrow_session=${userToken}`);

    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items.every((i: { type: string }) => i.type === 'DEVLOG')).toBe(true);
  });

  it('Feed supports type=roadmap', async () => {
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Cookie', `playmorrow_session=${userToken}`);

    const res = await request(httpServer)
      .get('/api/me/feed?type=roadmap')
      .set('Cookie', `playmorrow_session=${userToken}`);

    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items.every((i: { type: string }) => i.type === 'ROADMAP_ITEM')).toBe(true);
  });

  it('Feed supports pagination', async () => {
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Cookie', `playmorrow_session=${userToken}`);

    const res = await request(httpServer)
      .get('/api/me/feed?page=1&pageSize=1')
      .set('Cookie', `playmorrow_session=${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.length).toBeLessThanOrEqual(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(1);
  });

  it('pageSize is capped at 50', async () => {
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Cookie', `playmorrow_session=${userToken}`);

    const res = await request(httpServer)
      .get('/api/me/feed?pageSize=100')
      .set('Cookie', `playmorrow_session=${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.length).toBeLessThanOrEqual(50);
  });

  // ── PUBLIC FEED ────────────────────────────────────────────────────────

  it('GET /api/feed/public returns latest published devlogs', async () => {
    const res = await request(httpServer).get('/api/feed/public');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.some((i: { title: string }) => i.title === 'Published Devlog')).toBe(true);
  });

  it('GET /api/feed/public returns roadmap items', async () => {
    const res = await request(httpServer).get('/api/feed/public');
    expect(res.body.items.some((i: { title: string }) => i.title === 'Roadmap Item 1')).toBe(true);
  });

  it('GET /api/feed/public excludes draft devlogs', async () => {
    const res = await request(httpServer).get('/api/feed/public');
    const draftFound = res.body.items.some((i: { title: string }) => i.title === 'Draft Devlog');
    expect(draftFound).toBe(false);
  });

  it('GET /api/feed/public supports type filters', async () => {
    const devlogRes = await request(httpServer).get('/api/feed/public?type=devlogs');
    expect(devlogRes.body.items.every((i: { type: string }) => i.type === 'DEVLOG')).toBe(true);

    const roadmapRes = await request(httpServer).get('/api/feed/public?type=roadmap');
    expect(roadmapRes.body.items.every((i: { type: string }) => i.type === 'ROADMAP_ITEM')).toBe(true);
  });

  it('GET /api/feed/public supports pagination', async () => {
    const res = await request(httpServer).get('/api/feed/public?page=1&pageSize=1');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.length).toBeLessThanOrEqual(1);
  });

  // ── RESPONSE SHAPE ─────────────────────────────────────────────────────

  it('Feed responses include game summary', async () => {
    const res = await request(httpServer)
      .get('/api/me/feed')
      .set('Cookie', `playmorrow_session=${userToken}`);

    for (const item of res.body.items) {
      expect(item.game).toBeDefined();
      expect(item.game.title).toBeTruthy();
      expect(item.game.slug).toBeTruthy();
    }
  });

  it('Feed responses include studio summary', async () => {
    const res = await request(httpServer)
      .get('/api/me/feed')
      .set('Cookie', `playmorrow_session=${userToken}`);

    for (const item of res.body.items) {
      expect(item.studio).toBeDefined();
      expect(item.studio.name).toBeTruthy();
      expect(item.studio.slug).toBeTruthy();
    }
  });

  it('Response never exposes passwordHash', async () => {
    const res = await request(httpServer)
      .get('/api/me/feed')
      .set('Cookie', `playmorrow_session=${userToken}`);

    expect(res.body.passwordHash).toBeUndefined();
    for (const item of res.body.items) {
      expect(item.passwordHash).toBeUndefined();
    }
  });
});
