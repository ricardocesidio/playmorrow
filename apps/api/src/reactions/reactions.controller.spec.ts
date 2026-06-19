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
import { ReactionsModule } from './reactions.module';
import { StudiosModule } from '../studios/studios.module';
import { UsersModule } from '../users/users.module';
import { createTestApp } from '../test/create-test-app';

const SUFFIX = `rx${Date.now()}`;
const USER_EMAIL = `u${SUFFIX}@example.com`;
const USER_USERNAME = `u${SUFFIX}`;
const USER2_EMAIL = `u2${SUFFIX}@example.com`;
const USER2_USERNAME = `u2${SUFFIX}`;
const PASSWORD = 'StrongPass123!';
const STUDIO_SLUG = `studio-${SUFFIX}`;
const GAME_SLUG = `game-${SUFFIX}`;

function cleanEmail(e: string) {
  return e.toLowerCase();
}

describe('ReactionsController (e2e)', () => {
  let httpServer: unknown;
  let prisma: PrismaService;
  let userToken: string;
  let user2Token: string;
  let devlogId: string;
  let commentId: string;

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
          ReactionsModule,
          NotificationsModule,
        ],
      }),
    );
    httpServer = result.httpServer;
    prisma = result.app.get(PrismaService);

    const userRes = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: USER_EMAIL, username: USER_USERNAME, displayName: 'User', password: PASSWORD });
    userToken = userRes.body.accessToken;

    const user2Res = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: USER2_EMAIL, username: USER2_USERNAME, displayName: 'User2', password: PASSWORD });
    user2Token = user2Res.body.accessToken;

    // Create studio + game
    await request(httpServer)
      .post('/api/studios')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Reaction Studio', slug: STUDIO_SLUG });

    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Reaction Game', slug: GAME_SLUG });

    // Create published devlog
    const devlogRes = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Reaction Devlog', slug: `rd-${SUFFIX}`, body: 'Test devlog', isPublished: true });
    devlogId = devlogRes.body.id;

    // Create comment
    const commentRes = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ body: 'Test comment' });
    commentId = commentRes.body.id;
  });

  afterAll(async () => {
    if (prisma) {
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

  // ── DEVOOG REACTIONS ─────────────────────────────────────────────────

  it('POST /api/devlogs/:id/reactions rejects unauthenticated', async () => {
    const res = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/reactions`)
      .send({ type: 'LIKE' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/devlogs/:id/reactions creates reaction', async () => {
    const res = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/reactions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'LIKE' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.targetType).toBe('DEVLOG');
    expect(res.body.targetId).toBe(devlogId);
    expect(res.body.counts.LIKE).toBe(1);
    expect(res.body.viewerReactions).toContain('LIKE');
  });

  it('POST /api/devlogs/:id/reactions is idempotent', async () => {
    const res = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/reactions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'LIKE' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.counts.LIKE).toBe(1);
    expect(res.body.viewerReactions).toContain('LIKE');
  });

  it('POST /api/devlogs/:id/reactions supports multiple types', async () => {
    const res = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/reactions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'LOVE' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.counts.LOVE).toBe(1);
    expect(res.body.viewerReactions).toContain('LOVE');
    expect(res.body.viewerReactions).toContain('LIKE');
  });

  it('POST /api/devlogs/:id/reactions rejects invalid type with 400', async () => {
    const res = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/reactions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'INVALID' });
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  // Regression guard for handoff #1: the test harness must mirror prod's
  // ValidationPipe (whitelist + forbidNonWhitelisted). An unknown body prop
  // must be rejected, not silently stripped/ignored.
  it('POST /api/devlogs/:id/reactions rejects unknown body props with 400', async () => {
    const res = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/reactions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'LIKE', notARealField: 'nope' });
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('POST /api/devlogs/:missing/reactions returns 404', async () => {
    const res = await request(httpServer)
      .post('/api/devlogs/nonexistent-id/reactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'LIKE' });
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('DELETE /api/devlogs/:id/reactions rejects unauthenticated', async () => {
    const res = await request(httpServer).delete(`/api/devlogs/${devlogId}/reactions`);
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('DELETE /api/devlogs/:id/reactions removes reaction', async () => {
    const res = await request(httpServer)
      .delete(`/api/devlogs/${devlogId}/reactions?type=LOVE`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.counts.LOVE).toBe(0);
    expect(res.body.viewerReactions).not.toContain('LOVE');
    expect(res.body.viewerReactions).toContain('LIKE');
  });

  it('DELETE /api/devlogs/:id/reactions is idempotent', async () => {
    const res = await request(httpServer)
      .delete(`/api/devlogs/${devlogId}/reactions?type=LOVE`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.counts.LOVE).toBe(0);
  });

  it('DELETE without type removes all user reactions', async () => {
    // Add HYPE first
    await request(httpServer)
      .post(`/api/devlogs/${devlogId}/reactions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'HYPE' });

    // Delete all
    const res = await request(httpServer)
      .delete(`/api/devlogs/${devlogId}/reactions`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.counts.HYPE).toBe(0);
    expect(res.body.viewerReactions).toEqual([]);
  });

  it('GET /api/devlogs/:id/reactions returns counts publicly', async () => {
    // Add reactions from user2
    await request(httpServer)
      .post(`/api/devlogs/${devlogId}/reactions`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ type: 'LIKE' });

    const res = await request(httpServer).get(`/api/devlogs/${devlogId}/reactions`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.counts.LIKE).toBe(1);
    expect(res.body.viewerReactions).toEqual([]);
  });

  it('GET /api/devlogs/:id/reactions returns viewerReactions for logged-in user', async () => {
    const res = await request(httpServer)
      .get(`/api/devlogs/${devlogId}/reactions`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.viewerReactions).toContain('LIKE');
  });

  it('GET /api/devlogs/:missing/reactions returns 404', async () => {
    const res = await request(httpServer).get('/api/devlogs/nonexistent/reactions');
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ── COMMENT REACTIONS ────────────────────────────────────────────────

  it('POST /api/comments/:id/reactions rejects unauthenticated', async () => {
    const res = await request(httpServer)
      .post(`/api/comments/${commentId}/reactions`)
      .send({ type: 'LIKE' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/comments/:id/reactions creates reaction', async () => {
    const res = await request(httpServer)
      .post(`/api/comments/${commentId}/reactions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'HYPE' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.targetType).toBe('COMMENT');
    expect(res.body.targetId).toBe(commentId);
    expect(res.body.counts.HYPE).toBe(1);
    expect(res.body.viewerReactions).toContain('HYPE');
  });

  it('POST /api/comments/:id/reactions is idempotent', async () => {
    const res = await request(httpServer)
      .post(`/api/comments/${commentId}/reactions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'HYPE' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.counts.HYPE).toBe(1);
  });

  it('POST /api/comments/:missing/reactions returns 404', async () => {
    const res = await request(httpServer)
      .post('/api/comments/nonexistent/reactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'LIKE' });
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('DELETE /api/comments/:id/reactions removes reaction', async () => {
    const res = await request(httpServer)
      .delete(`/api/comments/${commentId}/reactions?type=HYPE`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.counts.HYPE).toBe(0);
  });

  it('DELETE /api/comments/:id/reactions is idempotent', async () => {
    const res = await request(httpServer)
      .delete(`/api/comments/${commentId}/reactions?type=HYPE`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.counts.HYPE).toBe(0);
  });

  it('GET /api/comments/:id/reactions returns counts publicly', async () => {
    const res = await request(httpServer).get(`/api/comments/${commentId}/reactions`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.counts.HYPE).toBe(0);
    expect(res.body.viewerReactions).toEqual([]);
  });

  it('GET /api/comments/:id/reactions returns viewerReactions for logged-in user', async () => {
    // Add a reaction first
    await request(httpServer)
      .post(`/api/comments/${commentId}/reactions`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ type: 'LIKE' });

    const res = await request(httpServer)
      .get(`/api/comments/${commentId}/reactions`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.counts.LIKE).toBe(1);
    expect(res.body.viewerReactions).toContain('LIKE');
  });

  it('Response never exposes passwordHash', async () => {
    const res = await request(httpServer).get(`/api/devlogs/${devlogId}/reactions`);
    expect(res.body.passwordHash).toBeUndefined();
  });
});
