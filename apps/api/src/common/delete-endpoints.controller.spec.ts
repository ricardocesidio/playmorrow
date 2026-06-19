import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { AuthModule } from '../auth/auth.module';
import { DevlogsModule } from '../devlogs/devlogs.module';
import { GamesModule } from '../games/games.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { RoadmapItemsModule } from '../roadmap-items/roadmap-items.module';
import { StudiosModule } from '../studios/studios.module';
import { UsersModule } from '../users/users.module';

/**
 * Delete endpoints for studio / game / devlog / roadmap item (#19).
 * Verifies ownership enforcement (non-member → 403), success → 200, the entity
 * is gone afterwards (→ 404), and cascade (deleting a game removes its devlogs).
 */
const SUFFIX = `del_${Date.now()}`;
const OWNER_EMAIL = `own_${SUFFIX}@example.com`;
const NON_EMAIL = `non_${SUFFIX}@example.com`;
const PASSWORD = 'StrongPass123!';
const STUDIO_SLUG = `studio-${SUFFIX}`;
const GAME_SLUG = `game-${SUFFIX}`;
const GAME2_SLUG = `game2-${SUFFIX}`;

describe('Delete endpoints (e2e) (#19)', () => {
  let app: TestingModule;
  let httpServer: unknown;
  let prisma: PrismaService;
  let ownerToken: string;
  let nonToken: string;
  let devlogId: string;
  let cascadeDevlogId: string;
  let roadmapId: string;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', 'apps/api/.env'] }),
        PrismaModule,
        UsersModule,
        AuthModule,
        StudiosModule,
        GamesModule,
        DevlogsModule,
        RoadmapItemsModule,
      ],
    }).compile();

    const nestApp = app.createNestApplication();
    nestApp.setGlobalPrefix('api', { exclude: ['health'] });
    await nestApp.init();
    httpServer = nestApp.getHttpServer();
    prisma = app.get(PrismaService);

    const ownerRes = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: OWNER_EMAIL, username: `own_${SUFFIX}`, displayName: 'Owner', password: PASSWORD });
    ownerToken = ownerRes.body.accessToken;

    const nonRes = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: NON_EMAIL, username: `non_${SUFFIX}`, displayName: 'Non', password: PASSWORD });
    nonToken = nonRes.body.accessToken;

    await request(httpServer)
      .post('/api/studios')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Delete Test Studio', slug: STUDIO_SLUG });

    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Delete Test Game', slug: GAME_SLUG });

    const devlogRes = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Doomed Devlog', slug: `dl-${SUFFIX}`, body: 'x', isPublished: true });
    devlogId = devlogRes.body.id;

    const roadmapRes = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/roadmap`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Doomed Item', status: 'PLANNED' });
    roadmapId = roadmapRes.body.id;

    // A second game + devlog to verify game deletion cascades to its devlogs.
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Cascade Game', slug: GAME2_SLUG });
    const cascadeDevlog = await request(httpServer)
      .post(`/api/games/${GAME2_SLUG}/devlogs`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Cascade Devlog', slug: `cdl-${SUFFIX}`, body: 'x', isPublished: true });
    cascadeDevlogId = cascadeDevlog.body.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.studio.deleteMany({ where: { slug: { contains: SUFFIX } } });
      await prisma.user.deleteMany({ where: { email: { contains: SUFFIX } } });
      await prisma.$disconnect();
    }
  });

  // ── Roadmap item ──────────────────────────────────────────────────────
  it('DELETE /api/roadmap-items/:id rejects unauthenticated', async () => {
    const res = await request(httpServer).delete(`/api/roadmap-items/${roadmapId}`);
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('DELETE /api/roadmap-items/:id rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .delete(`/api/roadmap-items/${roadmapId}`)
      .set('Authorization', `Bearer ${nonToken}`);
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('DELETE /api/roadmap-items/:id deletes for owner, then 404', async () => {
    const ok = await request(httpServer)
      .delete(`/api/roadmap-items/${roadmapId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(ok.status).toBe(HttpStatus.OK);

    const gone = await request(httpServer)
      .delete(`/api/roadmap-items/${roadmapId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(gone.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ── Devlog ────────────────────────────────────────────────────────────
  it('DELETE /api/devlogs/:id rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .delete(`/api/devlogs/${devlogId}`)
      .set('Authorization', `Bearer ${nonToken}`);
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('DELETE /api/devlogs/:id deletes for owner, then 404 on fetch', async () => {
    const ok = await request(httpServer)
      .delete(`/api/devlogs/${devlogId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(ok.status).toBe(HttpStatus.OK);

    const gone = await request(httpServer).get(`/api/devlogs/${devlogId}`);
    expect(gone.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ── Game (with cascade) ───────────────────────────────────────────────
  it('DELETE /api/games/:slug rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .delete(`/api/games/${GAME2_SLUG}`)
      .set('Authorization', `Bearer ${nonToken}`);
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('DELETE /api/games/:slug deletes the game and cascades to its devlogs', async () => {
    const ok = await request(httpServer)
      .delete(`/api/games/${GAME2_SLUG}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(ok.status).toBe(HttpStatus.OK);

    const gameGone = await request(httpServer).get(`/api/games/${GAME2_SLUG}`);
    expect(gameGone.status).toBe(HttpStatus.NOT_FOUND);

    const devlogGone = await request(httpServer).get(`/api/devlogs/${cascadeDevlogId}`);
    expect(devlogGone.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ── Studio ────────────────────────────────────────────────────────────
  it('DELETE /api/studios/:slug rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .delete(`/api/studios/${STUDIO_SLUG}`)
      .set('Authorization', `Bearer ${nonToken}`);
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('DELETE /api/studios/:slug deletes for owner, then 404', async () => {
    const ok = await request(httpServer)
      .delete(`/api/studios/${STUDIO_SLUG}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(ok.status).toBe(HttpStatus.OK);

    const gone = await request(httpServer).get(`/api/studios/${STUDIO_SLUG}`);
    expect(gone.status).toBe(HttpStatus.NOT_FOUND);
  });
});
