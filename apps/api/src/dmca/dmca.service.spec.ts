import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
vi.setConfig({ hookTimeout: 30_000 });

import { PrismaModule } from '../prisma/prisma.module';
import { EventBusModule } from '../common/event-bus.module';
import { PrismaService } from '../prisma/prisma.service';
import { DmcaService } from './dmca.service';

describe('DmcaService', () => {
  let service: DmcaService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, EventBusModule],
      providers: [DmcaService],
    }).compile();
    service = module.get(DmcaService);
    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.moderationReport.deleteMany({ where: { reason: 'COPYRIGHT' } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email: 'dmca@playmorrow.co' } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('fileTakedown creates a DMCA notice', async () => {
    const result = await service.fileTakedown({
      reporterName: 'John Doe', reporterEmail: 'john@test.com',
      targetType: 'GAME', targetId: 'game-123',
      description: 'This game uses my artwork without permission',
      infringedWork: 'My Artwork Series',
      consent: true,
    });
    expect(result).toHaveProperty('id');
    expect(result.status).toBe('open');
    expect(result.counterDeadline).toBeDefined();
  });

  it('listNotices returns DMCA notices', async () => {
    const result = await service.listNotices();
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.items[0].reason).toBe('COPYRIGHT');
  });
});
