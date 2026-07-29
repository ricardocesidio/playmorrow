import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
vi.setConfig({ hookTimeout: 30_000 });

import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { EmailTemplatesService } from './email-templates.service';

describe('EmailTemplatesService', () => {
  let service: EmailTemplatesService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
      providers: [EmailTemplatesService],
    }).compile();
    service = module.get(EmailTemplatesService);
    prisma = module.get(PrismaService);

    // Seed a test template
    await prisma.emailTemplate.upsert({
      where: { slug: 'test-template' },
      update: {},
      create: {
        slug: 'test-template', name: 'Test', subject: 'Hello {{name}}',
        bodyHtml: '<p>Hi {{name}}, welcome {{site}}!</p>',
        variables: ['name', 'site'], category: 'transactional',
      },
    });
  });

  afterAll(async () => {
    await prisma.emailTemplate.deleteMany({ where: { slug: 'test-template' } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('findAll returns templates', async () => {
    const result = await service.findAll();
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeGreaterThanOrEqual(1);
  });

  it('findBySlug returns a template', async () => {
    const tmpl = await service.findBySlug('test-template');
    expect(tmpl.name).toBe('Test');
    expect(tmpl.subject).toBe('Hello {{name}}');
  });

  it('findBySlug throws on missing template', async () => {
    await expect(service.findBySlug('nonexistent')).rejects.toThrow('Template not found');
  });

  it('render replaces variables in subject and body', async () => {
    const result = await service.render('test-template', { name: 'Alice', site: 'Playmorrow' });
    expect(result.subject).toBe('Hello Alice');
    expect(result.html).toContain('Hi Alice');
    expect(result.html).toContain('welcome Playmorrow');
  });

  it('create makes a new template', async () => {
    const tmpl = await service.create({
      slug: 'created-template', name: 'Created', subject: 'Test {{x}}',
      bodyHtml: '<p>{{x}}</p>', variables: ['x'],
    });
    expect(tmpl.slug).toBe('created-template');
    await prisma.emailTemplate.delete({ where: { id: tmpl.id } }).catch(() => {});
  });

  it('update modifies an existing template', async () => {
    const updated = await service.update(
      (await service.findBySlug('test-template')).id,
      { subject: 'New Subject {{name}}' },
    );
    expect(updated.subject).toBe('New Subject {{name}}');
  });
});
