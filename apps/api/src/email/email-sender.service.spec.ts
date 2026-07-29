import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
vi.setConfig({ hookTimeout: 30_000 });

import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';
import { EmailSenderService } from './email-sender.service';
import { EventBusModule } from '../common/event-bus.module';

describe('EmailSenderService', () => {
  let service: EmailSenderService;
  let prisma: PrismaService;
  let tmplService: EmailTemplatesService;

  beforeAll(async () => {
    // Import only the providers needed, not the module with controllers
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, EventBusModule],
      providers: [EmailTemplatesService, EmailSenderService],
    }).compile();
    service = module.get(EmailSenderService);
    prisma = module.get(PrismaService);
    tmplService = module.get(EmailTemplatesService);

    // Seed a test template
    await prisma.emailTemplate.upsert({
      where: { slug: 'test-send' },
      update: {},
      create: {
        slug: 'test-send', name: 'Test Send', subject: 'Hi {{name}}',
        bodyHtml: '<p>Hello {{name}}, welcome {{site}}</p>',
        variables: ['name', 'site'], category: 'transactional',
      },
    });
  });

  afterAll(async () => {
    await prisma.emailTemplate.deleteMany({ where: { slug: 'test-send' } }).catch(() => {});
    await prisma.emailLog.deleteMany({ where: { email: { in: ['test@example.com', 'raw@example.com'] } } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('markBounced and isBounced works', async () => {
    await service.markBounced('bounced@test.com');
    const bounced = await service.isBounced('bounced@test.com');
    expect(bounced).toBe(true);
  });

  it('sendTemplate skips bounced emails', async () => {
    await service.markBounced('bounced2@test.com');
    const result = await service.sendTemplate('bounced2@test.com', 'test-send', { name: 'Bounced', site: 'Test' });
    expect(result).toBe(false); // skipped — no error, just bounce prevention
  });

  it('sendTemplate renders + logs email', async () => {
    const result = await service.sendTemplate('test@example.com', 'test-send', { name: 'Alice', site: 'Playmorrow' });
    expect(result).toBe(true);

    const log = await prisma.emailLog.findFirst({ where: { email: 'test@example.com' }, orderBy: { createdAt: 'desc' } });
    expect(log).toBeDefined();
    expect(log!.status).toBe('sent');
  });

  it('sendRaw logs raw email', async () => {
    const result = await service.sendRaw('raw@example.com', 'Raw Subject', '<p>Raw content</p>');
    expect(result).toBe(true);

    const log = await prisma.emailLog.findFirst({ where: { email: 'raw@example.com' }, orderBy: { createdAt: 'desc' } });
    expect(log).toBeDefined();
    expect(log!.status).toBe('sent');
  });

  it('getLogs returns paginated logs', async () => {
    const logs = await service.getLogs();
    expect(logs.items.length).toBeGreaterThanOrEqual(2);
    expect(logs.total).toBeGreaterThanOrEqual(2);
  });
});
