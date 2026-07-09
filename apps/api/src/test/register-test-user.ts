import request from 'supertest';
import { PrismaService } from '../prisma/prisma.service';

export interface RegisteredTestUser {
  accessToken: string;
  sessionCookie: string;
  userId: string;
  email: string;
  username: string;
}

/**
 * Registers a test user via HTTP, bypasses email verification via Prisma,
 * then logs in to obtain both a JWT access token (for /auth/me) and
 * a session cookie (for all SessionAuthGuard endpoints).
 */
export async function registerTestUser(
  httpServer: unknown,
  prisma: PrismaService,
  email: string,
  password: string,
): Promise<RegisteredTestUser> {
  const emailLower = email.toLowerCase();

  await request(httpServer)
    .post('/api/auth/register')
    .send({ email, password, acceptedTerms: true, acceptedPrivacy: true })
    .expect(201);

  // Bypass email verification — set verifiedAt directly
  const user = await prisma.user.findUnique({ where: { email: emailLower } });
  if (!user) throw new Error(`User ${emailLower} not found after register`);
  await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });

  // JWT login (for endpoints still using JwtAuthGuard like /auth/me)
  const loginRes = await request(httpServer)
    .post('/api/auth/login')
    .send({ emailOrUsername: email, password })
    .expect(200);

  // Session login (for SessionAuthGuard endpoints)
  const sessionRes = await request(httpServer)
    .post('/api/auth/session/login')
    .send({ emailOrUsername: email, password })
    .expect(200);

  // Extract session cookie from Set-Cookie header
  const setCookieHeader = sessionRes.headers['set-cookie'];
  const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
  const match = cookieStr.match(/playmorrow_session=([^;]+)/);
  const sessionCookie = match ? match[1] : null;
  if (!sessionCookie) throw new Error('No session cookie from session login');

  return {
    accessToken: loginRes.body.accessToken,
    sessionCookie,
    userId: loginRes.body.user.id,
    email: emailLower,
    username: loginRes.body.user.username,
  };
}
