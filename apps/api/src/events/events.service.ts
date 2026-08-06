import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import type { Prisma, EventStatus } from '@playmorrow/database';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async list(page = 1, pageSize = 20, upcomingOnly = false) {
    const where: Prisma.EventWhereInput = { status: 'PUBLISHED' };
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

  async create(data: CreateEventDto) {
    return this.prisma.event.create({ data });
  }

  async update(slug: string, data: Partial<CreateEventDto> & { status?: string }) {
    const event = await this.prisma.event.findUnique({ where: { slug } });
    if (!event) throw new NotFoundException('Event not found');
    const { status, ...rest } = data;
    return this.prisma.event.update({
      where: { slug },
      data: { ...rest, ...(status ? { status: status as EventStatus } : {}) },
    });
  }

  async register(slug: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { slug } });
    if (!event) throw new NotFoundException('Event not found');
    return { registered: true, eventId: event.id, userId };
  }
}
