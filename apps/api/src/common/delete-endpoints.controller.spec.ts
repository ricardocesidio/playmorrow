import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { ScheduleModule } from '@nestjs/schedule';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuthModule } from '../auth/auth.module';
import { DevlogsModule } from '../devlogs/devlogs.module';
import { FeedModule } from '../feed/feed.module';
import { GamesModule } from '../games/games.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { RoadmapItemsModule } from '../roadmap-items/roadmap-items.module';
import { StudiosModule } from '../studios/studios.module';
import { UsersModule } from '../users/users.module';
import { MockEmailModule } from '../test/mock-email-service';
import { registerTestUser } from '../test/register-test-user';
import { createTestApp } from '../test/create-test-app';

/**
 * Delete endpoints for studio / game / devlog / roadmap item (#19).
 * Verifies ownership enforcement (non-member → 403), success → 200, the entity
 * is gone afterwards (→ 404), and cascade (deleting a game removes its devlogs).
 */
const SUFFIX = `del-${Date.now()}`;
const OWNER_EMAIL = `own_${SUFFIX}@example.com`;
const NON_EMAIL = `non_${SUFFIX}@example.com`;
const PASSWORD = 'StrongPass123!';
const STUDIO_SLUG = `studio-${SUFFIX}`;
const GAME_SLUG = `game-${SUFFIX}`;
const GAME2_SLUG = `game2-${SUFFIX}`;

describe('Delete endpoints (e2e) (#19)', () => {
  let httpServer: unknown;
  let prisma: PrismaService;
  let ownerToken: string;
  let nonToken: string;
  let devlogId: string;
  let cascadeDevlogId: string;
  let roadmapId: string;

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
          MockEmailModule,
          ScheduleModule.forRoot(),
        ],
      }),
    );
    httpServer = result.httpServer;
    prisma = result.app.get(PrismaService);

    const owner = await registerTestUser(httpServer, prisma, OWNER_EMAIL, PASSWORD);
    ownerToken = owner.sessionCookie;

    const non = await registerTestUser(httpServer, prisma, NON_EMAIL, PASSWORD);
    nonToken = non.sessionCookie;

    const studioRes = await request(httpServer)
      .post('/api/studios')
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ name: 'Delete Test Studio', slug: STUDIO_SLUG });
    if (studioRes.status !== 201) {
      throw new Error(`Create studio returned ${studioRes.status}: ${JSON.stringify(studioRes.body)}`);
    }

    const gameRes = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Delete Test Game', slug: GAME_SLUG });
    if (gameRes.status !== 201) {
      throw new Error(`Create game returned ${gameRes.status}: ${JSON.stringify(gameRes.body)}`);
    }

    const devlogRes = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Doomed Devlog', slug: `dl-${SUFFIX}`, body: 'x', isPublished: true });
    if (devlogRes.status !== 201) {
      throw new Error(`Create devlog returned ${devlogRes.status}: ${JSON.stringify(devlogRes.body)}`);
    }
    devlogId = devlogRes.body.id;

    const roadmapRes = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/roadmap`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Doomed Item', status: 'PLANNED' });
    if (roadmapRes.status !== 201) {
      throw new Error(`Create roadmap returned ${roadmapRes.status}: ${JSON.stringify(roadmapRes.body)}`);
    }
    roadmapId = roadmapRes.body.id;

    // A second game + devlog to verify game deletion cascades to its devlogs.
    const game2Res = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Cascade Game', slug: GAME2_SLUG });
    if (game2Res.status !== 201) {
      throw new Error(`Create game2 returned ${game2Res.status}: ${JSON.stringify(game2Res.body)}`);
    }
    const cascadeDevlog = await request(httpServer)
      .post(`/api/games/${GAME2_SLUG}/devlogs`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Cascade Devlog', slug: `cdl-${SUFFIX}`, body: 'x', isPublished: true });
    if (cascadeDevlog.status !== 201) {
      throw new Error(`Create cascade devlog returned ${cascadeDevlog.status}: ${JSON.stringify(cascadeDevlog.body)}`);
    }
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
      .set('Cookie', `playmorrow_session=${nonToken}`);
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('DELETE /api/roadmap-items/:id deletes for owner, then 404', async () => {
    const ok = await request(httpServer)
      .delete(`/api/roadmap-items/${roadmapId}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);
    expect(ok.status).toBe(HttpStatus.OK);

    const gone = await request(httpServer)
      .delete(`/api/roadmap-items/${roadmapId}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);
    expect(gone.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ── Devlog ────────────────────────────────────────────────────────────
  it('DELETE /api/devlogs/:id rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .delete(`/api/devlogs/${devlogId}`)
      .set('Cookie', `playmorrow_session=${nonToken}`);
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('DELETE /api/devlogs/:id deletes for owner, then 404 on fetch', async () => {
    const ok = await request(httpServer)
      .delete(`/api/devlogs/${devlogId}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);
    expect(ok.status).toBe(HttpStatus.OK);

    const gone = await request(httpServer).get(`/api/devlogs/${devlogId}`);
    expect(gone.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ── Game (with cascade) ───────────────────────────────────────────────
  it('DELETE /api/games/:slug rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .delete(`/api/games/${GAME2_SLUG}`)
      .set('Cookie', `playmorrow_session=${nonToken}`);
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('DELETE /api/games/:slug deletes the game and cascades to its devlogs', async () => {
    const ok = await request(httpServer)
      .delete(`/api/games/${GAME2_SLUG}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);
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
      .set('Cookie', `playmorrow_session=${nonToken}`);
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('DELETE /api/studios/:slug deletes for owner, then 404', async () => {
    const ok = await request(httpServer)
      .delete(`/api/studios/${STUDIO_SLUG}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);
    expect(ok.status).toBe(HttpStatus.OK);

    const gone = await request(httpServer).get(`/api/studios/${STUDIO_SLUG}`);
    expect(gone.status).toBe(HttpStatus.NOT_FOUND);
  });
});
