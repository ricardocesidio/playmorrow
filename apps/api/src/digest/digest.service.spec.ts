import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
vi.setConfig({ hookTimeout: 30_000 });

import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';
import { EmailSenderService } from '../email/email-sender.service';
import { DigestService } from './digest.service';
import { EventBusModule } from '../common/event-bus.module';

describe('DigestService', () => {
  let service: DigestService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, EventBusModule],
      providers: [DigestService, EmailSenderService, EmailTemplatesService],
    }).compile();
    service = module.get(DigestService);
    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('sendDigestForUser handles user with no activity gracefully', async () => {
    // Should not throw for users with no follows/wishlists
    const result = service.sendDigestForUser('nonexistent-id', 'test@example.com', 'Test User', 'weekly');
    await expect(result).resolves.toBeUndefined();
  });
});
