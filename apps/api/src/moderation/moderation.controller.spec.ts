import { HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
vi.setConfig({ hookTimeout: 30_000 });
import request from 'supertest';

import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { EventBusModule } from '../common/event-bus.module';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { CustomThrottlerGuard } from '../common/custom-throttler.guard';
import { MockEmailModule } from '../test/mock-email-service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { UsersModule } from '../users/users.module';
import { createTestApp } from '../test/create-test-app';
import { ModerationModule } from './moderation.module';
import { ModerationService } from './moderation.service';

const SUFFIX = `mod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const TEST_EMAIL = `test_${SUFFIX}@example.com`;
const ADMIN_EMAIL = `admin_${SUFFIX}@example.com`;
const REGULAR_EMAIL = `regular_${SUFFIX}@example.com`;
const PASSWORD = 'StrongPass123!';

describe('Moderation — API + Service', () => {
  let httpServer: unknown;
  let prisma: PrismaService;
  let modService: ModerationService;
  let adminId: string;
  let targetUserId: string;

  beforeAll(async () => {
    const modBuilder = Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', 'apps/api/.env'] }),
        ScheduleModule.forRoot(),
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
        PrismaModule,
        AuthModule,
        UsersModule,
        NotificationsModule,
        EventBusModule,
        MockEmailModule,
        ModerationModule,
      ],
      providers: [
        { provide: APP_GUARD, useClass: OptionalSessionGuard },
        { provide: APP_GUARD, useClass: CustomThrottlerGuard },
      ],
    });
    const result = await createTestApp(modBuilder);
    httpServer = result.httpServer;
    prisma = result.app.get(PrismaService);
    modService = result.app.get(ModerationService);

    // Create admin user directly
    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL, username: `admin_${SUFFIX}`, displayName: 'Admin',
        passwordHash: '$argon2id$v=19$m=19456,t=3,p=1$salt$hash', role: 'ADMIN',
        emailVerifiedAt: new Date(),
      },
    });
    adminId = admin.id;

    // Create normal user directly
    const user = await prisma.user.create({
      data: {
        email: TEST_EMAIL, username: `user_${SUFFIX}`, displayName: 'User',
        passwordHash: '$argon2id$v=19$m=19456,t=3,p=1$salt$hash', role: 'PLAYER',
        emailVerifiedAt: new Date(),
      },
    });
    targetUserId = user.id;

    // Create regular (non-admin, non-moderator) user for 403 tests
    await prisma.user.create({
      data: {
        email: REGULAR_EMAIL, username: `regular_${SUFFIX}`, displayName: 'Regular',
        passwordHash: '$argon2id$v=19$m=19456,t=3,p=1$salt$hash', role: 'PLAYER',
        emailVerifiedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [TEST_EMAIL, ADMIN_EMAIL, REGULAR_EMAIL] } } }).catch(() => {});
    await prisma.$disconnect();
  });

  // ── RBAC Bypass Test (CRITICAL) ──────────────────────────────────

  describe('RBAC — MODERATOR bypass prevention', () => {
    it('suspendUser throws FORBIDDEN for non-admin/non-moderator user', async () => {
      const regular = await prisma.user.findUnique({ where: { email: REGULAR_EMAIL } });
      await expect(
        modService.suspendUser(regular!.id, targetUserId, 'test', 1),
      ).rejects.toThrow('Only ADMIN or MODERATOR');
    });

    it('unsuspendUser throws FORBIDDEN for non-admin/non-moderator user', async () => {
      const regular = await prisma.user.findUnique({ where: { email: REGULAR_EMAIL } });
      await expect(
        modService.unsuspendUser(regular!.id, targetUserId),
      ).rejects.toThrow('Only ADMIN or MODERATOR');
    });

    it('shadowBanUser throws FORBIDDEN for non-admin/non-moderator user', async () => {
      const regular = await prisma.user.findUnique({ where: { email: REGULAR_EMAIL } });
      await expect(
        modService.shadowBanUser(regular!.id, targetUserId),
      ).rejects.toThrow('Only ADMIN or MODERATOR');
    });
  });

  // ── Service-level Tests ──────────────────────────────────────────

  describe('ModerationService', () => {
    it('suspendUser suspends a target user', async () => {
      const result = await modService.suspendUser(adminId, targetUserId, 'Spam test', 24);
      expect(result.suspended).toBe(true);
      expect(result.suspendedUntil).toBeDefined();
      expect(result.reason).toBe('Spam test');

      const updated = await prisma.user.findUnique({ where: { id: targetUserId } });
      expect(updated?.suspendedUntil).toBeDefined();
    });

    it('unsuspendUser removes suspension', async () => {
      const result = await modService.unsuspendUser(adminId, targetUserId);
      expect(result.suspended).toBe(false);

      const updated = await prisma.user.findUnique({ where: { id: targetUserId } });
      expect(updated?.suspendedUntil).toBeNull();
    });

    it('shadowBanUser marks user as shadow banned', async () => {
      const result = await modService.shadowBanUser(adminId, targetUserId);
      expect(result.shadowBanned).toBe(true);

      const updated = await prisma.user.findUnique({ where: { id: targetUserId } });
      expect(updated?.shadowBanned).toBe(true);
    });

    it('removeShadowBan removes shadow ban', async () => {
      const result = await modService.removeShadowBan(adminId, targetUserId);
      expect(result.shadowBanned).toBe(false);

      const updated = await prisma.user.findUnique({ where: { id: targetUserId } });
      expect(updated?.shadowBanned).toBe(false);
    });

    it('getUserModerationStatus returns user moderation fields', async () => {
      const status = await modService.getUserModerationStatus(targetUserId);
      expect(status).toHaveProperty('username');
      expect(status).toHaveProperty('isSuspended');
      expect(status).toHaveProperty('shadowBanned');
      expect(status).toHaveProperty('appealCount');
    });
  });

  // ── API-level Tests (HTTP) ──────────────────────────────────────

  describe('ModerationController (HTTP)', () => {
    it('GET /api/admin/moderation/users/:id returns status (public)', async () => {
      const res = await request(httpServer).get(`/api/admin/moderation/users/${targetUserId}`);
      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('username');
      expect(res.body).toHaveProperty('isSuspended');
    });

    it('POST /api/admin/moderation/suspend returns 401 without auth', async () => {
      const res = await request(httpServer)
        .post('/api/admin/moderation/suspend')
        .send({ userId: targetUserId, reason: 'Test', durationHours: 24 });
      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('GET /api/admin/moderation/users/:id returns 404 for unknown user', async () => {
      const res = await request(httpServer).get('/api/admin/moderation/users/nonexistent-id');
      expect(res.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('POST /api/admin/moderation/shadow-ban returns 401 without auth', async () => {
      const res = await request(httpServer)
        .post('/api/admin/moderation/shadow-ban')
        .send({ userId: targetUserId });
      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
