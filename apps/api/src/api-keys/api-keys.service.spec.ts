import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
vi.setConfig({ hookTimeout: 30_000 });

import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeysService } from './api-keys.service';

const SUFFIX = `apikey-${Date.now()}`;
const TEST_EMAIL = `test_${SUFFIX}@example.com`;

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let prisma: PrismaService;
  let userId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
      providers: [ApiKeysService],
    }).compile();
    service = module.get(ApiKeysService);
    prisma = module.get(PrismaService);

    const user = await prisma.user.create({
      data: { email: TEST_EMAIL, username: `user_${SUFFIX}`, displayName: 'API Key Test', passwordHash: 'hash', emailVerifiedAt: new Date() },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.apiKey.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('create generates a valid API key', async () => {
    const result = await service.create(userId, 'Test Key');
    expect(result.key).toBeDefined();
    expect(result.key.length).toBeGreaterThan(10);
    expect(result.name).toBe('Test Key');
  });

  it('list returns created keys', async () => {
    await service.create(userId, 'Another Key');
    const keys = await service.list(userId);
    expect(keys.length).toBeGreaterThanOrEqual(2);
  });

  it('validate accepts a valid key', async () => {
    const created = await service.create(userId, 'Validation Test');
    const result = await service.validate(created.key);
    expect(result).not.toBeNull();
    expect(result!.userId).toBe(userId);
  });

  it('validate rejects invalid key', async () => {
    const result = await service.validate('invalid-key-12345');
    expect(result).toBeNull();
  });

  it('revoke revokes an API key', async () => {
    const created = await service.create(userId, 'Revoke Test');
    const keys = await service.list(userId);
    const keyId = keys.find(k => k.name === 'Revoke Test')!.id;
    await service.revoke(userId, keyId);
    const result = await service.validate(created.key);
    expect(result).toBeNull();
  });
});
