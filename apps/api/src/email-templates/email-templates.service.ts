import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, pageSize = 50) {
    const [items, total] = await Promise.all([
      this.prisma.emailTemplate.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      this.prisma.emailTemplate.count(),
    ]);
    return { items, total, page, pageSize, hasMore: page * pageSize < total };
  }

  async findBySlug(slug: string) {
    const tmpl = await this.prisma.emailTemplate.findUnique({ where: { slug } });
    if (!tmpl) throw new NotFoundException('Template not found');
    return tmpl;
  }

  async create(data: { slug: string; name: string; subject: string; bodyHtml: string; variables: string[]; category?: string }) {
    return this.prisma.emailTemplate.create({
      data: {
        slug: data.slug,
        name: data.name,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        variables: data.variables,
        category: data.category || 'transactional',
      },
    });
  }

  async update(id: string, data: { subject?: string; bodyHtml?: string; name?: string; variables?: string[] }) {
    const existing = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Template not found');
    return this.prisma.emailTemplate.update({ where: { id }, data });
  }

  async render(slug: string, vars: Record<string, string>): Promise<{ subject: string; html: string }> {
    const tmpl = await this.findBySlug(slug);
    let subject = tmpl.subject;
    let html = tmpl.bodyHtml;
    for (const [key, val] of Object.entries(vars)) {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), val);
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), val);
    }
    return { subject, html };
  }
}
