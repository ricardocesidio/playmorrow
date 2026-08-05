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
import { EventBusModule } from '../common/event-bus.module';
import { MockEmailModule } from '../test/mock-email-service';
import { registerTestUser } from '../test/register-test-user';
import { createTestApp } from '../test/create-test-app';
import { EventsModule } from './events.module';
import { PartnerModule } from '../partner/partner.module';

const SUFFIX = `evt-${Date.now()}`;
const USER_EMAIL = `events_${SUFFIX}@example.com`;
const PASSWORD = 'StrongPass123!';

function cleanEmail(e: string): string {
  return e.toLowerCase();
}

describe('Events & Partners Integration', () => {
  let app: TestingModule;
  let httpServer: unknown;
  let prisma: PrismaService;
  let userSession: string;

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
          EventsModule,
          PartnerModule,
        ],
      }),
    );
    app = result.app;
    httpServer = result.httpServer;
    prisma = result.app.get(PrismaService);

    const user = await registerTestUser(httpServer, prisma, USER_EMAIL, PASSWORD);
    userSession = user.sessionCookie;
  });

  afterAll(async () => {
    if (prisma) {
      const testUser = await prisma.user.findUnique({ where: { email: cleanEmail(USER_EMAIL) } });
      if (testUser) {
        await prisma.user.delete({ where: { id: testUser.id } });
      }
      await prisma.$disconnect();
    }
  });

  // ── Events ─────────────────────────────────────────────────────────────

  it('GET /api/events returns paginated published events (200)', async () => {
    const res = await request(httpServer)
      .get('/api/events')
      .expect(HttpStatus.OK);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });

  it('POST /api/events requires authentication (401)', async () => {
    await request(httpServer)
      .post('/api/events')
      .send({ title: 'Test Event', slug: 'test-event', startDate: '2026-08-10T00:00:00.000Z' })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('PATCH /api/events/:slug requires authentication (401)', async () => {
    await request(httpServer)
      .patch('/api/events/test-slug')
      .send({ status: 'published' })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('GET /api/events/:slug returns 404 for non-existent event', async () => {
    await request(httpServer)
      .get('/api/events/nonexistent-event-slug')
      .expect(HttpStatus.NOT_FOUND);
  });

  // ── Partners ────────────────────────────────────────────────────────────

  it('GET /api/partners returns paginated active partners (200)', async () => {
    const res = await request(httpServer)
      .get('/api/partners')
      .expect(HttpStatus.OK);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });

  it('POST /api/partners requires authentication (401)', async () => {
    await request(httpServer)
      .post('/api/partners')
      .send({ type: 'University', name: 'Test Partner', slug: 'test-partner' })
      .expect(HttpStatus.UNAUTHORIZED);
  });
});
