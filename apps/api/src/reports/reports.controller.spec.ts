import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { AuthModule } from '../auth/auth.module';
import { CommentsModule } from '../comments/comments.module';
import { DevlogsModule } from '../devlogs/devlogs.module';
import { GamesModule } from '../games/games.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { StudiosModule } from '../studios/studios.module';
import { UsersModule } from '../users/users.module';
import { ReportsModule } from './reports.module';
import { createTestApp } from '../test/create-test-app';

const SUFFIX = `rp${Date.now()}`;
const USER_EMAIL = `u${SUFFIX}@example.com`;
const USER_USERNAME = `u${SUFFIX}`;
const ADMIN_EMAIL = `a${SUFFIX}@example.com`;
const ADMIN_USERNAME = `a${SUFFIX}`;
const PASSWORD = 'StrongPass123!';
const STUDIO_SLUG = `studio-${SUFFIX}`;
const GAME_SLUG = `game-${SUFFIX}`;

function cleanEmail(e: string) {
  return e.toLowerCase();
}

describe('ReportsController (e2e)', () => {
  let httpServer: unknown;
  let prisma: PrismaService;
  let userToken: string;
  let adminToken: string;
  let studioId: string;
  let gameId: string;
  let devlogId: string;
  let commentId: string;
  let reportId: string;

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
          CommentsModule,
          ReportsModule,
          NotificationsModule,
        ],
      }),
    );
    httpServer = result.httpServer;
    prisma = result.app.get(PrismaService);

    // Register users
    const userRes = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: USER_EMAIL, username: USER_USERNAME, displayName: 'User', password: PASSWORD });
    userToken = userRes.body.accessToken;

    const adminRes = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: ADMIN_EMAIL, username: ADMIN_USERNAME, displayName: 'Admin', password: PASSWORD });
    adminToken = adminRes.body.accessToken;
    await prisma.user.update({ where: { email: cleanEmail(ADMIN_EMAIL) }, data: { role: 'ADMIN' } });

    // Create studio + game
    const studioRes = await request(httpServer)
      .post('/api/studios')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Report Studio', slug: STUDIO_SLUG });
    studioId = studioRes.body.id;

    const gameRes = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Report Game', slug: GAME_SLUG });
    gameId = gameRes.body.id;

    // Create published devlog
    const devlogRes = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Report Devlog', slug: `rd-${SUFFIX}`, body: 'Test', isPublished: true });
    devlogId = devlogRes.body.id;

    // Create comment
    const commentRes = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ body: 'Report comment' });
    commentId = commentRes.body.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.moderationReport.deleteMany({
        where: { reporter: { email: { startsWith: cleanEmail(SUFFIX) } } },
      });
      await prisma.reaction.deleteMany({ where: { user: { email: { startsWith: cleanEmail(SUFFIX) } } } });
      await prisma.comment.deleteMany({ where: { devlog: { slug: { contains: SUFFIX } } } });
      await prisma.devlog.deleteMany({ where: { slug: { contains: SUFFIX } } });
      await prisma.gameMedia.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.platformLink.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.gameTag.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.game.deleteMany({ where: { slug: { contains: SUFFIX } } });
      await prisma.studio.deleteMany({ where: { slug: { contains: SUFFIX } } });
      await prisma.user.deleteMany({ where: { email: { startsWith: cleanEmail(SUFFIX) } } });
      await prisma.$disconnect();
    }
  });

  // ── CREATE ─────────────────────────────────────────────────────────────

  it('POST /api/reports rejects unauthenticated', async () => {
    const res = await request(httpServer)
      .post('/api/reports')
      .send({ targetType: 'STUDIO', targetId: 'x', reason: 'SPAM' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/reports rejects invalid reason with 400', async () => {
    const res = await request(httpServer)
      .post('/api/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ targetType: 'STUDIO', targetId: studioId, reason: 'INVALID_REASON' });
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('POST /api/reports rejects invalid targetType with 400', async () => {
    const res = await request(httpServer)
      .post('/api/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ targetType: 'INVALID_TYPE', targetId: 'x', reason: 'SPAM' });
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('POST /api/reports reports studio', async () => {
    const res = await request(httpServer)
      .post('/api/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ targetType: 'STUDIO', targetId: studioId, reason: 'SPAM', details: 'This studio is spam' });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.targetType).toBe('STUDIO');
    expect(res.body.targetId).toBe(studioId);
    expect(res.body.reason).toBe('SPAM');
    expect(res.body.status).toBe('OPEN');
    reportId = res.body.id;
  });

  it('POST /api/reports reports game', async () => {
    const res = await request(httpServer)
      .post('/api/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ targetType: 'GAME', targetId: gameId, reason: 'MISLEADING' });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.targetType).toBe('GAME');
  });

  it('POST /api/reports reports devlog', async () => {
    const res = await request(httpServer)
      .post('/api/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ targetType: 'DEVLOG', targetId: devlogId, reason: 'VIOLENCE' });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.targetType).toBe('DEVLOG');
  });

  it('POST /api/reports reports comment', async () => {
    const res = await request(httpServer)
      .post('/api/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ targetType: 'COMMENT', targetId: commentId, reason: 'HARASSMENT' });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.targetType).toBe('COMMENT');
  });

  it('POST /api/reports rejects missing target', async () => {
    const res = await request(httpServer)
      .post('/api/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ targetType: 'STUDIO', targetId: 'nonexistent-id', reason: 'SPAM' });
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('POST /api/reports reports duplicate returns 409', async () => {
    const res = await request(httpServer)
      .post('/api/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ targetType: 'STUDIO', targetId: studioId, reason: 'SPAM' });
    expect(res.status).toBe(HttpStatus.CONFLICT);
  });

  // ── ADMIN LIST ─────────────────────────────────────────────────────────

  it('GET /api/admin/reports rejects unauthenticated', async () => {
    const res = await request(httpServer).get('/api/admin/reports');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /api/admin/reports rejects non-admin', async () => {
    const res = await request(httpServer)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('GET /api/admin/reports allows global ADMIN', async () => {
    const res = await request(httpServer)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.length).toBeGreaterThanOrEqual(4);
  });

  it('GET /api/admin/reports/:id allows global ADMIN', async () => {
    const res = await request(httpServer)
      .get(`/api/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.id).toBe(reportId);
    expect(res.body.reason).toBe('SPAM');
  });

  // ── ADMIN UPDATE ───────────────────────────────────────────────────────

  it('PATCH /api/admin/reports/:id rejects non-admin', async () => {
    const res = await request(httpServer)
      .patch(`/api/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'RESOLVED' });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('PATCH /api/admin/reports/:id updates status', async () => {
    const res = await request(httpServer)
      .patch(`/api/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.status).toBe('RESOLVED');
  });

  it('PATCH /api/admin/reports/:id persists a resolutionNote (#8)', async () => {
    const res = await request(httpServer)
      .patch(`/api/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DISMISSED', resolutionNote: 'Reviewed — not a violation.' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.status).toBe('DISMISSED');
    expect(res.body.resolutionNote).toBe('Reviewed — not a violation.');

    // Persisted and surfaced on the detail endpoint.
    const detail = await request(httpServer)
      .get(`/api/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(detail.body.resolutionNote).toBe('Reviewed — not a violation.');
  });

  it('PATCH /api/admin/reports/:id clears resolutionNote when reopened (#8)', async () => {
    const res = await request(httpServer)
      .patch(`/api/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'OPEN' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.status).toBe('OPEN');
    expect(res.body.resolutionNote).toBeNull();
  });

  it('PATCH /api/admin/reports/:missing returns 404', async () => {
    const res = await request(httpServer)
      .patch('/api/admin/reports/nonexistent')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DISMISSED' });
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('Response never exposes passwordHash', async () => {
    const res = await request(httpServer)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.passwordHash).toBeUndefined();
  });
});
