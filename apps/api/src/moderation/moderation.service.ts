import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../common/event-bus';
import { logger } from '../common/logger';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async suspendUser(adminId: string, userId: string, reason: string, durationHours: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') throw new BadRequestException('Cannot suspend an admin');

    const suspendedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: { suspendedUntil, appealCount: 0 },
    });

    logger.info({ action: 'user_suspended', moderatorId: adminId, targetId: userId, reason, durationHours }, 'Moderation: user suspended');

    this.eventBus.emit({
      type: 'user_suspended',
      actorId: adminId,
      targetType: 'USER',
      targetId: userId,
      metadata: { reason, durationHours, suspendedUntil: suspendedUntil.toISOString() },
    });

    return { suspended: true, suspendedUntil: suspendedUntil.toISOString(), reason };
  }

  async unsuspendUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { suspendedUntil: null },
    });

    logger.info({ action: 'user_unsuspended', moderatorId: adminId, targetId: userId }, 'Moderation: user unsuspended');

    this.eventBus.emit({
      type: 'user_unsuspended',
      actorId: adminId,
      targetType: 'USER',
      targetId: userId,
    });

    return { suspended: false };
  }

  async shadowBanUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { shadowBanned: true },
    });

    logger.info({ action: 'user_shadow_banned', moderatorId: adminId, targetId: userId }, 'Moderation: shadow ban applied');

    this.eventBus.emit({
      type: 'user_shadow_banned',
      actorId: adminId,
      targetType: 'USER',
      targetId: userId,
    });

    return { shadowBanned: true };
  }

  async removeShadowBan(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { shadowBanned: false },
    });

    logger.info({ action: 'user_shadow_ban_removed', moderatorId: adminId, targetId: userId }, 'Moderation: shadow ban removed');

    this.eventBus.emit({
      type: 'user_shadow_ban_removed',
      actorId: adminId,
      targetType: 'USER',
      targetId: userId,
    });

    return { shadowBanned: false };
  }

  async getUserModerationStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        suspendedUntil: true,
        shadowBanned: true,
        appealCount: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
      isSuspended: user.suspendedUntil ? new Date(user.suspendedUntil) > new Date() : false,
      suspendedUntil: user.suspendedUntil?.toISOString() ?? null,
    };
  }

  async fileAppeal(userId: string, reportId: string, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const appeal = await this.prisma.moderationReport.findFirst({
      where: { id: reportId, reporterId: userId },
    });
    if (!appeal) throw new NotFoundException('Report not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { appealCount: { increment: 1 } },
    });

    this.eventBus.emit({
      type: 'appeal_filed',
      actorId: userId,
      targetType: 'REPORT',
      targetId: reportId,
      metadata: { reason },
    });

    return { filed: true, appealCount: (user.appealCount || 0) + 1 };
  }

  async listAppeals(page = 1, pageSize = 20) {
    const users = await this.prisma.user.findMany({
      where: { appealCount: { gt: 0 } },
      select: {
        id: true, username: true, displayName: true,
        appealCount: true, suspendedUntil: true, shadowBanned: true,
      },
      orderBy: { appealCount: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await this.prisma.user.count({ where: { appealCount: { gt: 0 } } });

    return {
      items: users.map(u => ({
        ...u,
        isSuspended: u.suspendedUntil ? new Date(u.suspendedUntil) > new Date() : false,
        suspendedUntil: u.suspendedUntil?.toISOString() ?? null,
      })),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async resolveAppeal(adminId: string, userId: string, resolution: 'APPROVED' | 'DENIED', notes?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (resolution === 'APPROVED') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { suspendedUntil: null, appealCount: 0 },
      });
    }

    this.eventBus.emit({
      type: 'appeal_resolved',
      actorId: adminId,
      targetType: 'USER',
      targetId: userId,
      metadata: { resolution, notes },
    });

    return { resolved: true, resolution };
  }
}
