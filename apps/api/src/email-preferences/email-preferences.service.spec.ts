import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
vi.setConfig({ hookTimeout: 30_000 });

import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { EmailPreferencesService } from './email-preferences.service';

const SUFFIX = `pref-${Date.now()}`;
const TEST_EMAIL = `test_${SUFFIX}@example.com`;

describe('EmailPreferencesService', () => {
  let service: EmailPreferencesService;
  let prisma: PrismaService;
  let userId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
      providers: [EmailPreferencesService],
    }).compile();
    service = module.get(EmailPreferencesService);
    prisma = module.get(PrismaService);

    const user = await prisma.user.create({
      data: { email: TEST_EMAIL, username: `user_${SUFFIX}`, displayName: 'Pref User', passwordHash: 'hash', emailVerifiedAt: new Date() },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.emailPreference.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('getOrCreate creates preferences with unsubscribe token', async () => {
    const pref = await service.getOrCreate(userId);
    expect(pref).toBeDefined();
    expect(pref.unsubscribeToken).toBeDefined();
    expect(pref.unsubscribeToken.length).toBeGreaterThan(10);
    expect(pref.devlogNotifications).toBe(true);
  });

  it('getOrCreate returns existing preferences on second call', async () => {
    const pref = await service.getOrCreate(userId);
    expect(pref).toBeDefined();
  });

  it('update modifies preferences', async () => {
    const updated = await service.update(userId, { marketingOptIn: true, digestFrequency: 'daily' });
    expect(updated.marketingOptIn).toBe(true);
    expect(updated.digestFrequency).toBe('daily');
  });

  it('unsubscribeByToken disables all notifications', async () => {
    const pref = await service.getOrCreate(userId);
    const result = await service.unsubscribeByToken(pref.unsubscribeToken);
    expect(result.marketingOptIn).toBe(false);
    expect(result.devlogNotifications).toBe(false);
    expect(result.wishlistNotifications).toBe(false);
  });

  it('getByToken returns user info', async () => {
    const pref = await service.getOrCreate(userId);
    const info = await service.getByToken(pref.unsubscribeToken);
    expect(info.user.email).toBe(TEST_EMAIL);
  });

  it('unsubscribeByToken throws on invalid token', async () => {
    await expect(service.unsubscribeByToken('invalid')).rejects.toThrow('Invalid unsubscribe link');
  });
});
