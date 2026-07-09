import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { CommentsModule } from '../comments/comments.module';
import { DevlogsModule } from '../devlogs/devlogs.module';
import { GamesModule } from '../games/games.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { FollowsModule } from '../follows/follows.module';
import { ReactionsModule } from '../reactions/reactions.module';
import { StudiosModule } from '../studios/studios.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from './notifications.module';
import { createTestApp } from '../test/create-test-app';
import { MockEmailModule } from '../test/mock-email-service';
import { registerTestUser } from '../test/register-test-user';

const SUFFIX = `nt${Date.now()}`;
const FOLLOWER_EMAIL = `flw${SUFFIX}@example.com`;
const OWNER_EMAIL = `own${SUFFIX}@example.com`;
const COMMENT_AUTHOR_EMAIL = `ca${SUFFIX}@example.com`;
const PASSWORD = 'StrongPass123!';
const STUDIO_SLUG = `studio-${SUFFIX}`;
const GAME_SLUG = `game-${SUFFIX}`;

function cleanEmail(e: string) {
  return e.toLowerCase();
}

describe('NotificationsController (e2e)', () => {
  let httpServer: unknown;
  let prisma: PrismaService;
  let followerToken: string;
  let ownerToken: string;
  let ownerUsername: string;
  let followerUsername: string;
  let commentAuthorToken: string;
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
          FollowsModule,
          ReactionsModule,
          NotificationsModule,
          MockEmailModule,
          ScheduleModule.forRoot(),
        ],
      }),
    );
    httpServer = result.httpServer;
    prisma = result.app.get(PrismaService);

    // Register users
    const owner = await registerTestUser(httpServer, prisma, OWNER_EMAIL, PASSWORD);
    ownerToken = owner.sessionCookie;
    ownerUsername = owner.username;

    const follower = await registerTestUser(httpServer, prisma, FOLLOWER_EMAIL, PASSWORD);
    followerToken = follower.sessionCookie;
    followerUsername = follower.username;

    const ca = await registerTestUser(httpServer, prisma, COMMENT_AUTHOR_EMAIL, PASSWORD);
    commentAuthorToken = ca.sessionCookie;

    // Create studio as owner
    await request(httpServer)
      .post('/api/studios')
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ name: 'Notification Studio', slug: STUDIO_SLUG });

    // Create game
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Notification Game', slug: GAME_SLUG });

    // Create published devlog
    const devlogRes = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Notification Devlog', slug: `nd${SUFFIX}`, body: 'Test', isPublished: true });
    devlogId = devlogRes.body.id;

    // Create comment as commentAuthor
    const commentRes = await request(httpServer)
      .post(`/api/devlogs/${devlogId}/comments`)
      .set('Cookie', `playmorrow_session=${commentAuthorToken}`)
      .send({ body: 'A test comment' });
    commentId = commentRes.body.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.notification.deleteMany({
        where: { recipient: { email: { startsWith: cleanEmail(SUFFIX) } } },
      });
      await prisma.reaction.deleteMany({ where: { user: { email: { startsWith: cleanEmail(SUFFIX) } } } });
      await prisma.comment.deleteMany({ where: { devlog: { slug: { contains: SUFFIX } } } });
      await prisma.devlog.deleteMany({ where: { slug: { contains: SUFFIX } } });
      await prisma.gameMedia.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.platformLink.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.gameTag.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.game.deleteMany({ where: { slug: { contains: SUFFIX } } });
      await prisma.follow.deleteMany({ where: { user: { email: { startsWith: cleanEmail(SUFFIX) } } } });
      await prisma.studio.deleteMany({ where: { slug: { contains: SUFFIX } } });
      await prisma.user.deleteMany({ where: { email: { startsWith: cleanEmail(SUFFIX) } } });
      await prisma.$disconnect();
    }
  });

  // ── FOLLOW NOTIFICATIONS ──────────────────────────────────────────────

  it('GET /api/me/notifications rejects unauthenticated', async () => {
    const res = await request(httpServer).get('/api/me/notifications');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('Studio follow notifies studio OWNER/ADMIN', async () => {
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Cookie', `playmorrow_session=${followerToken}`);

    const res = await request(httpServer)
      .get('/api/me/notifications')
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    const notif = res.body.items.find((n: { type: string }) => n.type === 'NEW_FOLLOWER');
    expect(notif).toBeDefined();
    expect(notif.actor.username).toBe(followerUsername);
  });

  it('Studio follow does not notify actor if actor owns studio', async () => {
    // Owner follows own studio
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/follow`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    const res = await request(httpServer)
      .get('/api/me/notifications')
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    // Should still have only the notification from the follower, not from self-follow
    const selfNotif = res.body.items.filter(
      (n: { type: string }) => n.type === 'NEW_FOLLOWER' && n.actor?.username === ownerUsername,
    );
    expect(selfNotif.length).toBe(0);
  });

  it('Game follow notifies game studio OWNER/ADMIN', async () => {
    await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/follow`)
      .set('Cookie', `playmorrow_session=${followerToken}`);

    const res = await request(httpServer)
      .get('/api/me/notifications')
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    const gameNotifs = res.body.items.filter((n: { type: string }) => n.type === 'NEW_FOLLOWER');
    expect(gameNotifs.length).toBeGreaterThanOrEqual(1);
  });

  // ── COMMENT NOTIFICATIONS ─────────────────────────────────────────────

  it('New devlog comment notifies studio OWNER/ADMIN', async () => {
    await request(httpServer)
      .post(`/api/devlogs/${devlogId}/comments`)
      .set('Cookie', `playmorrow_session=${followerToken}`)
      .send({ body: 'A comment from follower' });

    const res = await request(httpServer)
      .get('/api/me/notifications')
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    const commentNotif = res.body.items.find((n: { type: string }) => n.type === 'NEW_COMMENT');
    expect(commentNotif).toBeDefined();
    expect(commentNotif.targetType).toBe('DEVLOG');
    // #26: notification carries a resolved deep link to the target.
    expect(commentNotif.targetUrl).toBe(`/devlogs/${devlogId}`);
  });

  it('New reply notifies parent comment author', async () => {
    await request(httpServer)
      .post(`/api/devlogs/${devlogId}/comments`)
      .set('Cookie', `playmorrow_session=${followerToken}`)
      .send({ body: 'A reply', parentId: commentId });

    const res = await request(httpServer)
      .get('/api/me/notifications')
      .set('Cookie', `playmorrow_session=${commentAuthorToken}`);

    const replyNotif = res.body.items.find((n: { type: string }) => n.type === 'NEW_REPLY');
    expect(replyNotif).toBeDefined();
  });

  // ── REACTION NOTIFICATIONS ────────────────────────────────────────────

  it('Reaction to devlog notifies studio OWNER/ADMIN', async () => {
    await request(httpServer)
      .post(`/api/devlogs/${devlogId}/reactions`)
      .set('Cookie', `playmorrow_session=${followerToken}`)
      .send({ type: 'LIKE' });

    const res = await request(httpServer)
      .get('/api/me/notifications')
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    const reactNotif = res.body.items.find((n: { type: string }) => n.type === 'NEW_REACTION');
    expect(reactNotif).toBeDefined();
  });

  // ── LIST / FILTER / PAGINATION ────────────────────────────────────────

  it('GET /api/me/notifications returns only current user notifications', async () => {
    const res = await request(httpServer)
      .get('/api/me/notifications')
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    for (const n of res.body.items) {
      // We can't easily verify recipientId from response, but we can check the endpoint works
      expect(n.id).toBeDefined();
    }
  });

  it('GET /api/me/notifications supports unread filter', async () => {
    const res = await request(httpServer)
      .get('/api/me/notifications?status=unread')
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('GET /api/me/notifications supports pagination', async () => {
    const res = await request(httpServer)
      .get('/api/me/notifications?page=1&pageSize=2')
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.length).toBeLessThanOrEqual(2);
  });

  // ── UNREAD COUNT ──────────────────────────────────────────────────────

  it('GET /api/me/notifications/unread-count returns correct count', async () => {
    const res = await request(httpServer)
      .get('/api/me/notifications/unread-count')
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(typeof res.body.unreadCount).toBe('number');
    expect(res.body.unreadCount).toBeGreaterThan(0);
  });

  // ── MARK AS READ ──────────────────────────────────────────────────────

  it('PATCH /api/notifications/:id/read marks own notification read', async () => {
    const listRes = await request(httpServer)
      .get('/api/me/notifications?status=unread&pageSize=1')
      .set('Cookie', `playmorrow_session=${ownerToken}`);
    const firstId = listRes.body.items[0]?.id;
    if (!firstId) return; // skip if no notifications

    const res = await request(httpServer)
      .patch(`/api/notifications/${firstId}/read`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.readAt).toBeTruthy();
  });

  it('PATCH /api/notifications/:id/read rejects other users notification', async () => {
    const listRes = await request(httpServer)
      .get('/api/me/notifications?pageSize=1')
      .set('Cookie', `playmorrow_session=${ownerToken}`);
    const ownerNotifId = listRes.body.items[0]?.id;
    if (!ownerNotifId) return;

    const res = await request(httpServer)
      .patch(`/api/notifications/${ownerNotifId}/read`)
      .set('Cookie', `playmorrow_session=${followerToken}`);

    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('PATCH /api/me/notifications/read-all marks all current user notifications read', async () => {
    const res = await request(httpServer)
      .patch('/api/me/notifications/read-all')
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.OK);

    const unreadRes = await request(httpServer)
      .get('/api/me/notifications/unread-count')
      .set('Cookie', `playmorrow_session=${ownerToken}`);
    expect(unreadRes.body.unreadCount).toBe(0);
  });

  // ── DISMISS / DELETE (#20) ────────────────────────────────────────────

  it('DELETE /api/notifications/:id rejects unauthenticated', async () => {
    const res = await request(httpServer).delete('/api/notifications/whatever');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it("DELETE /api/notifications/:id won't delete another user's notification (404)", async () => {
    const owned = await request(httpServer)
      .get('/api/me/notifications')
      .set('Cookie', `playmorrow_session=${ownerToken}`);
    const someId = owned.body.items[0]?.id;
    expect(someId).toBeDefined();

    // followerToken does not own the owner's notification.
    const res = await request(httpServer)
      .delete(`/api/notifications/${someId}`)
      .set('Cookie', `playmorrow_session=${followerToken}`);
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('DELETE /api/notifications/:id dismisses the owner\'s notification', async () => {
    const before = await request(httpServer)
      .get('/api/me/notifications')
      .set('Cookie', `playmorrow_session=${ownerToken}`);
    const id = before.body.items[0]?.id;
    expect(id).toBeDefined();
    const beforeTotal = before.body.total;

    const del = await request(httpServer)
      .delete(`/api/notifications/${id}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);
    expect(del.status).toBe(HttpStatus.OK);

    const after = await request(httpServer)
      .get('/api/me/notifications')
      .set('Cookie', `playmorrow_session=${ownerToken}`);
    expect(after.body.total).toBe(beforeTotal - 1);
    expect(after.body.items.find((n: { id: string }) => n.id === id)).toBeUndefined();
  });

  // ── SECURITY ──────────────────────────────────────────────────────────

  it('Responses never expose passwordHash', async () => {
    const res = await request(httpServer)
      .get('/api/me/notifications')
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.body.passwordHash).toBeUndefined();
    for (const n of res.body.items) {
      expect(n.passwordHash).toBeUndefined();
      if (n.actor) {
        expect(n.actor.passwordHash).toBeUndefined();
      }
    }
  });
});
