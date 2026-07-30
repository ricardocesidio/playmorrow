import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
vi.setConfig({ hookTimeout: 30_000 });

import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { SpamDetectionService } from './spam-detection.service';

const SUFFIX = `spam-${Date.now()}`;
const TEST_EMAIL = `spam_${SUFFIX}@example.com`;

describe('SpamDetectionService', () => {
  let service: SpamDetectionService;
  let prisma: PrismaService;
  let userId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
      providers: [SpamDetectionService],
    }).compile();
    service = module.get(SpamDetectionService);
    prisma = module.get(PrismaService);

    const user = await prisma.user.create({
      data: { email: TEST_EMAIL, username: `user_${SUFFIX}`, displayName: 'Spam Test', passwordHash: 'hash', emailVerifiedAt: new Date() },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('flags spam keywords', async () => {
    const result = await service.checkContent('Buy cheap followers now!', userId);
    expect(result.isSpam).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('passes normal content', async () => {
    const result = await service.checkContent('Great game, really enjoying the art style and gameplay mechanics!', userId);
    expect(result.isSpam).toBe(false);
    expect(result.reasons.length).toBe(0);
  });

  it('flags short URLs', async () => {
    const result = await service.checkContent('Check this out https://bit.ly/test123', userId);
    expect(result.isSpam).toBe(true);
    expect(result.reasons.some(r => r.includes('shortened URL'))).toBe(true);
  });

  it('flags all-caps text', async () => {
    const result = await service.checkContent('THIS IS AMAZING GREAT GAME EVERYONE SHOULD PLAY IT RIGHT NOW', userId);
    expect(result.isSpam).toBe(true);
  });

  it('flags repetitive characters', async () => {
    const result = await service.checkContent('Awesome!!!!!!!!!!!!!!!!!!', userId);
    expect(result.isSpam).toBe(true);
  });
});
