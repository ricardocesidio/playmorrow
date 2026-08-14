import { HttpStatus } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { createHash } from 'node:crypto';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

vi.setConfig({ hookTimeout: 30_000 });
import request from 'supertest';

import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from './auth.module';
import { MockEmailModule } from '../test/mock-email-service';
import { registerTestUser } from '../test/register-test-user';
import { CsrfGuard } from '../common/csrf.guard';
import { OptionalSessionGuard } from './guards/optional-session.guard';
import cookieParser from 'cookie-parser';

const TEST_SUFFIX = `test-${Date.now()}`;
const TEST_EMAIL = `${TEST_SUFFIX}@example.com`;
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
        NotificationsModule,
        MockEmailModule,
      ],
      providers: [
        { provide: APP_GUARD, useClass: OptionalSessionGuard },
        { provide: APP_GUARD, useClass: CsrfGuard },
      ],
    }).compile();

    const nestApp = app.createNestApplication();
    nestApp.use(cookieParser());
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

  it('GET /api/auth/session/me issues a CSRF token usable by authenticated mutations', async () => {
    const email = `${TEST_SUFFIX}_csrfme@example.com`;
    const { sessionCookie } = await registerTestUser(httpServer, prisma, email, TEST_PASSWORD);
    const cookieHeader = `playmorrow_session=${sessionCookie}`;

    const res = await request(httpServer)
      .get('/api/auth/session/me')
      .set('Cookie', cookieHeader);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.csrfToken).toBeDefined();
    expect(typeof res.body.csrfToken).toBe('string');
    expect(res.headers['x-csrf-token']).toBe(res.body.csrfToken);

    // The issued token must be accepted by an authenticated mutation
    const onboard = await request(httpServer)
      .post('/api/auth/complete-onboarding')
      .set('Cookie', cookieHeader)
      .set('X-CSRF-Token', res.body.csrfToken)
      .send({ accountType: 'PLAYER', username: `csrfmeuser${Date.now()}`, email, displayName: 'CSRF Me' });
    expect(onboard.status).toBe(HttpStatus.CREATED);
  });

  it('POST /api/auth/register creates a user and requires email verification', async () => {
    const res = await request(httpServer)
      .post('/api/auth/register')
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        acceptedTerms: true,
        acceptedPrivacy: true,
      });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.requiresEmailVerification).toBe(true);
    expect(res.body.email).toBe(cleanEmail(TEST_EMAIL));
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(cleanEmail(TEST_EMAIL));
    expect(typeof res.body.user.username).toBe('string');
    expect(typeof res.body.user.displayName).toBe('string');
    expect(res.body.user.emailVerifiedAt).toBeNull();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('POST /api/auth/register rejects duplicate email', async () => {
    const res = await request(httpServer)
      .post('/api/auth/register')
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        acceptedTerms: true,
        acceptedPrivacy: true,
      });

    expect(res.status).toBe(HttpStatus.CONFLICT);
  });

  it('POST /api/auth/verify-email issues a CSRF token for the new session', async () => {
    const email = `${TEST_SUFFIX}_csrf@example.com`;
    const reg = await request(httpServer)
      .post('/api/auth/register')
      .send({ email, password: TEST_PASSWORD, acceptedTerms: true, acceptedPrivacy: true });
    expect(reg.status).toBe(HttpStatus.CREATED);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not created');

    // verifyEmail uses the latest unconsumed code — override with a known raw value
    const rawCode = '654321';
    const codeHash = createHash('sha256').update(rawCode).digest('hex');
    await prisma.emailVerificationCode.create({
      data: { codeHash, userId: user.id, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    });

    const res = await request(httpServer)
      .post('/api/auth/verify-email')
      .send({ email, code: rawCode });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.csrfToken).toBeDefined();
    expect(typeof res.body.csrfToken).toBe('string');
    expect(res.headers['x-csrf-token']).toBe(res.body.csrfToken);

    // verify-email establishes the session cookie
    const setCookies = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookies) ? setCookies[0] : setCookies;
    const sessionMatch = cookieStr?.match(/playmorrow_session=[^;]+/);
    const sessionCookie = sessionMatch ? sessionMatch[0] : null;
    expect(sessionCookie).toBeTruthy();
    if (!sessionCookie) throw new Error('No session cookie from verify-email');

    // Sanity: without a CSRF token the authenticated mutation is rejected (the reported bug)
    const username = `csrfuser${Date.now()}`;
    const blocked = await request(httpServer)
      .post('/api/auth/complete-onboarding')
      .set('Cookie', sessionCookie)
      .send({ accountType: 'PLAYER', username, email, displayName: 'CSRF Player' });
    expect(blocked.status).toBe(HttpStatus.FORBIDDEN);

    // The issued token must be accepted by the same authenticated mutation
    const onboard = await request(httpServer)
      .post('/api/auth/complete-onboarding')
      .set('Cookie', sessionCookie)
      .set('X-CSRF-Token', res.body.csrfToken)
      .send({ accountType: 'PLAYER', username, email, displayName: 'CSRF Player' });
    expect(onboard.status).toBe(HttpStatus.CREATED);
  });

  it('POST /api/auth/login works with valid credentials (by email)', async () => {
    // User already registered in first test; just verify + login
    await prisma.user.update({ where: { email: cleanEmail(TEST_EMAIL) }, data: { emailVerifiedAt: new Date() } });

    const res = await request(httpServer)
      .post('/api/auth/login')
      .send({ emailOrUsername: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.user.email).toBe(cleanEmail(TEST_EMAIL));
    expect(res.body.accessToken).toBeDefined();
    accessToken = res.body.accessToken;
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('POST /api/auth/login works with valid credentials (by username)', async () => {
    const user = await prisma.user.findUnique({ where: { email: cleanEmail(TEST_EMAIL) } });
    if (!user) throw new Error('User not found');

    const res = await request(httpServer)
      .post('/api/auth/login')
      .send({ emailOrUsername: user.username, password: TEST_PASSWORD });

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
    if (!accessToken) throw new Error('No access token from login test');

    const res = await request(httpServer)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.email).toBe(cleanEmail(TEST_EMAIL));
    expect(typeof res.body.username).toBe('string');
    expect(res.body.role).toBe('PLAYER');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('returned user never includes passwordHash', async () => {
    const email2 = `nohash_${TEST_SUFFIX}@example.com`;
    const user = await registerTestUser(httpServer, prisma, email2, TEST_PASSWORD);

    const loginRes = await request(httpServer)
      .post('/api/auth/login')
      .send({ emailOrUsername: email2, password: TEST_PASSWORD });

    expect(loginRes.body.user.passwordHash).toBeUndefined();

    const meRes = await request(httpServer)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(meRes.body.passwordHash).toBeUndefined();
  });
});
