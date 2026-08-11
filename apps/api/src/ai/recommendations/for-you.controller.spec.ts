import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

vi.setConfig({ hookTimeout: 60_000 });
import request from 'supertest';

import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { EventBusModule } from '../../common/event-bus.module';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersModule } from '../../users/users.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { AIModule } from '../ai.module';
import { MockEmailModule } from '../../test/mock-email-service';
import { registerTestUser } from '../../test/register-test-user';
import { createTestApp } from '../../test/create-test-app';

const SUFFIX = `fyu-${Date.now()}`;
const EMAIL = `fyu_${SUFFIX}@example.com`;
const PASSWORD = 'StrongPass123!';
const GAME_SLUG = `for-you-game-${SUFFIX}`;
const GAME_TITLE = `For You Game ${SUFFIX}`;

describe('ForYouController (e2e) — M23 hybrid feed', () => {
  let app: TestingModule;
  let httpServer: unknown;
  let prisma: PrismaService;
  let sessionCookie: string;
  let userId: string;
  let gameId: string;

  beforeAll(async () => {
    const result = await createTestApp(
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', 'apps/api/.env'],
          }),
          PrismaModule,
          UsersModule,
          AuthModule,
          EventBusModule,
          ScheduleModule.forRoot(),
          NotificationsModule,
          MockEmailModule,
          AIModule,
        ],
      }),
    );
    app = result.app;
    httpServer = result.httpServer;
    prisma = app.get(PrismaService);

    const user = await registerTestUser(httpServer, prisma, EMAIL, PASSWORD);
    sessionCookie = user.sessionCookie;
    userId = user.userId;

    const studio = await prisma.studio.create({
      data: {
        name: `For You Studio ${SUFFIX}`,
        slug: `for-you-studio-${SUFFIX}`,
        members: {
          create: { userId: user.userId, role: 'OWNER' },
        },
      },
    });

    const created = await prisma.game.create({
      data: {
        slug: GAME_SLUG,
        title: GAME_TITLE,
        isPublished: true,
        status: 'RELEASED',
        genres: 'Puzzle',
        description: 'A test puzzle game for the for-you feed.',
        studio: { connect: { id: studio.id } },
      },
    });
    gameId = created.id;
  });

  afterAll(async () => {
    if (gameId) await prisma.game.delete({ where: { id: gameId } }).catch(() => undefined);
    await app.close();
  });

  it('GET /recommendations/for-you returns a well-formed feed', async () => {
    const res = await request(httpServer)
      .get('/api/recommendations/for-you?limit=5')
      .expect(200);

    expect(res.body).toMatchObject({ hasMore: expect.any(Boolean), method: expect.any(String) });
    expect(Array.isArray(res.body.items)).toBe(true);
    for (const item of res.body.items) {
      expect(item.gameId).toBeTruthy();
      expect(item.reason).toBeTruthy();
      expect(item.reasonType).toBeTruthy();
    }
  });

  it('GET /recommendations/for-you honours cursor pagination', async () => {
    const first = await request(httpServer)
      .get('/api/recommendations/for-you?limit=1')
      .expect(200);

    const body = first.body as { items: { gameId: string }[]; nextCursor: { score: number; gameId: string } | null };
    if (body.items.length > 0 && body.nextCursor) {
      const cursor = encodeURIComponent(JSON.stringify(body.nextCursor));
      const second = await request(httpServer)
        .get(`/api/recommendations/for-you?limit=1&cursor=${cursor}`)
        .expect(200);
      const ids = (second.body as { items: { gameId: string }[] }).items.map((i) => i.gameId);
      expect(ids.some((id) => id === body.items[0].gameId)).toBe(false);
    }
  });

  it('POST /recommendations/feedback rejects invalid actions', async () => {
    await request(httpServer)
      .post('/api/recommendations/feedback')
      .set('Cookie', [`playmorrow_session=${sessionCookie}`])
      .send({ gameId, action: 'SCREAM' })
      .expect(400);
  });

  it('POST /recommendations/feedback records a dismissal', async () => {
    const res = await request(httpServer)
      .post('/api/recommendations/feedback')
      .set('Cookie', [`playmorrow_session=${sessionCookie}`])
      .send({ gameId, action: 'DISMISSED' })
      .expect(201);

    expect(res.body).toEqual({ ok: true });

    const count = await prisma.recommendationFeedback.count({
      where: { gameId, action: 'DISMISSED' },
    });
    expect(count).toBeGreaterThan(0);
  });

  it('personalization preference is opt-in and defaults to false', async () => {
    const res = await request(httpServer)
      .get('/api/recommendations/preferences')
      .set('Cookie', [`playmorrow_session=${sessionCookie}`])
      .expect(200);
    expect(res.body).toEqual({ personalizationEnabled: false });

    await request(httpServer)
      .patch('/api/recommendations/preferences')
      .set('Cookie', [`playmorrow_session=${sessionCookie}`])
      .send({ personalizationEnabled: true })
      .expect(200);

    const after = await request(httpServer)
      .get('/api/recommendations/preferences')
      .set('Cookie', [`playmorrow_session=${sessionCookie}`])
      .expect(200);
    expect(after.body).toEqual({ personalizationEnabled: true });

    const row = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { personalizationEnabled: true, personalizationEnabledAt: true },
    });
    expect(row.personalizationEnabled).toBe(true);
    expect(row.personalizationEnabledAt).not.toBeNull();
  });

  it('personalization endpoints require a session (anonymous 401)', async () => {
    await request(httpServer).get('/api/recommendations/preferences').expect(401);
    await request(httpServer)
      .patch('/api/recommendations/preferences')
      .send({ personalizationEnabled: true })
      .expect(401);
    await request(httpServer).post('/api/recommendations/impressions').send({ gameIds: [gameId] }).expect(401);
    await request(httpServer).delete('/api/recommendations/feedback').expect(401);
  });

  it('POST /recommendations/impressions dedupes within the window and ignores unknown games', async () => {
    const first = await request(httpServer)
      .post('/api/recommendations/impressions')
      .set('Cookie', [`playmorrow_session=${sessionCookie}`])
      .send({ gameIds: [gameId, gameId, 'no-such-game'] })
      .expect(201);
    expect(first.body).toEqual({ recorded: 1, deduplicated: 1, invalid: 1 });

    const second = await request(httpServer)
      .post('/api/recommendations/impressions')
      .set('Cookie', [`playmorrow_session=${sessionCookie}`])
      .send({ gameIds: [gameId] })
      .expect(201);
    expect(second.body).toEqual({ recorded: 0, deduplicated: 1, invalid: 0 });

    const count = await prisma.recommendationFeedback.count({
      where: { action: 'IMPRESSION', gameId },
    });
    expect(count).toBe(1);
  });

  it('DELETE /recommendations/feedback only clears the session users own history', async () => {
    await request(httpServer)
      .post('/api/recommendations/impressions')
      .set('Cookie', [`playmorrow_session=${sessionCookie}`])
      .send({ gameIds: [gameId] })
      .expect(201);
    await request(httpServer)
      .post('/api/recommendations/feedback')
      .set('Cookie', [`playmorrow_session=${sessionCookie}`])
      .send({ gameId, action: 'CLICKED' })
      .expect(201);

    const res = await request(httpServer)
      .delete('/api/recommendations/feedback')
      .set('Cookie', [`playmorrow_session=${sessionCookie}`])
      .expect(200);
    expect(res.body.deleted).toBeGreaterThanOrEqual(2);

    const leftover = await prisma.recommendationFeedback.count({
      where: { userId },
    });
    expect(leftover).toBe(0);
  });

  it('GET /recommendations/metrics is ADMIN-only', async () => {
    await request(httpServer)
      .get('/api/recommendations/metrics?days=7')
      .set('Cookie', [`playmorrow_session=${sessionCookie}`])
      .expect(403);
  });

  it('POST /recommendations/refresh-embeddings requires ADMIN', async () => {
    await request(httpServer)
      .post('/api/recommendations/refresh-embeddings')
      .set('Cookie', [`playmorrow_session=${sessionCookie}`])
      .expect(403);
  });
});
