import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async list(page = 1, pageSize = 20) {
    const where = { status: 'published' };
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
}
