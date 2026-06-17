import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { AuthModule } from '../auth/auth.module';
import { CommentsModule } from './comments.module';
import { DevlogsModule } from '../devlogs/devlogs.module';
import { FollowsModule } from '../follows/follows.module';
import { GamesModule } from '../games/games.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { StudiosModule } from '../studios/studios.module';
import { UsersModule } from '../users/users.module';

const SUFFIX = `cm_${Date.now()}`;
const OWNER_EMAIL = `own_${SUFFIX}@example.com`;
const OWNER_USERNAME = `own_${SUFFIX}`;
const SECOND_EMAIL = `sec_${SUFFIX}@example.com`;
const SECOND_USERNAME = `sec_${SUFFIX}`;
const ADMIN_EMAIL = `adm_${SUFFIX}@example.com`;
const ADMIN_USERNAME = `adm_${SUFFIX}`;
const PASSWORD = 'StrongPass123!';
const STUDIO_SLUG = `studio-${SUFFIX}`;
const GAME_SLUG = `game-${SUFFIX}`;
const PUB_DEVLOG_ID = `pd-${SUFFIX}`;
const DRAFT_DEVLOG_ID = `dd-${SUFFIX}`;

function cleanEmail(e: string) {
  return e.toLowerCase();
}

describe('CommentsController (e2e)', () => {
  let app: TestingModule;
  let httpServer: unknown;
  let prisma: PrismaService;
  let ownerToken: string;
  let secondToken: string;
  let adminToken: string;
  let devlogId: string;
  let draftDevlogId: string;
  let commentId: string;

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
        CommentsModule,
        FollowsModule,
      ],
    }).compile();

    const nestApp = app.createNestApplication();
    nestApp.setGlobalPrefix('api', { exclude: ['health'] });
    await nestApp.init();
    httpServer = nestApp.getHttpServer();
    prisma = app.get(PrismaService);

    // Register users
    const ownerRes = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: OWNER_EMAIL, username: OWNER_USERNAME, displayName: 'Owner', password: PASSWORD });
    ownerToken = ownerRes.body.accessToken;

    const secondRes = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: SECOND_EMAIL, username: SECOND_USERNAME, displayName: 'Second', password: PASSWORD });
    secondToken = secondRes.body.accessToken;

    const adminRes = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: ADMIN_EMAIL, username: ADMIN_USERNAME, displayName: 'Admin', password: PASSWORD });
    adminToken = adminRes.body.accessToken;
    await prisma.user.update({ where: { email: cleanEmail(ADMIN_EMAIL) }, data: { role: 'ADMIN' } });

    // Create studio + game
    await request(httpServer)
      .post('/api/studios')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Comment Studio', slug: STUDIO_SLUG });

    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Comment Game', slug: GAME_SLUG });

    // Create published devlog
    const pubRes = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Published Devlog', slug: PUB_DEVLOG_ID, body: 'Public body', isPublished: true });
    devlogId = pubRes.body.id;

    // Create draft devlog
    const draftRes = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Draft Devlog', slug: DRAFT_DEVLOG_ID, body: 'Draft body', isPublished: false });
    draftDevlogId = draftRes.body.id;
  });

  afterAll(async () => {
    if (prisma) {
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

  it('GET /api/devlogs/:devlogId/comments for published devlog works publicly', async () => {
    const res = await request(httpServer).get(`/api/devlogs/${devlogId}/comments`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/devlogs/:devlogId/comments for draft devlog returns 404 publicly', async () => {
    const res = await request(httpServer).get(`/api/devlogs/${draftDevlogId}/comments`);
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('POST /api/devlogs/:devlogId/comments rejects unauthenticated', async () => {
    const res = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/comments`)
      .send({ body: 'Nice!' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/devlogs/:devlogId/comments creates top-level comment', async () => {
    const res = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/comments`)
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ body: 'This looks amazing!' });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.body).toBe('This looks amazing!');
    expect(res.body.parentId).toBeNull();
    expect(res.body.author.username).toBe(SECOND_USERNAME);
    commentId = res.body.id;
  });

  it('POST /api/devlogs/:devlogId/comments creates reply with parentId', async () => {
    const res = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/comments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ body: 'Thanks!', parentId: commentId });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.parentId).toBe(commentId);
  });

  it('POST /api/devlogs/:devlogId/comments rejects parentId from different devlog', async () => {
    // Create another devlog
    const otherSlug = `other-${SUFFIX}`;
    const otherRes = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Other Devlog', slug: otherSlug, body: 'Other', isPublished: true });

    const res = await request(httpServer)
      .post(`/api/devlogs/${otherRes.body.id}/comments`)
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ body: 'Wrong place', parentId: commentId });

    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('POST /api/devlogs/:devlogId/comments rejects unknown devlog', async () => {
    const res = await request(httpServer)
      .post('/api/devlogs/nonexistent-id/comments')
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ body: 'Test' });
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ── UPDATE ─────────────────────────────────────────────────────────────

  it('PATCH /api/comments/:id rejects unauthenticated', async () => {
    const res = await request(httpServer)
      .patch(`/api/comments/${commentId}`)
      .send({ body: 'Hacked' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /api/comments/:id rejects non-author', async () => {
    const res = await request(httpServer)
      .patch(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ body: 'Hacked' });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('PATCH /api/comments/:id allows author', async () => {
    const res = await request(httpServer)
      .patch(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ body: 'Updated comment text' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.body).toBe('Updated comment text');
  });

  // ── DELETE ─────────────────────────────────────────────────────────────

  it('DELETE /api/comments/:id rejects unauthenticated', async () => {
    const res = await request(httpServer).delete(`/api/comments/${commentId}`);
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('DELETE /api/comments/:id rejects non-author/non-admin/non-studio-admin', async () => {
    // second user created the comment, non-member should not be able to delete
    const nonUserSlug = `non_${SUFFIX}`;
    const nonRes = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: `non_${SUFFIX}@example.com`, username: nonUserSlug, displayName: 'Non', password: PASSWORD });
    const nonToken = nonRes.body.accessToken;

    const res = await request(httpServer)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${nonToken}`);
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('DELETE /api/comments/:id allows author', async () => {
    // Create a new comment as author
    const tempRes = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/comments`)
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ body: 'Temp comment' });
    const tempId = tempRes.body.id;

    const res = await request(httpServer)
      .delete(`/api/comments/${tempId}`)
      .set('Authorization', `Bearer ${secondToken}`);
    expect(res.status).toBe(HttpStatus.OK);
  });

  it('DELETE /api/comments/:id allows global ADMIN', async () => {
    const res = await request(httpServer)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(HttpStatus.OK);
  });

  it('DELETE /api/comments/:id allows studio OWNER/ADMIN of devlogs game', async () => {
    // Create a new comment as second user
    const tempRes = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/comments`)
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ body: 'Another comment' });
    const tempId = tempRes.body.id;

    // Owner should be able to delete (studio OWNER)
    const res = await request(httpServer)
      .delete(`/api/comments/${tempId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(HttpStatus.OK);
  });

  it('DELETE /api/comments/:id soft deletes rather than hard deletes', async () => {
    // Create comment, delete it, then check DB
    const tempRes = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/comments`)
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ body: 'Soft delete test' });
    const tempId = tempRes.body.id;

    await request(httpServer)
      .delete(`/api/comments/${tempId}`)
      .set('Authorization', `Bearer ${secondToken}`);

    const dbComment = await prisma.comment.findUnique({ where: { id: tempId } });
    expect(dbComment).toBeDefined();
    expect(dbComment!.deletedAt).toBeTruthy();
    expect(dbComment!.body).toBe('Soft delete test'); // body preserved in DB
  });

  // ── GET ────────────────────────────────────────────────────────────────

  it('GET /api/devlogs/:devlogId/comments does not expose passwordHash', async () => {
    const res = await request(httpServer).get(`/api/devlogs/${devlogId}/comments`);
    expect(res.status).toBe(HttpStatus.OK);
    for (const c of res.body) {
      expect(c.passwordHash).toBeUndefined();
      if (c.author) {
        expect(c.author.passwordHash).toBeUndefined();
      }
    }
  });

  it('Deleted comments return sanitized body/null body', async () => {
    const res = await request(httpServer).get(`/api/devlogs/${devlogId}/comments`);
    const deleted = res.body.filter((c: { isDeleted: boolean }) => c.isDeleted);
    for (const c of deleted) {
      expect(c.body).toBeNull();
      expect(c.isDeleted).toBe(true);
      expect(c.deletedAt).toBeTruthy();
    }
  });

  it('Cannot reply to a deleted comment', async () => {
    const res = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/comments`)
      .set('Authorization', `Bearer ${secondToken}`)
      .send({ body: 'Reply to deleted', parentId: commentId });
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });
});
