import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { CreateReportDto } from './dto/create-report.dto';
import type { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReportDto) {
    // Validate target exists
    await this.resolveTarget(dto.targetType, dto.targetId);

    // Check for existing report by same user + target
    const existing = await this.prisma.moderationReport.findFirst({
      where: { reporterId: userId, targetType: dto.targetType, targetId: dto.targetId },
    });
    if (existing) {
      throw new ConflictException('You have already reported this content');
    }

    const report = await this.prisma.moderationReport.create({
      data: {
        reporterId: userId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details,
      },
      include: { reporter: { select: { id: true, username: true } } },
    });

    return {
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      details: report.details,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
    };
  }

  async findAll(page = 1, pageSize = 20, status?: string) {
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      this.prisma.moderationReport.findMany({
        where,
        include: { reporter: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.moderationReport.count({ where }),
    ]);

    return {
      items: reports.map((r) => ({
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        details: r.details,
        status: r.status,
        reporter: r.reporter,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async findById(id: string) {
    const report = await this.prisma.moderationReport.findUnique({
      where: { id },
      include: { reporter: { select: { id: true, username: true } } },
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return {
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      details: report.details,
      status: report.status,
      reporter: report.reporter,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }

  async update(id: string, dto: UpdateReportDto, resolvedById: string) {
    const report = await this.prisma.moderationReport.findUnique({
      where: { id },
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updated = await this.prisma.moderationReport.update({
      where: { id },
      data: {
        status: dto.status,
        resolvedById: dto.status === 'OPEN' ? null : resolvedById,
        resolvedAt: dto.status === 'OPEN' ? null : new Date(),
      },
      include: { reporter: { select: { id: true, username: true } } },
    });

    return {
      id: updated.id,
      targetType: updated.targetType,
      targetId: updated.targetId,
      reason: updated.reason,
      details: updated.details,
      status: updated.status,
      reporter: updated.reporter,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  private async resolveTarget(targetType: string, targetId: string) {
    switch (targetType) {
      case 'STUDIO': {
        const s = await this.prisma.studio.findUnique({ where: { id: targetId } });
        if (!s) throw new NotFoundException('Target not found');
        return;
      }
      case 'GAME': {
        const g = await this.prisma.game.findUnique({ where: { id: targetId } });
        if (!g) throw new NotFoundException('Target not found');
        return;
      }
      case 'DEVLOG': {
        const d = await this.prisma.devlog.findUnique({ where: { id: targetId } });
        if (!d) throw new NotFoundException('Target not found');
        return;
      }
      case 'COMMENT': {
        const c = await this.prisma.comment.findUnique({ where: { id: targetId } });
        if (!c) throw new NotFoundException('Target not found');
        return;
      }
      case 'USER': {
        const u = await this.prisma.user.findUnique({ where: { id: targetId } });
        if (!u) throw new NotFoundException('Target not found');
        return;
      }
      default:
        throw new NotFoundException('Target not found');
    }
  }
}
