import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

vi.setConfig({ hookTimeout: 30_000 });
import request from 'supertest';

import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { UsersModule } from '../users/users.module';
import { GamesModule } from './games.module';
import { StudiosModule } from '../studios/studios.module';
import { EventBusModule } from '../common/event-bus.module';
import { EventBus } from '../common/event-bus';
import { SearchModule } from '../search/search.module';
import { MockEmailModule } from '../test/mock-email-service';
import { registerTestUser } from '../test/register-test-user';
import { createTestApp } from '../test/create-test-app';

const SUFFIX = `g-${Date.now()}`;
const OWNER_EMAIL = `owner_${SUFFIX}@example.com`;
const MEMBER_EMAIL = `member_${SUFFIX}@example.com`;
const NON_MEMBER_EMAIL = `nonmem_${SUFFIX}@example.com`;
const ADMIN_EMAIL = `admin_${SUFFIX}@example.com`;
const PASSWORD = 'StrongPass123!';
const STUDIO_SLUG = `studio-${SUFFIX}`;
const GAME_SLUG = `game-${SUFFIX}`;
const MODERATOR_EMAIL = `moderator_${SUFFIX}@example.com`;
const INCOMPLETE_SLUG = `incomplete-${SUFFIX}`;
const CANCELLED_SLUG = `cancelled-${SUFFIX}`;
const FORGE_SLUG = `forge-${SUFFIX}`;
const ADMIN_PUB_SLUG = `adminpub-${SUFFIX}`;
const MODERATOR_PUB_SLUG = `moderatorpub-${SUFFIX}`;

function cleanEmail(e: string): string {
  return e.toLowerCase();
}

describe('GamesController (e2e)', () => {
  let app: TestingModule;
  let httpServer: unknown;
  let prisma: PrismaService;
  let ownerToken: string;
  let memberToken: string;
  let nonMemberToken: string;
  let adminToken: string;
  let moderatorToken: string;

  beforeAll(async () => {
    const result = await createTestApp(
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', 'apps/api/.env'] }),
          PrismaModule,
          UsersModule,
          AuthModule,
          EventBusModule,
          NotificationsModule,
          MockEmailModule,
          ScheduleModule.forRoot(),
          StudiosModule,
          GamesModule,
          SearchModule,
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

    const nonMember = await registerTestUser(httpServer, prisma, NON_MEMBER_EMAIL, PASSWORD);
    nonMemberToken = nonMember.sessionCookie;

    const admin = await registerTestUser(httpServer, prisma, ADMIN_EMAIL, PASSWORD);
    adminToken = admin.sessionCookie;
    await prisma.user.update({ where: { email: cleanEmail(ADMIN_EMAIL) }, data: { role: 'ADMIN' } });

    const moderator = await registerTestUser(httpServer, prisma, MODERATOR_EMAIL, PASSWORD);
    moderatorToken = moderator.sessionCookie;

    // Create studio as owner
    await request(httpServer)
      .post('/api/studios')
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ name: 'Game Test Studio', slug: STUDIO_SLUG, tagline: 'Studio for game tests' });

    // Add member user as MEMBER
    const studioRec = await prisma.studio.findUnique({ where: { slug: STUDIO_SLUG } });
    const memberUser = await prisma.user.findUnique({ where: { email: cleanEmail(MEMBER_EMAIL) } });
    if (studioRec && memberUser) {
      await prisma.studioMember.create({
        data: { studioId: studioRec.id, userId: memberUser.id, role: 'MEMBER' },
      });
    }

    // Add moderator user as MODERATOR
    const moderatorUser = await prisma.user.findUnique({ where: { email: cleanEmail(MODERATOR_EMAIL) } });
    if (studioRec && moderatorUser) {
      await prisma.studioMember.create({
        data: { studioId: studioRec.id, userId: moderatorUser.id, role: 'MODERATOR' },
      });
    }
  });

  afterAll(async () => {
    if (prisma) {
      const testUserIds = (
        await prisma.user.findMany({
          where: { email: { startsWith: cleanEmail(SUFFIX) } },
          select: { id: true },
        })
      ).map((u) => u.id);

      if (testUserIds.length > 0) {
        // Delete game media, platform links, game tags
        await prisma.gameMedia.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
        await prisma.platformLink.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
        await prisma.gameTag.deleteMany({ where: { game: { slug: { contains: SUFFIX } } } });
        // Delete games
        await prisma.game.deleteMany({ where: { slug: { contains: SUFFIX } } });
        // Delete studios (cascades members)
        await prisma.studio.deleteMany({ where: { slug: { contains: SUFFIX } } });
        // Delete test users
        await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
      }

      await prisma.$disconnect();
    }
  });

  // ── CREATE ──────────────────────────────────────────────────────────────

  it('POST /api/studios/:studioSlug/games rejects unauthenticated', async () => {
    const res = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .send({ title: 'Test Game', slug: 'test-game' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/studios/:studioSlug/games rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${nonMemberToken}`)
      .send({ title: 'Test Game', slug: `test-game-1-${SUFFIX}` });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('POST /api/studios/:studioSlug/games allows MEMBER role', async () => {
    const res = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${memberToken}`)
      .send({ title: 'Test Game', slug: `test-game-2-${SUFFIX}` });
    expect(res.status).toBe(HttpStatus.CREATED);
  });

  it('POST /api/studios/:studioSlug/games allows studio OWNER', async () => {
    const res = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({
        title: 'Echoes of the Deep',
        slug: GAME_SLUG,
        tagline: 'An underwater adventure',
        description: 'Full description',
        status: 'IN_DEVELOPMENT',
        releaseDate: '2027-03-01T00:00:00.000Z',
        expectedReleaseText: 'Q4 2026',
        priceCents: 1999,
        currency: 'USD',
        isFree: false,
        coverUrl: 'https://example.com/cover.jpg',
        platformLinks: [
          { platform: 'STEAM', url: 'https://store.steampowered.com/app/example', label: 'Wishlist' },
        ],
        media: [
          { type: 'SCREENSHOT', url: 'https://example.com/screen1.jpg', caption: 'Ruins', sortOrder: 0 },
        ],
        tags: ['adventure', 'exploration'],
      });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.title).toBe('Echoes of the Deep');
    expect(res.body.slug).toBe(GAME_SLUG);
    expect(res.body.tagline).toBe('An underwater adventure');
    expect(res.body.status).toBe('IN_DEVELOPMENT');
    expect(res.body.priceCents).toBe(1999);
    expect(res.body.coverUrl).toBe('https://example.com/cover.jpg');
    expect(res.body.studio).toBeDefined();
    expect(res.body.studio.slug).toBe(STUDIO_SLUG);
  });

  it('POST creates media records', async () => {
    const game = await prisma.game.findUnique({
      where: { slug: GAME_SLUG },
      include: { media: true },
    });
    expect(game?.media.length).toBe(1);
    expect(game?.media[0].type).toBe('SCREENSHOT');
    expect(game?.media[0].url).toBe('https://example.com/screen1.jpg');
  });

  it('POST creates platform links', async () => {
    const game = await prisma.game.findUnique({
      where: { slug: GAME_SLUG },
      include: { platformLinks: true },
    });
    expect(game?.platformLinks.length).toBe(1);
    expect(game?.platformLinks[0].kind).toBe('STEAM');
  });

  it('POST creates/connects tags', async () => {
    const game = await prisma.game.findUnique({
      where: { slug: GAME_SLUG },
      include: { tags: { include: { tag: true } } },
    });
    expect(game?.tags.length).toBe(2);
    const tagSlugs = game?.tags.map((gt) => gt.tag.slug).sort();
    expect(tagSlugs).toEqual(['adventure', 'exploration']);
  });

  it('POST rejects duplicate game slug with 409', async () => {
    const res = await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Duplicate Game', slug: GAME_SLUG });
    expect(res.status).toBe(HttpStatus.CONFLICT);
  });

  // ── LIST by studio ──────────────────────────────────────────────────────

  it('GET /api/studios/:studioSlug/games lists studio games', async () => {
    const res = await request(httpServer).get(`/api/studios/${STUDIO_SLUG}/games`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items.some((g: { slug: string }) => g.slug === GAME_SLUG)).toBe(true);
  });

  // ── LIST all ────────────────────────────────────────────────────────────

  it('GET /api/games excludes unpublished drafts', async () => {
    const res = await request(httpServer).get('/api/games');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.some((g: { slug: string }) => g.slug === GAME_SLUG)).toBe(false);
    expect(res.body.items.some((g: { slug: string }) => g.slug === `test-game-2-${SUFFIX}`)).toBe(false);
  });

  it('GET /api/games search query also excludes unpublished drafts', async () => {
    const res = await request(httpServer).get('/api/games?search=Echoes');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.some((g: { slug: string }) => g.slug === GAME_SLUG)).toBe(false);
  });

  // ── GET by slug ─────────────────────────────────────────────────────────

  it('GET /api/games/:slug returns game with studio/media/platformLinks/tags', async () => {
    const res = await request(httpServer).get(`/api/games/${GAME_SLUG}`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.title).toBe('Echoes of the Deep');
    expect(res.body.studio.slug).toBe(STUDIO_SLUG);
    expect(res.body.media.length).toBe(1);
    expect(res.body.platformLinks.length).toBe(1);
    expect(res.body.tags).toContain('adventure');
    expect(res.body.tags).toContain('exploration');
  });

  it('GET /api/games/:missing returns 404', async () => {
    const res = await request(httpServer).get('/api/games/nonexistent-game');
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  // ── PATCH ───────────────────────────────────────────────────────────────

  it('PATCH /api/games/:slug rejects unauthenticated', async () => {
    const res = await request(httpServer)
      .patch(`/api/games/${GAME_SLUG}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /api/games/:slug rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .patch(`/api/games/${GAME_SLUG}`)
      .set('Cookie', `playmorrow_session=${nonMemberToken}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('PATCH /api/games/:slug allows MEMBER role', async () => {
    const res = await request(httpServer)
      .patch(`/api/games/${GAME_SLUG}`)
      .set('Cookie', `playmorrow_session=${memberToken}`)
      .send({ title: 'Member Updated' });
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.title).toBe('Member Updated');
  });

  it('PATCH /api/games/:slug allows studio OWNER', async () => {
    const res = await request(httpServer)
      .patch(`/api/games/${GAME_SLUG}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Updated Title', tagline: 'Updated tagline', priceCents: 2499 });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.title).toBe('Updated Title');
    expect(res.body.tagline).toBe('Updated tagline');
    expect(res.body.priceCents).toBe(2499);
    expect(res.body.slug).toBe(GAME_SLUG);
  });

  it('PATCH /api/games/:slug allows global ADMIN', async () => {
    const res = await request(httpServer)
      .patch(`/api/games/${GAME_SLUG}`)
      .set('Cookie', `playmorrow_session=${adminToken}`)
      .send({ title: 'Admin Updated' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.title).toBe('Admin Updated');
  });

  it('PATCH /api/games/:slug cannot change slug or studio', async () => {
    // Slug should be immutable; studioId changes are silently ignored (not in DTO)
    const res = await request(httpServer)
      .patch(`/api/games/${GAME_SLUG}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Final Title' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.slug).toBe(GAME_SLUG); // unchanged
    expect(res.body.title).toBe('Final Title');

    // Verify slug unchanged in DB
    const game = await prisma.game.findUnique({ where: { slug: GAME_SLUG } });
    expect(game).toBeDefined();
    expect(game!.slug).toBe(GAME_SLUG);
  });

  // ── SECURITY ────────────────────────────────────────────────────────────

  it('Returned game responses do not expose user passwordHash', async () => {
    const res = await request(httpServer).get(`/api/games/${GAME_SLUG}`);
    expect(res.body.passwordHash).toBeUndefined();
  });

  // ── PUBLISH ─────────────────────────────────────────────────────────────

  it('POST /api/games/:slug/publish rejects unauthenticated', async () => {
    const res = await request(httpServer).post(`/api/games/${GAME_SLUG}/publish`);
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/games/:slug/publish rejects non-member with 403', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${nonMemberToken}`);
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('POST /api/games/:slug/publish rejects MEMBER role with 403', async () => {
    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${memberToken}`);
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('POST /api/games/:slug/publish returns 404 for a missing game', async () => {
    const res = await request(httpServer)
      .post(`/api/games/missing-${SUFFIX}/publish`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('POST /api/games/:slug/publish returns 400 with missing list for an incomplete game', async () => {
    // Create a title-only game (incomplete)
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Incomplete Game', slug: INCOMPLETE_SLUG })
      .expect(HttpStatus.CREATED);

    const res = await request(httpServer)
      .post(`/api/games/${INCOMPLETE_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    expect(String(res.body.message)).toContain('Game is not ready to publish');
    expect(String(res.body.message)).toContain('tagline');
    expect(String(res.body.message)).toContain('description');
    expect(String(res.body.message)).toContain('screenshot');
  });

  it('POST /api/games/:slug/publish rejects CANCELLED games with 400', async () => {
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Cancelled Game', slug: CANCELLED_SLUG, status: 'CANCELLED' })
      .expect(HttpStatus.CREATED);

    const res = await request(httpServer)
      .post(`/api/games/${CANCELLED_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('POST /api/games/:slug/publish allows studio OWNER and persists metadata', async () => {
    const gameBefore = await prisma.game.findUnique({ where: { slug: GAME_SLUG } });
    expect(gameBefore?.isPublished).toBe(false);

    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.isPublished).toBe(true);

    const gameAfter = await prisma.game.findUnique({ where: { slug: GAME_SLUG } });
    expect(gameAfter?.isPublished).toBe(true);
    expect(gameAfter?.publishedAt).not.toBeNull();
    expect(gameAfter?.publishedBy).not.toBeNull();
  });

  it('POST /api/games/:slug/publish is idempotent (no re-stamp on second call)', async () => {
    const before = await prisma.game.findUnique({ where: { slug: GAME_SLUG } });

    const res = await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    const after = await prisma.game.findUnique({ where: { slug: GAME_SLUG } });
    expect(after?.isPublished).toBe(true);
    expect(after?.publishedAt?.toISOString()).toBe(before?.publishedAt?.toISOString());
  });

  it('POST /api/games/:slug/publish writes a GAME_PUBLISHED audit log entry', async () => {
    const game = await prisma.game.findUnique({ where: { slug: GAME_SLUG } });
    const entry = await prisma.auditLog.findFirst({
      where: { action: 'GAME_PUBLISHED', targetId: game?.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(entry).not.toBeNull();
    expect(entry?.targetType).toBe('GAME');
  });

  it('POST /api/games/:slug/publish emits a game_published event on the real transition', async () => {
    const eventBus = app.get(EventBus);
    const received: string[] = [];
    const handler = (e: { type: string; gameId?: string }) => {
      if (e.type === 'game_published') received.push(e.type);
    };
    eventBus.on('game_published', handler);

    // Already published (idempotent) — no new event expected.
    await request(httpServer)
      .post(`/api/games/${GAME_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .expect(HttpStatus.OK);
    expect(received).toHaveLength(0);

    // Publish a fresh game — exactly one event.
    const freshSlug = `fresh-${SUFFIX}`;
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({
        title: 'Fresh Publish Game',
        slug: freshSlug,
        tagline: 'Fresh tagline',
        description: 'Fresh description',
        coverUrl: 'https://example.com/fresh-cover.jpg',
        platformLinks: [{ platform: 'STEAM', url: 'https://store.steampowered.com/app/fresh' }],
        media: [{ type: 'SCREENSHOT', url: 'https://example.com/fresh-screen.jpg' }],
        tags: ['adventure'],
      })
      .expect(HttpStatus.CREATED);

    // NOTE: games.service create() also emits game_published (pre-existing
    // behavior at games.service.ts:147) — reset the capture so we only count
    // events caused by the publish call itself.
    received.length = 0;

    await request(httpServer)
      .post(`/api/games/${freshSlug}/publish`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .expect(HttpStatus.OK);

    expect(received).toHaveLength(1);
  });

  it('POST /api/games/:slug/publish allows global ADMIN', async () => {
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({
        title: 'Admin Publish Game',
        slug: ADMIN_PUB_SLUG,
        tagline: 'Admin tagline',
        description: 'Admin description',
        coverUrl: 'https://example.com/admin-cover.jpg',
        platformLinks: [{ platform: 'STEAM', url: 'https://store.steampowered.com/app/admin' }],
        media: [{ type: 'SCREENSHOT', url: 'https://example.com/admin-screen.jpg' }],
        tags: ['adventure'],
      })
      .expect(HttpStatus.CREATED);

    const res = await request(httpServer)
      .post(`/api/games/${ADMIN_PUB_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${adminToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.isPublished).toBe(true);
  });

  it('POST /api/games/:slug/publish allows studio MODERATOR', async () => {
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({
        title: 'Moderator Publish Game',
        slug: MODERATOR_PUB_SLUG,
        tagline: 'Moderator tagline',
        description: 'Moderator description',
        coverUrl: 'https://example.com/moderator-cover.jpg',
        platformLinks: [{ platform: 'STEAM', url: 'https://store.steampowered.com/app/moderator' }],
        media: [{ type: 'SCREENSHOT', url: 'https://example.com/moderator-screen.jpg' }],
        tags: ['adventure'],
      })
      .expect(HttpStatus.CREATED);

    const res = await request(httpServer)
      .post(`/api/games/${MODERATOR_PUB_SLUG}/publish`)
      .set('Cookie', `playmorrow_session=${moderatorToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.isPublished).toBe(true);
  });

  it('published games appear in the public catalog and search', async () => {
    const catalogRes = await request(httpServer).get('/api/games');
    expect(catalogRes.status).toBe(HttpStatus.OK);
    expect(catalogRes.body.items.some((g: { slug: string }) => g.slug === GAME_SLUG)).toBe(true);

    const searchRes = await request(httpServer).get(`/api/search?q=${encodeURIComponent('Final Title')}`);
    expect(searchRes.status).toBe(HttpStatus.OK);
    expect(searchRes.body.games?.items?.some((g: { slug: string }) => g.slug === GAME_SLUG)).toBe(true);
  });

  it('forged isPublished in PATCH body is rejected and never publishes', async () => {
    await request(httpServer)
      .post(`/api/studios/${STUDIO_SLUG}/games`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ title: 'Forge Target', slug: FORGE_SLUG })
      .expect(HttpStatus.CREATED);

    // forbidNonWhitelisted:true → unknown property is rejected with 400.
    const res = await request(httpServer)
      .patch(`/api/games/${FORGE_SLUG}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ isPublished: true });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);

    const game = await prisma.game.findUnique({ where: { slug: FORGE_SLUG } });
    expect(game?.isPublished).toBe(false);
  });
});
