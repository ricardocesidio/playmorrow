import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { AuthModule } from './auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { UsersModule } from '../users/users.module';
import { createTestApp } from '../test/create-test-app';
import { MockEmailModule } from '../test/mock-email-service';

/**
 * Verifies the global ThrottlerGuard wiring (#3): the per-route `@Throttle`
 * override on `POST /auth/login` (10/min) must return 429 once exceeded.
 * Wires the same APP_GUARD + ThrottlerModule the production AppModule uses.
 */
describe('Rate limiting (#3)', () => {
  let httpServer: unknown;
  let prisma: PrismaService;

  beforeAll(async () => {
    const result = await createTestApp(
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', 'apps/api/.env'] }),
          ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
          PrismaModule,
          UsersModule,
          AuthModule,
          MockEmailModule,
        ],
        providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
      }),
    );
    httpServer = result.httpServer;
    prisma = result.app.get(PrismaService);
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
  });

  it('POST /api/auth/login returns 429 after the per-route limit (10/min)', async () => {
    const body = { emailOrUsername: 'nobody@example.com', password: 'wrong-password' };
    const statuses: number[] = [];

    // 10 allowed (each fails auth → 401), 11th is blocked at the guard → 429.
    for (let i = 0; i < 11; i++) {
      const res = await request(httpServer).post('/api/auth/login').send(body);
      statuses.push(res.status);
    }

    expect(statuses[0]).not.toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(statuses[10]).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });
});
