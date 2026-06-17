import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { AuthModule } from '../auth/auth.module';
import { GamesModule } from '../games/games.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { StudiosModule } from '../studios/studios.module';
import { UsersModule } from '../users/users.module';
import { FollowsModule } from './follows.module';

const SUFFIX = `fw_${Date.now()}`;
const USER_EMAIL = `usr_${SUFFIX}@example.com`;
const USER_USERNAME = `usr_${SUFFIX}`;
const USER2_EMAIL = `usr2_${SUFFIX}@example.com`;
const USER2_USERNAME = `usr2_${SUFFIX}`;
const PASSWORD = 'StrongPass123!';
const STUDIO_SLUG = `studio-${SUFFIX}`;
const GAME_SLUG = `game-${SUFFIX}`;

function cleanEmail(e: string) {
  return e.toLowerCase();
}

describe('FollowsController (e2e)', () => {
  let app: TestingModule;
  let httpServer: unknown;
  let prisma: PrismaService;
  let userToken: string;
  let user2Token: string;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', 'apps/api/.env'] }),
        PrismaModule,
        UsersModule,
        AuthModule,
        StudiosModule,
        GamesModule,
        FollowsModule,
        NotificationsModule,
      ],
    }).compile();

    const nestApp = app.createNestApplication();
    nestApp.setGlobalPrefix('api', { exclude: ['health'] });
    await nestApp.init();
    httpServer = nestApp.getHttpServer();
    prisma = app.get(PrismaService);

    // Register user
    const userRes = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: USER_EMAIL, username: USER_USERNAME, displayName: 'User', password: PASSWORD });
    userToken = userRes.body.accessToken;

    // Register second user
    const user2Res = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: USER2_EMAIL, username: USER2_USERNAME, displayName: 'User2', password: PASSWORD });
    user2Token = user2Res.body.accessToken;

    // Create studio as owner
    await request(httpServer)
      .post('/api/studios')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Follow Test Studio', slug: STUDIO_SLUG });

    // Create game as owner
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Follow Test Game', slug: GAME_SLUG });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.follow.deleteMany({
        where: { user: { email: { startsWith: cleanEmail(SUFFIX) } } },
      });
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

  // ── STUDIO FOLLOW ──────────────────────────────────────────────────────

  it('POST /api/studios/:slug/follow rejects unauthenticated', async () => {
    const res = await request(httpServer).post(`/api/studios/${STUDIO_SLUG}/follow`);
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/studios/:slug/follow follows studio', async () => {
    const res = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.targetType).toBe('STUDIO');
    expect(res.body.isFollowing).toBe(true);
    expect(res.body.followerCount).toBe(1);
  });

  it('POST /api/studios/:slug/follow is idempotent', async () => {
    const res = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.isFollowing).toBe(true);
    expect(res.body.followerCount).toBe(1);
  });

  it('DELETE /api/studios/:slug/follow unfollows studio', async () => {
    const res = await request(httpServer)
      .delete(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.targetType).toBe('STUDIO');
    expect(res.body.isFollowing).toBe(false);
    expect(res.body.followerCount).toBe(0);
  });

  it('DELETE /api/studios/:slug/follow is idempotent', async () => {
    const res = await request(httpServer)
      .delete(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.isFollowing).toBe(false);
    expect(res.body.followerCount).toBe(0);
  });

  it('POST /api/studios/:missing/follow returns 404', async () => {
    const res = await request(httpServer)
      .post('/api/studios/unknown-studio/follow')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ── STUDIO FOLLOW STATUS ───────────────────────────────────────────────

  it('GET /api/studios/:slug/follow-status returns followerCount and isFollowing false publicly', async () => {
    const res = await request(httpServer).get(`/api/studios/${STUDIO_SLUG}/follow-status`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.targetType).toBe('STUDIO');
    expect(res.body.isFollowing).toBe(false);
    expect(res.body.followerCount).toBe(0);
  });

  it('GET /api/studios/:slug/follow-status returns isFollowing true for follower', async () => {
    // Follow first
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Authorization', `Bearer ${userToken}`);

    const res = await request(httpServer)
      .get(`/api/studios/${STUDIO_SLUG}/follow-status`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.isFollowing).toBe(true);
    expect(res.body.followerCount).toBe(1);
  });

  // ── GAME FOLLOW ────────────────────────────────────────────────────────

  it('POST /api/games/:slug/follow rejects unauthenticated', async () => {
    const res = await request(httpServer).post(`/api/games/${GAME_SLUG}/follow`);
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/games/:slug/follow follows game', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/follow`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.targetType).toBe('GAME');
    expect(res.body.isFollowing).toBe(true);
    expect(res.body.followerCount).toBe(1);
  });

  it('POST /api/games/:slug/follow is idempotent', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/follow`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.isFollowing).toBe(true);
    expect(res.body.followerCount).toBe(1);
  });

  it('DELETE /api/games/:slug/follow unfollows game', async () => {
    const res = await request(httpServer)
      .delete(`/api/games/${GAME_SLUG}/follow`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.targetType).toBe('GAME');
    expect(res.body.isFollowing).toBe(false);
    expect(res.body.followerCount).toBe(0);
  });

  it('DELETE /api/games/:slug/follow is idempotent', async () => {
    const res = await request(httpServer)
      .delete(`/api/games/${GAME_SLUG}/follow`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.isFollowing).toBe(false);
    expect(res.body.followerCount).toBe(0);
  });

  it('POST /api/games/:missing/follow returns 404', async () => {
    const res = await request(httpServer)
      .post('/api/games/unknown-game/follow')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ── GAME FOLLOW STATUS ─────────────────────────────────────────────────

  it('GET /api/games/:slug/follow-status returns followerCount and isFollowing false publicly', async () => {
    const res = await request(httpServer).get(`/api/games/${GAME_SLUG}/follow-status`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.targetType).toBe('GAME');
    expect(res.body.isFollowing).toBe(false);
    expect(res.body.followerCount).toBe(0);
  });

  it('GET /api/games/:slug/follow-status returns isFollowing true for follower', async () => {
    // Follow first
    await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/follow`)
      .set('Authorization', `Bearer ${userToken}`);

    const res = await request(httpServer)
      .get(`/api/games/${GAME_SLUG}/follow-status`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.isFollowing).toBe(true);
    expect(res.body.followerCount).toBe(1);
  });

  // ── MY FOLLOWS ─────────────────────────────────────────────────────────

  it('GET /api/me/follows rejects unauthenticated', async () => {
    const res = await request(httpServer).get('/api/me/follows');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /api/me/follows returns followed studios and games', async () => {
    // User should have followed studio + game from previous tests
    const res = await request(httpServer)
      .get('/api/me/follows')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.studios.length).toBeGreaterThanOrEqual(1);
    expect(res.body.studios.some((s: { slug: string }) => s.slug === STUDIO_SLUG)).toBe(true);
    expect(res.body.games.length).toBeGreaterThanOrEqual(1);
    expect(res.body.games.some((g: { slug: string }) => g.slug === GAME_SLUG)).toBe(true);
    expect(res.body.games[0].studio.slug).toBe(STUDIO_SLUG);
  });

  // ── SECURITY ───────────────────────────────────────────────────────────

  it('Follow responses never expose passwordHash', async () => {
    const followRes = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(followRes.body.passwordHash).toBeUndefined();

    const statusRes = await request(httpServer)
      .get(`/api/studios/${STUDIO_SLUG}/follow-status`);
    expect(statusRes.body.passwordHash).toBeUndefined();

    const myRes = await request(httpServer)
      .get('/api/me/follows')
      .set('Authorization', `Bearer ${user2Token}`);
    expect(myRes.body.passwordHash).toBeUndefined();
  });

  // ── EXISTING RESPONSES ─────────────────────────────────────────────────

  it('Existing studio response includes followersCount', async () => {
    const res = await request(httpServer).get(`/api/studios/${STUDIO_SLUG}`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body).toHaveProperty('followersCount');
    expect(typeof res.body.followersCount).toBe('number');
  });

  it('Existing game response includes followersCount', async () => {
    const res = await request(httpServer).get(`/api/games/${GAME_SLUG}`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body).toHaveProperty('followersCount');
    expect(typeof res.body.followersCount).toBe('number');
  });
});
