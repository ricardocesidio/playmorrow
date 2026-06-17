import { Injectable } from '@nestjs/common';
import type { Prisma } from '@playmorrow/database';

import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationInput {
  recipientId: string;
  actorId: string | null;
  type: string;
  title: string;
  body?: string;
  targetType?: string;
  targetId?: string;
}

const NOTIFICATION_INCLUDE = {
  actor: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
} satisfies Prisma.NotificationInclude;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        actorId: input.actorId,
        type: input.type as never,
        title: input.title,
        body: input.body,
        targetType: input.targetType as never,
        targetId: input.targetId,
      },
      include: NOTIFICATION_INCLUDE,
    });
  }

  async createManyDeduped(inputs: CreateNotificationInput[]) {
    // Deduplicate by (recipientId, type, targetId) — one notification per event per user
    const seen = new Set<string>();
    const unique: CreateNotificationInput[] = [];

    for (const input of inputs) {
      const key = `${input.recipientId}:${input.type}:${input.targetId ?? ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(input);
      }
    }

    // Filter out self-notifications
    const filtered = unique.filter((i) => i.recipientId !== i.actorId);

    if (filtered.length === 0) return;

    await this.prisma.notification.createMany({
      data: filtered.map((i) => ({
        recipientId: i.recipientId,
        actorId: i.actorId,
        type: i.type as never,
        title: i.title,
        body: i.body,
        targetType: i.targetType as never,
        targetId: i.targetId,
      })),
    });
  }

  async findByRecipientId(
    recipientId: string,
    page = 1,
    pageSize = 20,
    status?: 'all' | 'unread' | 'read',
  ) {
    const where: Prisma.NotificationWhereInput = { recipientId };

    if (status === 'unread') {
      where.readAt = null;
    } else if (status === 'read') {
      where.readAt = { not: null };
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: NOTIFICATION_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        targetType: n.targetType,
        targetId: n.targetId,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
        actor: n.actor,
      })),
      page,
      pageSize,
      total,
    };
  }

  async getUnreadCount(recipientId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId, readAt: null },
    });
    return { unreadCount: count };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.recipientId !== userId) {
      return null;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
      include: NOTIFICATION_INCLUDE,
    });
  }

  async markAllAsRead(recipientId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  // ── Event helpers called from other services ──────────────────────────

  /** Get studio OWNER/ADMIN member IDs directly from a studio (excluding the actor). */
  async resolveStudioAdminIdsForStudio(studioId: string, excludeUserId?: string): Promise<string[]> {
    const studio = await this.prisma.studio.findUnique({
      where: { id: studioId },
      include: { members: true },
    });
    if (!studio) return [];

    return studio.members
      .filter((m) => (m.role === 'OWNER' || m.role === 'ADMIN') && m.userId !== excludeUserId)
      .map((m) => m.userId);
  }

  /** Get studio OWNER/ADMIN member IDs for a game (excluding the actor). */
  async resolveStudioAdminIds(gameId: string, excludeUserId?: string): Promise<string[]> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { studio: { include: { members: true } } },
    });
    if (!game) return [];

    return game.studio.members
      .filter((m) => (m.role === 'OWNER' || m.role === 'ADMIN') && m.userId !== excludeUserId)
      .map((m) => m.userId);
  }

  /** Get parent comment author ID. */
  async resolveParentCommentAuthorId(commentId: string): Promise<string | null> {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    return comment?.authorId ?? null;
  }
}
