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
import { PressKitsModule } from './press-kits.module';

const SUFFIX = `pk_${Date.now()}`;
const OWNER_EMAIL = `own_${SUFFIX}@example.com`;
const OWNER_USERNAME = `own_${SUFFIX}`;
const MEMBER_EMAIL = `mem_${SUFFIX}@example.com`;
const MEMBER_USERNAME = `mem_${SUFFIX}`;
const NON_EMAIL = `non_${SUFFIX}@example.com`;
const NON_USERNAME = `non_${SUFFIX}`;
const ADMIN_EMAIL = `adm_${SUFFIX}@example.com`;
const ADMIN_USERNAME = `adm_${SUFFIX}`;
const PASSWORD = 'StrongPass123!';
const STUDIO_SLUG = `studio-${SUFFIX}`;
const GAME_SLUG = `game-${SUFFIX}`;

function cleanEmail(e: string) {
  return e.toLowerCase();
}

describe('PressKitsController (e2e)', () => {
  let app: TestingModule;
  let httpServer: unknown;
  let prisma: PrismaService;
  let ownerToken: string;
  let memberToken: string;
  let nonToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', 'apps/api/.env'] }),
        PrismaModule,
        UsersModule,
        AuthModule,
        StudiosModule,
        GamesModule,
        PressKitsModule,
      ],
    }).compile();

    const nestApp = app.createNestApplication();
    nestApp.setGlobalPrefix('api', { exclude: ['health'] });
    await nestApp.init();
    httpServer = nestApp.getHttpServer();
    prisma = app.get(PrismaService);

    const ownerRes = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: OWNER_EMAIL, username: OWNER_USERNAME, displayName: 'Owner', password: PASSWORD });
    ownerToken = ownerRes.body.accessToken;

    const memberRes = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: MEMBER_EMAIL, username: MEMBER_USERNAME, displayName: 'Member', password: PASSWORD });
    memberToken = memberRes.body.accessToken;

    const nonRes = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: NON_EMAIL, username: NON_USERNAME, displayName: 'Non', password: PASSWORD });
    nonToken = nonRes.body.accessToken;

    const adminRes = await request(httpServer)
      .post('/api/auth/register')
      .send({ email: ADMIN_EMAIL, username: ADMIN_USERNAME, displayName: 'Admin', password: PASSWORD });
    adminToken = adminRes.body.accessToken;
    await prisma.user.update({ where: { email: cleanEmail(ADMIN_EMAIL) }, data: { role: 'ADMIN' } });

    await request(httpServer)
      .post('/api/studios')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'PK Test Studio', slug: STUDIO_SLUG });

    const studioRec = await prisma.studio.findUnique({ where: { slug: STUDIO_SLUG } });
    const memberUser = await prisma.user.findUnique({ where: { email: cleanEmail(MEMBER_EMAIL) } });
    if (studioRec && memberUser) {
      await prisma.studioMember.create({
        data: { studioId: studioRec.id, userId: memberUser.id, role: 'MEMBER' },
      });
    }

    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'PK Test Game',
        slug: GAME_SLUG,
        coverUrl: 'https://example.com/cover.jpg',
        platformLinks: [{ platform: 'STEAM', url: 'https://store.steampowered.com/example' }],
        media: [{ type: 'SCREENSHOT', url: 'https://example.com/screen.jpg', sortOrder: 0 }],
        tags: ['adventure'],
      });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.pressKit.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.follow.deleteMany({ where: { user: { email: { startsWith: cleanEmail(SUFFIX) } } } });
      await prisma.roadmapItem.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.devlog.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.gameMedia.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.platformLink.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.gameTag.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
      await prisma.game.deleteMany({ where: { slug: { contains: SUFFIX } } });
      await prisma.studio.deleteMany({ where: { slug: { contains: SUFFIX } } });
      await prisma.user.deleteMany({ where: { email: { startsWith: cleanEmail(SUFFIX) } } });
      await prisma.$disconnect();
    }
  });

  // ── UPSERT (CREATE / UPDATE), PUT returns 200 by default ───────────────

  it('PUT /api/games/:gameSlug/press-kit rejects unauthenticated', async () => {
    const res = await request(httpServer)
      .put(`/api/games/${GAME_SLUG}/press-kit`)
      .send({ headline: 'Test' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PUT rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .put(`/api/games/${GAME_SLUG}/press-kit`)
      .set('Authorization', `Bearer ${nonToken}`)
      .send({ headline: 'Test' });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('PUT rejects MEMBER role with 403', async () => {
    const res = await request(httpServer)
      .put(`/api/games/${GAME_SLUG}/press-kit`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ headline: 'Test' });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('PUT allows studio OWNER', async () => {
    const res = await request(httpServer)
      .put(`/api/games/${GAME_SLUG}/press-kit`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        headline: 'A hand-painted exploration game',
        factSheet: { developer: 'Moonlit Forge', releaseDate: 'Q4 2026', platforms: ['PC'] },
        contactEmail: 'press@example.com',
        downloadUrl: 'https://drive.google.com/example',
      });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.headline).toBe('A hand-painted exploration game');
    expect(res.body.contactEmail).toBe('press@example.com');
    expect(res.body.game.slug).toBe(GAME_SLUG);
    expect(res.body.studio.slug).toBe(STUDIO_SLUG);
    expect(res.body.media.length).toBeGreaterThanOrEqual(1);
    expect(res.body.platformLinks.length).toBeGreaterThanOrEqual(1);
    expect(res.body.tags).toContain('adventure');
    expect(res.body.isAutoGenerated).toBe(false);
  });

  it('PUT allows global ADMIN', async () => {
    const res = await request(httpServer)
      .put(`/api/games/${GAME_SLUG}/press-kit`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ headline: 'Admin headline' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.headline).toBe('Admin headline');
  });

  it('PUT rejects unknown game with 404', async () => {
    const res = await request(httpServer)
      .put('/api/games/unknown-game/press-kit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ headline: 'Test' });
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('PUT creates press kit', async () => {
    // Should use a second game to test fresh creation
    const game2Slug = `game2-${SUFFIX}`;
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Second Game', slug: game2Slug });

    const res = await request(httpServer)
      .put(`/api/games/${game2Slug}/press-kit`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ headline: 'Brand new press kit' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.headline).toBe('Brand new press kit');
  });

  it('PUT updates existing press kit idempotently', async () => {
    const res = await request(httpServer)
      .put(`/api/games/${GAME_SLUG}/press-kit`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        headline: 'Updated headline',
        contactEmail: 'updated@example.com',
      });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.headline).toBe('Updated headline');
    expect(res.body.contactEmail).toBe('updated@example.com');
  });

  // ── GET ────────────────────────────────────────────────────────────────

  it('GET /api/games/:gameSlug/press-kit returns public press kit', async () => {
    const res = await request(httpServer).get(`/api/games/${GAME_SLUG}/press-kit`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.headline).toBe('Updated headline');
    expect(res.body.game.slug).toBe(GAME_SLUG);
    expect(res.body.studio.slug).toBe(STUDIO_SLUG);
  });

  it('GET includes game summary', async () => {
    const res = await request(httpServer).get(`/api/games/${GAME_SLUG}/press-kit`);
    expect(res.body.game.title).toBe('PK Test Game');
    expect(res.body.game.coverUrl).toBe('https://example.com/cover.jpg');
    expect(res.body.game.priceCents).toBeNull();
  });

  it('GET includes studio summary', async () => {
    const res = await request(httpServer).get(`/api/games/${GAME_SLUG}/press-kit`);
    expect(res.body.studio.name).toBe('PK Test Studio');
    expect(res.body.studio.slug).toBe(STUDIO_SLUG);
  });

  it('GET includes media/platformLinks/tags', async () => {
    const res = await request(httpServer).get(`/api/games/${GAME_SLUG}/press-kit`);
    expect(res.body.media.length).toBeGreaterThanOrEqual(1);
    expect(res.body.platformLinks.length).toBeGreaterThanOrEqual(1);
    expect(res.body.tags).toContain('adventure');
  });

  it('GET /api/games/:missing/press-kit returns 404', async () => {
    const res = await request(httpServer).get('/api/games/unknown-game/press-kit');
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('GET /api/games/:slug/press-kit returns 404 if no press kit exists', async () => {
    const noPkSlug = `no-pk-${SUFFIX}`;
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'No PK Game', slug: noPkSlug });

    const res = await request(httpServer).get(`/api/games/${noPkSlug}/press-kit`);
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('Response never exposes passwordHash', async () => {
    const res = await request(httpServer).get(`/api/games/${GAME_SLUG}/press-kit`);
    expect(res.body.passwordHash).toBeUndefined();
  });
});
