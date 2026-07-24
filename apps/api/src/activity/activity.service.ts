import { Injectable } from '@nestjs/common';
import type { Prisma } from '@playmorrow/database';
import { EventBus } from '../common/event-bus';
import type { PlaymorrowEvent } from '../common/event-bus';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService, private eventBus: EventBus) {
    const eventTypes = [
      'game_view', 'game_wishlisted', 'wishlist_removed', 'studio_followed',
      'studio_unfollowed', 'game_followed', 'game_unfollowed', 'comment_created',
      'devlog_published', 'game_published', 'support_ticket_created', 'goal_completed',
      'achievement_unlocked', 'game_updated', 'roadmap_updated',
    ];

    eventTypes.forEach((type) => {
      this.eventBus.on(type, (event) => this.record(event).catch(() => {}));
    });
  }

  async record(event: PlaymorrowEvent): Promise<void> {
    await this.prisma.activityEvent.create({
      data: {
        eventType: event.type,
        actorId: event.actorId ?? null,
        targetId: event.targetId ?? null,
        targetType: event.targetType ?? null,
        studioId: event.studioId ?? null,
        gameId: event.gameId ?? null,
        metadata: event.metadata ?? undefined,
      } as Prisma.ActivityEventCreateInput,
    });
  }

  async list(query: {
    studioId?: string;
    gameId?: string;
    actorId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);

    const where: Prisma.ActivityEventWhereInput = {};
    if (query.studioId) where.studioId = query.studioId;
    if (query.gameId) where.gameId = query.gameId;
    if (query.actorId) where.actorId = query.actorId;

    const [items, total] = await Promise.all([
      this.prisma.activityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.activityEvent.count({ where }),
    ]);

    return {
      items: items.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        actorId: e.actorId,
        targetId: e.targetId,
        targetType: e.targetType,
        studioId: e.studioId,
        gameId: e.gameId,
        metadata: e.metadata,
        createdAt: e.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }
}
