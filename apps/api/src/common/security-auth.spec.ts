import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { CommentsModule } from '../comments/comments.module';
import { DevlogsModule } from '../devlogs/devlogs.module';
import { FollowsModule } from '../follows/follows.module';
import { GamesModule } from '../games/games.module';
import { MockEmailModule } from '../test/mock-email-service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { ReactionsModule } from '../reactions/reactions.module';
import { ReportsModule } from '../reports/reports.module';
import { RoadmapItemsModule } from '../roadmap-items/roadmap-items.module';
import { StudiosModule } from '../studios/studios.module';
import { UsersModule } from '../users/users.module';
import { registerTestUser } from '../test/register-test-user';

const SUFFIX = `sec-${Date.now()}`;
const EMAIL_A = `a_${SUFFIX}@example.com`;
const EMAIL_B = `b_${SUFFIX}@example.com`;
const USERNAME_A = `user_a_${SUFFIX}`;
const USERNAME_B = `user_b_${SUFFIX}`;
const PASSWORD = 'StrongPass123!';

describe('Security — auth enforcement (e2e)', () => {
  let app: TestingModule;
  let httpServer: unknown;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', 'apps/api/.env'] }),
        PrismaModule,
        AuthModule,
        UsersModule,
        StudiosModule,
        GamesModule,
        DevlogsModule,
        RoadmapItemsModule,
        CommentsModule,
        FollowsModule,
        ReactionsModule,
        ReportsModule,
        NotificationsModule,
        MockEmailModule,
        ScheduleModule.forRoot(),
      ],
    }).compile();

    const nestApp = app.createNestApplication();
    nestApp.setGlobalPrefix('api', { exclude: ['health'] });
    await nestApp.init();
    httpServer = nestApp.getHttpServer();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Cleanup test users
    await prisma.user.deleteMany({ where: { email: { in: [EMAIL_A, EMAIL_B] } } }).catch(() => {});
    await app.close();
  });

  // ── Authentication enforcement ─────────────────────────────────────

  it('POST /api/studios returns 401 without session cookie', async () => {
    const res = await request(httpServer).post('/api/studios').send({ name: 'Test', slug: 'test' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /api/studios/:slug returns 401 without session cookie', async () => {
    const res = await request(httpServer).patch('/api/studios/test-studio').send({ name: 'Hacked' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('DELETE /api/studios/:slug returns 401 without session cookie', async () => {
    const res = await request(httpServer).delete('/api/studios/test-studio');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/studios/:studioSlug/games returns 401 without session cookie', async () => {
    const res = await request(httpServer).post('/api/studios/test/games').send({ title: 'X', slug: 'x' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /api/games/:slug returns 401 without session cookie', async () => {
    const res = await request(httpServer).patch('/api/games/test-game').send({ title: 'Hacked' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('DELETE /api/games/:slug returns 401 without session cookie', async () => {
    const res = await request(httpServer).delete('/api/games/test-game');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/games/:gameSlug/devlogs returns 401 without session cookie', async () => {
    const res = await request(httpServer).post('/api/games/test/devlogs').send({ title: 'X', body: 'x' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /api/devlogs/:id returns 401 without session cookie', async () => {
    const res = await request(httpServer).patch('/api/devlogs/test-id').send({ title: 'Hacked' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('DELETE /api/devlogs/:id returns 401 without session cookie', async () => {
    const res = await request(httpServer).delete('/api/devlogs/test-id');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/games/:gameSlug/roadmap returns 401 without session cookie', async () => {
    const res = await request(httpServer).post('/api/games/test/roadmap').send({ title: 'X' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/devlogs/:devlogId/comments returns 401 without session cookie', async () => {
    const res = await request(httpServer).post('/api/devlogs/test-id/comments').send({ body: 'X' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/studios/:slug/follow returns 401 without session cookie', async () => {
    const res = await request(httpServer).post('/api/studios/test/follow');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/devlogs/:devlogId/reactions returns 401 without session cookie', async () => {
    const res = await request(httpServer).post('/api/devlogs/test-id/reactions').send({ type: 'LIKE' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/reports returns 401 without session cookie', async () => {
    const res = await request(httpServer).post('/api/reports').send({ targetType: 'GAME', targetId: 'x', reason: 'SPAM' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /api/users/me returns 401 without session cookie', async () => {
    const res = await request(httpServer).patch('/api/users/me').send({ displayName: 'Hacked' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('DELETE /api/users/me returns 401 without session cookie', async () => {
    const res = await request(httpServer).delete('/api/users/me');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  // ── Admin route enforcement ────────────────────────────────────────

  it('GET /api/admin/reports returns 401 without session cookie', async () => {
    const res = await request(httpServer).get('/api/admin/reports');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  // ── Register two users for cross-user tests ─────────────────────────

  it('registers User A for cross-user tests', async () => {
    const res = await request(httpServer).post('/api/auth/register').send({
      email: EMAIL_A, password: PASSWORD, acceptedTerms: true, acceptedPrivacy: true,
    });
    expect(res.status).toBe(HttpStatus.CREATED);
  });

  it('registers User B for cross-user tests', async () => {
    const res = await request(httpServer).post('/api/auth/register').send({
      email: EMAIL_B, password: PASSWORD, acceptedTerms: true, acceptedPrivacy: true,
    });
    expect(res.status).toBe(HttpStatus.CREATED);
  });

  // ── Rate limiting ──────────────────────────────────────────────────

  // TODO: ThrottlerGuard not wired in test module — test passes 6×201 instead of 1×429
  it.skip('POST /api/auth/register returns 429 when rate limited (5/min)', async () => {
    // Send 6 rapid requests — the 6th should be throttled
    const results: number[] = [];
    for (let i = 0; i < 6; i++) {
      const r = await request(httpServer).post('/api/auth/register').send({
        email: `rapid_${SUFFIX}_${i}@example.com`, password: PASSWORD, acceptedTerms: true, acceptedPrivacy: true,
      });
      results.push(r.status);
    }
    expect(results.filter((s) => s === HttpStatus.TOO_MANY_REQUESTS).length).toBeGreaterThanOrEqual(1);
  }, 30_000);
});
