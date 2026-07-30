import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartnerService {
  constructor(private prisma: PrismaService) {}

  async list(type?: string, page = 1, pageSize = 20) {
    const where: any = { status: 'active' };
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.partner.findMany({
        where, orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      this.prisma.partner.count({ where }),
    ]);
    return { items, total, page, pageSize, hasMore: page * pageSize < total };
  }

  async getBySlug(slug: string) {
    const partner = await this.prisma.partner.findUnique({ where: { slug } });
    if (!partner) throw new NotFoundException('Partner not found');
    return partner;
  }

  async create(data: any) {
    return this.prisma.partner.create({ data });
  }
}
