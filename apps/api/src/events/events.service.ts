import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async publish(slug: string, status?: string) {
    const event = await this.prisma.event.findUnique({ where: { slug } });
    if (!event) throw new NotFoundException('Event not found');
    return this.prisma.event.update({
      where: { slug },
      data: { status: status || 'published' },
    });
  }

  async list(page = 1, pageSize = 20, upcomingOnly = false) {
    const where: any = { status: 'published' };
    if (upcomingOnly) where.startDate = { gte: new Date() };

    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where, orderBy: { startDate: 'asc' },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      this.prisma.event.count({ where }),
    ]);
    return { items, total, page, pageSize, hasMore: page * pageSize < total };
  }

  async getBySlug(slug: string) {
    const event = await this.prisma.event.findUnique({ where: { slug } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async create(data: any) {
    return this.prisma.event.create({ data });
  }

  async register(slug: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { slug } });
    if (!event) throw new NotFoundException('Event not found');
    return { registered: true, eventId: event.id, userId };
  }
}
