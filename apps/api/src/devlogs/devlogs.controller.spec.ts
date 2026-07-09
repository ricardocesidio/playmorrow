import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { DevlogsModule } from './devlogs.module';
import { GamesModule } from '../games/games.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { StudiosModule } from '../studios/studios.module';
import { UsersModule } from '../users/users.module';
import { MockEmailModule } from '../test/mock-email-service';
import { registerTestUser } from '../test/register-test-user';
import { createTestApp } from '../test/create-test-app';

const SUFFIX = `dl-${Date.now()}`;
const OWNER_EMAIL = `own_${SUFFIX}@example.com`;
const MEMBER_EMAIL = `mem_${SUFFIX}@example.com`;
const NON_EMAIL = `non_${SUFFIX}@example.com`;
const ADMIN_EMAIL = `adm_${SUFFIX}@example.com`;
const PASSWORD = 'StrongPass123!';
const STUDIO_SLUG = `studio-${SUFFIX}`;
const GAME_SLUG = `game-${SUFFIX}`;
const DEVLOG_SLUG = `devlog-${SUFFIX}`;
const DRAFT_SLUG = `draft-${SUFFIX}`;

function cleanEmail(e: string) {
  return e.toLowerCase();
}

describe('DevlogsController (e2e)', () => {
  let app: TestingModule;
  let httpServer: unknown;
  let prisma: PrismaService;
  let ownerToken: string;
  let memberToken: string;
  let nonToken: string;
  let adminToken: string;
  let ownerUsername: string;
  let devlogId: string;
  let draftId: string;

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
          MockEmailModule,
          ScheduleModule.forRoot(),
        ],
      }),
    );
    app = result.app;
    httpServer = result.httpServer;
    prisma = result.app.get(PrismaService);

    // Register users
    const owner = await registerTestUser(httpServer, prisma, OWNER_EMAIL, PASSWORD);
    ownerToken = owner.sessionCookie;
    ownerUsername = owner.username;

    const member = await registerTestUser(httpServer, prisma, MEMBER_EMAIL, PASSWORD);
    memberToken = member.sessionCookie;

    const non = await registerTestUser(httpServer, prisma, NON_EMAIL, PASSWORD);
    nonToken = non.sessionCookie;

    const admin = await registerTestUser(httpServer, prisma, ADMIN_EMAIL, PASSWORD);
    adminToken = admin.sessionCookie;
    await prisma.user.update({ where: { email: cleanEmail(ADMIN_EMAIL) }, data: { role: 'ADMIN' } });

    // Create studio as owner
    const studioCreateRes = await request(httpServer)
      .post('/api/studios')
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ name: 'Devlog Test Studio', slug: STUDIO_SLUG });
    if (studioCreateRes.status !== 201) {
      throw new Error(`Create studio returned ${studioCreateRes.status}: ${JSON.stringify(studioCreateRes.body)}`);
    }

    // Add member
    const studioRec = await prisma.studio.findUnique({ where: { slug: STUDIO_SLUG } });
    const memberUser = await prisma.user.findUnique({ where: { email: cleanEmail(MEMBER_EMAIL) } });
    if (studioRec && memberUser) {
      await prisma.studioMember.create({
        data: { studioId: studioRec.id, userId: memberUser.id, role: 'MEMBER' },
      });
    }

    // Create game as owner
    const gameCreateRes = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Devlog Test Game', slug: GAME_SLUG });
    if (gameCreateRes.status !== 201) {
      throw new Error(`Create game returned ${gameCreateRes.status}: ${JSON.stringify(gameCreateRes.body)}`);
    }
  });

  afterAll(async () => {
    if (prisma) {
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

  it('POST /api/games/:gameSlug/devlogs rejects unauthenticated', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .send({ title: 'Test', slug: 'test', body: 'Body' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/games/:gameSlug/devlogs rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Cookie', `playmorrow_session=${nonToken}`)
      .send({ title: 'Test', slug: 'test-1', body: 'Body' });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('POST /api/games/:gameSlug/devlogs rejects MEMBER role with 403', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Cookie', `playmorrow_session=${memberToken}`)
      .send({ title: 'Test', slug: 'test-2', body: 'Body' });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('POST /api/games/:gameSlug/devlogs allows studio OWNER', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({
        title: 'Combat prototype update',
        slug: DEVLOG_SLUG,
        body: 'This is a long devlog body about the combat prototype update.',
        isPublished: true,
      });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.title).toBe('Combat prototype update');
    expect(res.body.slug).toBe(DEVLOG_SLUG);
    expect(res.body.isPublished).toBe(true);
    expect(res.body.publishedAt).toBeTruthy();
    expect(res.body.game.slug).toBe(GAME_SLUG);
    expect(res.body.author.username).toBe(ownerUsername);
    devlogId = res.body.id;
  });

  it('POST /api/games/:gameSlug/devlogs allows global ADMIN', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Cookie', `playmorrow_session=${adminToken}`)
      .send({
        title: 'Admin devlog',
        slug: DRAFT_SLUG,
        body: 'Admin wrote this',
        isPublished: false,
      });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.isPublished).toBe(false);
    expect(res.body.publishedAt).toBeNull();
    draftId = res.body.id;
  });

  it('POST /api/games/:gameSlug/devlogs rejects unknown game with 404', async () => {
    const res = await request(httpServer)
      .post('/api/games/unknown-game/devlogs')
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Test', slug: 'test-3', body: 'Body' });
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('POST /api/games/:gameSlug/devlogs rejects duplicate devlog slug with 409', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/devlogs`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Duplicate', slug: DEVLOG_SLUG, body: 'Body' });
    expect(res.status).toBe(HttpStatus.CONFLICT);
  });

  // ── LIST BY GAME ───────────────────────────────────────────────────────

  it('GET /api/games/:gameSlug/devlogs lists published devlogs', async () => {
    const res = await request(httpServer).get(`/api/games/${GAME_SLUG}/devlogs`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items.some((d: { slug: string }) => d.slug === DEVLOG_SLUG)).toBe(true);
  });

  it('GET /api/games/:gameSlug/devlogs does not list drafts publicly', async () => {
    const res = await request(httpServer).get(`/api/games/${GAME_SLUG}/devlogs`);
    expect(res.status).toBe(HttpStatus.OK);
    const draftFound = res.body.items.some((d: { slug: string }) => d.slug === DRAFT_SLUG);
    expect(draftFound).toBe(false);
  });

  // ── GLOBAL FEED ────────────────────────────────────────────────────────

  it('GET /api/devlogs lists latest published devlogs', async () => {
    const res = await request(httpServer).get('/api/devlogs');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items.some((d: { slug: string }) => d.slug === DEVLOG_SLUG)).toBe(true);
  });

  it('GET /api/devlogs does not list drafts publicly', async () => {
    const res = await request(httpServer).get('/api/devlogs');
    expect(res.status).toBe(HttpStatus.OK);
    const draftFound = res.body.items.some((d: { slug: string }) => d.slug === DRAFT_SLUG);
    expect(draftFound).toBe(false);
  });

  // ── GET BY ID ──────────────────────────────────────────────────────────

  it('GET /api/devlogs/:id returns published devlog', async () => {
    const res = await request(httpServer).get(`/api/devlogs/${devlogId}`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.id).toBe(devlogId);
    expect(res.body.title).toBe('Combat prototype update');
    expect(res.body.game.slug).toBe(GAME_SLUG);
    expect(res.body.author).toBeDefined();
  });

  it('GET /api/devlogs/:id returns 404 for missing devlog', async () => {
    const res = await request(httpServer).get('/api/devlogs/nonexistent-id');
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('GET /api/devlogs/:id returns draft as hidden/404 for public user', async () => {
    const res = await request(httpServer).get(`/api/devlogs/${draftId}`);
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('GET /api/devlogs/:id returns draft visible to authorized owner', async () => {
    const res = await request(httpServer)
      .get(`/api/devlogs/${draftId}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.id).toBe(draftId);
    expect(res.body.isPublished).toBe(false);
  });

  // ── PATCH ──────────────────────────────────────────────────────────────

  it('PATCH /api/devlogs/:id rejects unauthenticated', async () => {
    const res = await request(httpServer)
      .patch(`/api/devlogs/${devlogId}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /api/devlogs/:id rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .patch(`/api/devlogs/${devlogId}`)
      .set('Cookie', `playmorrow_session=${nonToken}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('PATCH /api/devlogs/:id rejects MEMBER role with 403', async () => {
    const res = await request(httpServer)
      .patch(`/api/devlogs/${devlogId}`)
      .set('Cookie', `playmorrow_session=${memberToken}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('PATCH /api/devlogs/:id allows studio OWNER/ADMIN', async () => {
    const res = await request(httpServer)
      .patch(`/api/devlogs/${devlogId}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Updated title' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.title).toBe('Updated title');
  });

  it('PATCH /api/devlogs/:id allows global ADMIN', async () => {
    const res = await request(httpServer)
      .patch(`/api/devlogs/${devlogId}`)
      .set('Cookie', `playmorrow_session=${adminToken}`)
      .send({ title: 'Admin updated' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.title).toBe('Admin updated');
  });

  it('PATCH /api/devlogs/:id can publish a draft', async () => {
    expect(draftId).toBeTruthy();

    const res = await request(httpServer)
      .patch(`/api/devlogs/${draftId}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ isPublished: true });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.isPublished).toBe(true);
    expect(res.body.publishedAt).toBeTruthy();
  });

  it('PATCH /api/devlogs/:id can unpublish a devlog', async () => {
    const res = await request(httpServer)
      .patch(`/api/devlogs/${devlogId}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ isPublished: false });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.isPublished).toBe(false);
    expect(res.body.publishedAt).toBeNull();
  });

  // ── SECURITY ───────────────────────────────────────────────────────────

  it('Response never exposes passwordHash', async () => {
    const res = await request(httpServer).get(`/api/devlogs/${devlogId}`);
    expect(res.body.passwordHash).toBeUndefined();

    // Also check from list endpoint
    const listRes = await request(httpServer).get(`/api/games/${GAME_SLUG}/devlogs`);
    for (const item of listRes.body.items) {
      expect(item.passwordHash).toBeUndefined();
    }
  });
});
