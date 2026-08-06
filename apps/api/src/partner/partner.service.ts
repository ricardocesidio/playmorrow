import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import type { PartnerType, PartnerStatus, Prisma } from '@playmorrow/database';

@Injectable()
export class PartnerService {
  constructor(private prisma: PrismaService) {}

  async list(type?: string, page = 1, pageSize = 20) {
    const where: Prisma.PartnerWhereInput = { status: 'ACTIVE' };
    if (type) where.type = type as PartnerType;

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

  async create(data: CreatePartnerDto) {
    return this.prisma.partner.create({
      data: { ...data, type: data.type as PartnerType },
    });
  }

  async update(slug: string, data: UpdatePartnerDto) {
    const partner = await this.prisma.partner.findUnique({ where: { slug } });
    if (!partner) throw new NotFoundException('Partner not found');
    const { status, type, ...rest } = data;
    return this.prisma.partner.update({
      where: { slug },
      data: {
        ...rest,
        ...(type ? { type: type as PartnerType } : {}),
        ...(status ? { status: status as PartnerStatus } : {}),
      },
    });
  }
}
