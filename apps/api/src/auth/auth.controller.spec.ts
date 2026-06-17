import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from './auth.module';

const TEST_SUFFIX = `test_${Date.now()}`;
const TEST_EMAIL = `${TEST_SUFFIX}@example.com`;
const TEST_USERNAME = `user_${TEST_SUFFIX}`;
const TEST_PASSWORD = 'StrongPass123!';

function cleanEmail(email: string): string {
  return email.toLowerCase();
}

describe('AuthController (e2e)', () => {
  let app: TestingModule;
  let httpServer: unknown;
  let prisma: PrismaService;
  let accessToken: string;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env', 'apps/api/.env'],
        }),
        PrismaModule,
        UsersModule,
        AuthModule,
      ],
    }).compile();

    const nestApp = app.createNestApplication();
    nestApp.setGlobalPrefix('api', { exclude: ['health'] });
    await nestApp.init();
    httpServer = nestApp.getHttpServer();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (prisma) {
      // Cleanup: remove test users created during this test run
      await prisma.user.deleteMany({
        where: { email: { startsWith: cleanEmail(TEST_SUFFIX) } },
      });

      await prisma.$disconnect();
    }
  });

  it('POST /api/auth/register creates a user and returns a token', async () => {
    const res = await request(httpServer)
      .post('/api/auth/register')
      .send({
        email: TEST_EMAIL,
        username: TEST_USERNAME,
        displayName: 'Test User',
        password: TEST_PASSWORD,
      });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(cleanEmail(TEST_EMAIL));
    expect(res.body.user.username).toBe(TEST_USERNAME);
    expect(res.body.user.displayName).toBe('Test User');
    expect(res.body.user.role).toBe('PLAYER');
    expect(res.body.accessToken).toBeDefined();
    expect(typeof res.body.accessToken).toBe('string');

    // Save token for subsequent tests
    accessToken = res.body.accessToken;

    // Verify passwordHash is never returned
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('POST /api/auth/register rejects duplicate email', async () => {
    const res = await request(httpServer)
      .post('/api/auth/register')
      .send({
        email: TEST_EMAIL,
        username: `unique_${TEST_SUFFIX}`,
        displayName: 'Duplicate Email',
        password: TEST_PASSWORD,
      });

    expect(res.status).toBe(HttpStatus.CONFLICT);
  });

  it('POST /api/auth/register rejects duplicate username', async () => {
    const res = await request(httpServer)
      .post('/api/auth/register')
      .send({
        email: `unique_${TEST_SUFFIX}@example.com`,
        username: TEST_USERNAME,
        displayName: 'Duplicate Username',
        password: TEST_PASSWORD,
      });

    expect(res.status).toBe(HttpStatus.CONFLICT);
  });

  it('POST /api/auth/login works with valid credentials (by email)', async () => {
    const res = await request(httpServer)
      .post('/api/auth/login')
      .send({
        emailOrUsername: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.user.email).toBe(cleanEmail(TEST_EMAIL));
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('POST /api/auth/login works with valid credentials (by username)', async () => {
    const res = await request(httpServer)
      .post('/api/auth/login')
      .send({
        emailOrUsername: TEST_USERNAME,
        password: TEST_PASSWORD,
      });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.user.email).toBe(cleanEmail(TEST_EMAIL));
    expect(res.body.accessToken).toBeDefined();
  });

  it('POST /api/auth/login rejects wrong password', async () => {
    const res = await request(httpServer)
      .post('/api/auth/login')
      .send({
        emailOrUsername: TEST_EMAIL,
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('POST /api/auth/login rejects unknown email', async () => {
    const res = await request(httpServer)
      .post('/api/auth/login')
      .send({
        emailOrUsername: 'nonexistent@example.com',
        password: TEST_PASSWORD,
      });

    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /api/auth/me rejects missing token', async () => {
    const res = await request(httpServer).get('/api/auth/me');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /api/auth/me rejects invalid token', async () => {
    const res = await request(httpServer)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('GET /api/auth/me accepts valid token and returns profile', async () => {
    const res = await request(httpServer)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.email).toBe(cleanEmail(TEST_EMAIL));
    expect(res.body.username).toBe(TEST_USERNAME);
    expect(res.body.role).toBe('PLAYER');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('returned user never includes passwordHash', async () => {
    // Register a second user to verify
    const email2 = `nohash_${TEST_SUFFIX}@example.com`;
    const username2 = `nohash_${TEST_SUFFIX}`;

    const registerRes = await request(httpServer)
      .post('/api/auth/register')
      .send({
        email: email2,
        username: username2,
        displayName: 'No Hash Test',
        password: TEST_PASSWORD,
      });

    expect(registerRes.body.user.passwordHash).toBeUndefined();

    const loginRes = await request(httpServer)
      .post('/api/auth/login')
      .send({ emailOrUsername: email2, password: TEST_PASSWORD });

    expect(loginRes.body.user.passwordHash).toBeUndefined();

    const meRes = await request(httpServer)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

    expect(meRes.body.passwordHash).toBeUndefined();
  });
});
