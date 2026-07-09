import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { UsersModule } from '../users/users.module';
import { StudiosModule } from './studios.module';
import { MockEmailModule } from '../test/mock-email-service';
import { registerTestUser } from '../test/register-test-user';
import { createTestApp } from '../test/create-test-app';

const TEST_SUFFIX = `st-${Date.now()}`;
const TEST_EMAIL = `${TEST_SUFFIX}@example.com`;
const TEST_PASSWORD = 'StrongPass123!';
const SECOND_EMAIL = `member_${TEST_SUFFIX}@example.com`;
const ADMIN_EMAIL = `admin_${TEST_SUFFIX}@example.com`;

function cleanEmail(email: string): string {
  return email.toLowerCase();
}

describe('StudiosController (e2e)', () => {
  let app: TestingModule;
  let httpServer: unknown;
  let prisma: PrismaService;
  let ownerToken: string;
  let ownerId: string;
  let secondToken: string;
  let adminToken: string;
  let studioSlug: string;

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
          StudiosModule,
          MockEmailModule,
        ],
      }),
    );
    app = result.app;
    httpServer = result.httpServer;
    prisma = result.app.get(PrismaService);

    // Register owner user
    const owner = await registerTestUser(httpServer, prisma, TEST_EMAIL, TEST_PASSWORD);
    ownerToken = owner.sessionCookie;
    ownerId = owner.userId;

    // Register second user (non-member)
    const second = await registerTestUser(httpServer, prisma, SECOND_EMAIL, TEST_PASSWORD);
    secondToken = second.sessionCookie;

    // Register admin user and promote
    const admin = await registerTestUser(httpServer, prisma, ADMIN_EMAIL, TEST_PASSWORD);
    adminToken = admin.sessionCookie;
    await prisma.user.update({ where: { email: cleanEmail(ADMIN_EMAIL) }, data: { role: 'ADMIN' } });
  });

  afterAll(async () => {
    if (prisma) {
      // Delete studios created during tests (cascades to members)
      await prisma.studio.deleteMany({
        where: { slug: { contains: TEST_SUFFIX } },
      });

      // Delete test users
      await prisma.user.deleteMany({
        where: { email: { startsWith: cleanEmail(TEST_SUFFIX) } },
      });

      await prisma.$disconnect();
    }
  });

  it('POST /api/studios rejects unauthenticated request', async () => {
    const res = await request(httpServer)
      .post('/api/studios')
      .send({ name: 'Test Studio', slug: 'test-studio' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/studios creates a studio for authenticated user', async () => {
    const slug = `my-studio-${TEST_SUFFIX}`;
    studioSlug = slug;

    const res = await request(httpServer)
      .post('/api/studios')
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({
        name: 'My Studio',
        slug,
        tagline: 'A test studio',
        description: 'Full studio description',
        location: 'Portugal',
        websiteUrl: 'https://example.com',
      });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.name).toBe('My Studio');
    expect(res.body.slug).toBe(slug);
    expect(res.body.tagline).toBe('A test studio');
    expect(res.body.location).toBe('Portugal');
    expect(res.body.membersCount).toBe(1);
    expect(res.body.gamesCount).toBe(0);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
  });

  it('POST /api/studios creates StudioMember for creator', async () => {
    const membership = await prisma.studioMember.findFirst({
      where: { userId: ownerId, studio: { slug: studioSlug } },
    });
    expect(membership).toBeDefined();
    expect(membership!.role).toBe('OWNER');
  });

  it('POST /api/studios rejects duplicate slug with 409', async () => {
    const res = await request(httpServer)
      .post('/api/studios')
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ name: 'Another Studio', slug: studioSlug });
    expect(res.status).toBe(HttpStatus.CONFLICT);
  });

  it('GET /api/studios lists created studio', async () => {
    const res = await request(httpServer).get('/api/studios');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    const found = res.body.items.find((s: { slug: string }) => s.slug === studioSlug);
    expect(found).toBeDefined();
    expect(found.name).toBe('My Studio');
    expect(found.membersCount).toBe(1);
  });

  it('GET /api/studios/:slug returns created studio', async () => {
    const res = await request(httpServer).get(`/api/studios/${studioSlug}`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.slug).toBe(studioSlug);
    expect(res.body.name).toBe('My Studio');
  });

  it('GET /api/studios/:missing returns 404', async () => {
    const res = await request(httpServer).get('/api/studios/nonexistent-studio');
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('PATCH /api/studios/:slug rejects unauthenticated request', async () => {
    const res = await request(httpServer)
      .patch(`/api/studios/${studioSlug}`)
      .send({ name: 'Hacked Name' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /api/studios/:slug rejects authenticated non-member with 403', async () => {
    const res = await request(httpServer)
      .patch(`/api/studios/${studioSlug}`)
      .set('Cookie', `playmorrow_session=${secondToken}`)
      .send({ name: 'Hacked Name' });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('PATCH /api/studios/:slug allows creator/owner to update', async () => {
    const res = await request(httpServer)
      .patch(`/api/studios/${studioSlug}`)
      .set('Cookie', `playmorrow_session=${ownerToken}`)
      .send({ name: 'Updated Studio Name', tagline: 'Updated tagline' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.name).toBe('Updated Studio Name');
    expect(res.body.tagline).toBe('Updated tagline');
    expect(res.body.slug).toBe(studioSlug);
  });

  it('PATCH /api/studios/:slug allows global admin to update', async () => {
    const res = await request(httpServer)
      .patch(`/api/studios/${studioSlug}`)
      .set('Cookie', `playmorrow_session=${adminToken}`)
      .send({ name: 'Admin Updated Name' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.name).toBe('Admin Updated Name');
  });

  it('GET /api/studios/me returns current users studios', async () => {
    const res = await request(httpServer)
      .get('/api/studios/me')
      .set('Cookie', `playmorrow_session=${ownerToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((s: { slug: string }) => s.slug === studioSlug);
    expect(found).toBeDefined();
  });

  it('GET /api/studios/me rejects unauthenticated request', async () => {
    const res = await request(httpServer).get('/api/studios/me');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /api/studios/:slug/members returns public member info', async () => {
    const res = await request(httpServer).get(`/api/studios/${studioSlug}/members`);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.id).toBeDefined();
    expect(res.body.members).toBeDefined();
    expect(res.body.members.length).toBe(1);
    expect(typeof res.body.members[0].user.username).toBe('string');
    expect(res.body.members[0].user.passwordHash).toBeUndefined();
  });

  it('GET /api/studios supports search query', async () => {
    const res = await request(httpServer)
      .get(`/api/studios?search=Updated`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items.some((s: { slug: string }) => s.slug === studioSlug)).toBe(true);
  });

  it('PATCH /api/studios/:slug rejects member with MEMBER role', async () => {
    // Register a third user and add as MEMBER to the studio
    const memberEmail = `member_only_${TEST_SUFFIX}@example.com`;
    const member = await registerTestUser(httpServer, prisma, memberEmail, TEST_PASSWORD);

    // Add as MEMBER directly via DB (use relation connect, not scalar userId)
    const studioRecord = await prisma.studio.findUnique({ where: { slug: studioSlug } });
    if (studioRecord) {
      await prisma.studioMember.create({
        data: {
          studioId: studioRecord.id,
          userId: member.userId,
          role: 'MEMBER',
        },
      });
    }

    const res = await request(httpServer)
      .patch(`/api/studios/${studioSlug}`)
      .set('Cookie', `playmorrow_session=${member.sessionCookie}`)
      .send({ name: 'Should Not Work' });

    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });
});
