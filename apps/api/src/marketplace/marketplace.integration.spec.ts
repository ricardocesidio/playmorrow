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
import { MarketplaceModule } from './marketplace.module';

const SUFFIX = `mkt-${Date.now()}`;
const USER_EMAIL = `marketplace_${SUFFIX}@example.com`;
const PASSWORD = 'StrongPass123!';

function cleanEmail(e: string): string {
  return e.toLowerCase();
}

describe('Marketplace Integration', () => {
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
          MarketplaceModule,
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
        await prisma.purchasedLicense.deleteMany({ where: { userId: testUser.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
      }
      await prisma.$disconnect();
    }
  });

  it('GET /api/marketplace returns paginated active listings', async () => {
    const res = await request(httpServer)
      .get('/api/marketplace')
      .expect(HttpStatus.OK);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });

  it('GET /api/marketplace/:id returns 404 for missing listing', async () => {
    await request(httpServer)
      .get('/api/marketplace/nonexistent-id')
      .expect(HttpStatus.NOT_FOUND);
  });

  it('POST /api/marketplace requires authentication (401)', async () => {
    await request(httpServer)
      .post('/api/marketplace')
      .send({ title: 'Test Asset', priceCents: 100, studioId: 'fake-studio', type: 'ASSET' })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/marketplace/:id/purchase requires authentication (401)', async () => {
    await request(httpServer)
      .post('/api/marketplace/test-id/purchase')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('GET /api/marketplace/me/licenses requires authentication (401)', async () => {
    await request(httpServer)
      .get('/api/marketplace/me/licenses')
      .expect(HttpStatus.UNAUTHORIZED);
  });
});
