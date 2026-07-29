import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
vi.setConfig({ hookTimeout: 30_000 });

import { EventBusModule } from '../common/event-bus.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from './moderation.service';

const SUFFIX = `mod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const TEST_EMAIL = `test_${SUFFIX}@example.com`;
const ADMIN_EMAIL = `admin_${SUFFIX}@example.com`;

describe('ModerationService', () => {
  let service: ModerationService;
  let prisma: PrismaService;
  let adminId: string;
  let targetUserId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, EventBusModule],
      providers: [ModerationService],
    }).compile();

    service = module.get(ModerationService);
    prisma = module.get(PrismaService);

    // Create test users directly
    const admin = await prisma.user.create({
      data: { email: ADMIN_EMAIL, username: `admin_${SUFFIX}`, displayName: 'Admin', passwordHash: 'hash', role: 'ADMIN', emailVerifiedAt: new Date() },
    });
    adminId = admin.id;

    const user = await prisma.user.create({
      data: { email: TEST_EMAIL, username: `user_${SUFFIX}`, displayName: 'User', passwordHash: 'hash', role: 'PLAYER', emailVerifiedAt: new Date() },
    });
    targetUserId = user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [TEST_EMAIL, ADMIN_EMAIL] } } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('suspendUser suspends a target user', async () => {
    const result = await service.suspendUser(adminId, targetUserId, 'Spam test', 24);
    expect(result.suspended).toBe(true);
    expect(result.suspendedUntil).toBeDefined();
    expect(result.reason).toBe('Spam test');

    const updated = await prisma.user.findUnique({ where: { id: targetUserId } });
    expect(updated?.suspendedUntil).toBeDefined();
  });

  it('unsuspendUser removes suspension', async () => {
    const result = await service.unsuspendUser(adminId, targetUserId);
    expect(result.suspended).toBe(false);

    const updated = await prisma.user.findUnique({ where: { id: targetUserId } });
    expect(updated?.suspendedUntil).toBeNull();
  });

  it('shadowBanUser marks user as shadow banned', async () => {
    const result = await service.shadowBanUser(adminId, targetUserId);
    expect(result.shadowBanned).toBe(true);

    const updated = await prisma.user.findUnique({ where: { id: targetUserId } });
    expect(updated?.shadowBanned).toBe(true);
  });

  it('removeShadowBan removes shadow ban', async () => {
    const result = await service.removeShadowBan(adminId, targetUserId);
    expect(result.shadowBanned).toBe(false);

    const updated = await prisma.user.findUnique({ where: { id: targetUserId } });
    expect(updated?.shadowBanned).toBe(false);
  });

  it('getUserModerationStatus returns user moderation fields', async () => {
    const status = await service.getUserModerationStatus(targetUserId);
    expect(status).toHaveProperty('username');
    expect(status).toHaveProperty('isSuspended');
    expect(status).toHaveProperty('shadowBanned');
    expect(status).toHaveProperty('appealCount');
  });

  it('getUserModerationStatus returns appealCount', async () => {
    // Verify appealCount is tracked
    const status = await service.getUserModerationStatus(targetUserId);
    expect(typeof status.appealCount).toBe('number');
  });
});
