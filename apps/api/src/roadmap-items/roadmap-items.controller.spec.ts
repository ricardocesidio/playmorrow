import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { AuthModule } from '../auth/auth.module';
import { GamesModule } from '../games/games.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { StudiosModule } from '../studios/studios.module';
import { UsersModule } from '../users/users.module';
import { RoadmapItemsModule } from './roadmap-items.module';
import { MockEmailModule } from '../test/mock-email-service';
import { registerTestUser } from '../test/register-test-user';
import { createTestApp } from '../test/create-test-app';

const SUFFIX = `rm_${Date.now()}`;
const OWNER_EMAIL = `own_${SUFFIX}@example.com`;
const MEMBER_EMAIL = `mem_${SUFFIX}@example.com`;
const NON_EMAIL = `non_${SUFFIX}@example.com`;
const ADMIN_EMAIL = `adm_${SUFFIX}@example.com`;
const PASSWORD = 'StrongPass123!';
const STUDIO_SLUG = `studio-${SUFFIX}`;
const GAME_SLUG = `game-${SUFFIX}`;

function cleanEmail(e: string) {
  return e.toLowerCase();
}

describe('RoadmapItemsController (e2e)', () => {
  let app: TestingModule;
  let httpServer: unknown;
  let prisma: PrismaService;
  let ownerToken: string;
  let memberToken: string;
  let nonToken: string;
  let adminToken: string;
  let itemId: string;

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
          RoadmapItemsModule,
          MockEmailModule,
        ],
      }),
    );
    app = result.app;
    httpServer = result.httpServer;
    prisma = result.app.get(PrismaService);

    // Register users
    const owner = await registerTestUser(httpServer, prisma, OWNER_EMAIL, PASSWORD);
    ownerToken = owner.sessionCookie;

    const member = await registerTestUser(httpServer, prisma, MEMBER_EMAIL, PASSWORD);
    memberToken = member.sessionCookie;

    const non = await registerTestUser(httpServer, prisma, NON_EMAIL, PASSWORD);
    nonToken = non.sessionCookie;

    const admin = await registerTestUser(httpServer, prisma, ADMIN_EMAIL, PASSWORD);
    adminToken = admin.sessionCookie;
    await prisma.user.update({ where: { email: cleanEmail(ADMIN_EMAIL) }, data: { role: 'ADMIN' } });

    // Create studio as owner
    await request(httpServer)
      .post('/api/studios')
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ name: 'Roadmap Test Studio', slug: STUDIO_SLUG });

    // Add member user as MEMBER
    const studioRec = await prisma.studio.findUnique({ where: { slug: STUDIO_SLUG } });
    const memberUser = await prisma.user.findUnique({ where: { email: cleanEmail(MEMBER_EMAIL) } });
    if (studioRec && memberUser) {
      await prisma.studioMember.create({
        data: { studioId: studioRec.id, userId: memberUser.id, role: 'MEMBER' },
      });
    }

    // Create game as owner
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Roadmap Test Game', slug: GAME_SLUG });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.roadmapItem.deleteMany({
        where: { game: { slug: { contains: SUFFIX } } },
      });
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

  it('POST /api/games/:gameSlug/roadmap rejects unauthenticated', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/roadmap`)
      .send({ title: 'Item' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/games/:gameSlug/roadmap rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/roadmap`)
      .set('Cookie', `playmorrow_session=${nonToken}`)
      .send({ title: 'Item' });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('POST /api/games/:gameSlug/roadmap rejects MEMBER role with 403', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/roadmap`)
      .set('Cookie', `playmorrow_session=${memberToken}`)
      .send({ title: 'Item' });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('POST /api/games/:gameSlug/roadmap allows studio OWNER', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/roadmap`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({
        title: 'Public demo',
        description: 'Release a playable demo',
        status: 'PLANNED',
        targetDate: '2027-01-15T00:00:00.000Z',
        position: 0,
      });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.title).toBe('Public demo');
    expect(res.body.description).toBe('Release a playable demo');
    expect(res.body.status).toBe('PLANNED');
    expect(res.body.position).toBe(0);
    expect(res.body.targetDate).toBeTruthy();
    expect(res.body.game.slug).toBe(GAME_SLUG);
    expect(res.body.studio.slug).toBe(STUDIO_SLUG);
    itemId = res.body.id;
  });

  it('POST /api/games/:gameSlug/roadmap allows global ADMIN', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/roadmap`)
      .set('Cookie', `playmorrow_session=${adminToken}`)
      .send({ title: 'Admin item', status: 'IN_PROGRESS', position: 1 });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.title).toBe('Admin item');
    expect(res.body.status).toBe('IN_PROGRESS');
  });

  it('POST /api/games/:gameSlug/roadmap rejects unknown game with 404', async () => {
    const res = await request(httpServer)
      .post('/api/games/unknown-game/roadmap')
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Item' });
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ── LIST BY GAME ───────────────────────────────────────────────────────

  it('GET /api/games/:gameSlug/roadmap lists roadmap items', async () => {
    const res = await request(httpServer).get(`/api/games/${GAME_SLUG}/roadmap`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.some((i: { title: string }) => i.title === 'Public demo')).toBe(true);
    expect(res.body.some((i: { title: string }) => i.title === 'Admin item')).toBe(true);
  });

  it('GET /api/games/:missing/roadmap returns 404', async () => {
    const res = await request(httpServer).get('/api/games/unknown-game/roadmap');
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ── GET BY ID ──────────────────────────────────────────────────────────

  it('GET /api/roadmap-items/:id returns item with game/studio summary', async () => {
    const res = await request(httpServer).get(`/api/roadmap-items/${itemId}`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.id).toBe(itemId);
    expect(res.body.title).toBe('Public demo');
    expect(res.body.game.slug).toBe(GAME_SLUG);
    expect(res.body.studio.slug).toBe(STUDIO_SLUG);
  });

  it('GET /api/roadmap-items/:missing returns 404', async () => {
    const res = await request(httpServer).get('/api/roadmap-items/nonexistent');
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ── PATCH ──────────────────────────────────────────────────────────────

  it('PATCH /api/roadmap-items/:id rejects unauthenticated', async () => {
    const res = await request(httpServer)
      .patch(`/api/roadmap-items/${itemId}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /api/roadmap-items/:id rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .patch(`/api/roadmap-items/${itemId}`)
      .set('Cookie', `playmorrow_session=${nonToken}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('PATCH /api/roadmap-items/:id rejects MEMBER role with 403', async () => {
    const res = await request(httpServer)
      .patch(`/api/roadmap-items/${itemId}`)
      .set('Cookie', `playmorrow_session=${memberToken}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('PATCH /api/roadmap-items/:id allows studio OWNER/ADMIN', async () => {
    const res = await request(httpServer)
      .patch(`/api/roadmap-items/${itemId}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Updated demo' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.title).toBe('Updated demo');
  });

  it('PATCH /api/roadmap-items/:id allows global ADMIN', async () => {
    const res = await request(httpServer)
      .patch(`/api/roadmap-items/${itemId}`)
      .set('Cookie', `playmorrow_session=${adminToken}`)
      .send({ title: 'Admin updated' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.title).toBe('Admin updated');
  });

  it('PATCH /api/roadmap-items/:id updates status', async () => {
    const res = await request(httpServer)
      .patch(`/api/roadmap-items/${itemId}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ status: 'DONE' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.status).toBe('DONE');
  });

  it('PATCH /api/roadmap-items/:id updates ordering field', async () => {
    const res = await request(httpServer)
      .patch(`/api/roadmap-items/${itemId}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ position: 5 });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.position).toBe(5);
  });

  // ── REORDER ────────────────────────────────────────────────────────────

  it('POST in test created two items; PATCH /games/:slug/roadmap/reorder reorders them', async () => {
    // Fetch existing items
    const listRes = await request(httpServer).get(`/api/games/${GAME_SLUG}/roadmap`);
    const items = listRes.body;
    expect(items.length).toBeGreaterThanOrEqual(2);

    const reorderPayload = items.map((item: { id: string }, i: number) => ({
      id: item.id,
      position: (items.length - 1 - i) * 10,
    }));

    const res = await request(httpServer)
      .patch(`/api/games/${GAME_SLUG}/roadmap/reorder`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ items: reorderPayload });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.reordered).toBe(items.length);

    // Verify positions updated
    const checkRes = await request(httpServer).get(`/api/games/${GAME_SLUG}/roadmap`);
    for (const item of checkRes.body) {
      const expected = reorderPayload.find((p: { id: string }) => p.id === item.id);
      expect(item.position).toBe(expected!.position);
    }
  });

  it('PATCH /api/games/:gameSlug/roadmap/reorder rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .patch(`/api/games/${GAME_SLUG}/roadmap/reorder`)
      .set('Cookie', `playmorrow_session=${nonToken}`)
      .send({ items: [] });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  // ── SECURITY ───────────────────────────────────────────────────────────

  it('Response never exposes passwordHash', async () => {
    const res = await request(httpServer).get(`/api/roadmap-items/${itemId}`);
    expect(res.body.passwordHash).toBeUndefined();

    const listRes = await request(httpServer).get(`/api/games/${GAME_SLUG}/roadmap`);
    for (const item of listRes.body) {
      expect(item.passwordHash).toBeUndefined();
    }
  });
});
