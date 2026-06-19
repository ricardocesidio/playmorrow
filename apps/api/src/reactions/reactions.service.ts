import { Injectable, NotFoundException } from '@nestjs/common';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── DEVOOG REACTIONS ─────────────────────────────────────────────────

  async reactToDevlog(userId: string, devlogId: string, type: string) {
    const devlog = await this.prisma.devlog.findUnique({
      where: { id: devlogId },
    });
    if (!devlog || !devlog.isPublished) {
      throw new NotFoundException('Devlog not found');
    }

    await this.prisma.reaction.upsert({
      where: { userId_devlogId_type: { userId, devlogId, type: type as never } },
      update: {},
      create: { userId, devlogId, type: type as never },
    });

    // Notify studio OWNER/ADMIN members (exclude actor)
    const adminIds = await this.notificationsService.resolveStudioAdminIds(devlog.gameId, userId);
    const actor = await this.prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });
    if (adminIds.length > 0 && actor) {
      await this.notificationsService.createManyDeduped(
        adminIds.map((recipientId) => ({
          recipientId,
          actorId: userId,
          type: 'NEW_REACTION',
          title: `${actor.displayName} reacted to ${devlog.title}`,
          targetType: 'DEVLOG',
          targetId: devlogId,
        })),
      );
    }

    return this.getDevlogReactions(devlogId, userId);
  }

  async removeDevlogReaction(userId: string, devlogId: string, type?: string) {
    const devlog = await this.prisma.devlog.findUnique({
      where: { id: devlogId },
    });
    if (!devlog) {
      throw new NotFoundException('Devlog not found');
    }

    if (type) {
      await this.prisma.reaction.deleteMany({
        where: { userId, devlogId, type: type as never },
      });
    } else {
      await this.prisma.reaction.deleteMany({
        where: { userId, devlogId },
      });
    }

    return this.getDevlogReactions(devlogId, userId);
  }

  async getDevlogReactions(devlogId: string, userId?: string) {
    const devlog = await this.prisma.devlog.findUnique({
      where: { id: devlogId },
    });
    if (!devlog || !devlog.isPublished) {
      throw new NotFoundException('Devlog not found');
    }

    return this.buildResponse('DEVLOG', devlogId, userId);
  }

  // ── COMMENT REACTIONS ────────────────────────────────────────────────

  async reactToComment(userId: string, commentId: string, type: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    await this.prisma.reaction.upsert({
      where: { userId_commentId_type: { userId, commentId, type: type as never } },
      update: {},
      create: { userId, commentId, type: type as never },
    });

    // Notify comment author (exclude actor)
    if (comment.authorId !== userId) {
      const actor = await this.prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });
      if (actor) {
        await this.notificationsService.createManyDeduped([{
          recipientId: comment.authorId,
          actorId: userId,
          type: 'NEW_REACTION',
          title: `${actor.displayName} reacted to your comment`,
          targetType: 'COMMENT',
          targetId: commentId,
        }]);
      }
    }

    return this.getCommentReactions(commentId, userId);
  }

  async removeCommentReaction(userId: string, commentId: string, type?: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (type) {
      await this.prisma.reaction.deleteMany({
        where: { userId, commentId, type: type as never },
      });
    } else {
      await this.prisma.reaction.deleteMany({
        where: { userId, commentId },
      });
    }

    return this.getCommentReactions(commentId, userId);
  }

  async getCommentReactions(commentId: string, userId?: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    return this.buildResponse('COMMENT', commentId, userId);
  }

  /**
   * Batch reactions for every (non-deleted) comment on a devlog in two queries,
   * keyed by commentId — replaces the per-comment N+1 fan-out (#9 / #24).
   * Comments with no reactions are simply absent from the map.
   */
  async getCommentReactionsForDevlog(devlogId: string, userId?: string) {
    const devlog = await this.prisma.devlog.findUnique({ where: { id: devlogId } });
    if (!devlog || !devlog.isPublished) {
      throw new NotFoundException('Devlog not found');
    }

    const [grouped, viewer] = await Promise.all([
      this.prisma.reaction.groupBy({
        by: ['commentId', 'type'],
        where: { comment: { devlogId, deletedAt: null } },
        _count: { type: true },
      }),
      userId
        ? this.prisma.reaction.findMany({
            where: { userId, comment: { devlogId, deletedAt: null } },
            select: { commentId: true, type: true },
          })
        : Promise.resolve([]),
    ]);

    const comments: Record<
      string,
      { counts: Record<string, number>; viewerReactions: string[] }
    > = {};
    const entryFor = (commentId: string) => {
      comments[commentId] ??= {
        counts: { LIKE: 0, LOVE: 0, HYPE: 0, INSIGHTFUL: 0 },
        viewerReactions: [],
      };
      return comments[commentId];
    };

    for (const g of grouped) {
      if (!g.commentId) continue;
      entryFor(g.commentId).counts[g.type] = g._count.type;
    }
    for (const v of viewer) {
      if (!v.commentId) continue;
      entryFor(v.commentId).viewerReactions.push(v.type);
    }

    return { devlogId, comments };
  }

  // ── SHARED ───────────────────────────────────────────────────────────

  private async buildResponse(
    targetType: 'DEVLOG' | 'COMMENT',
    targetId: string,
    userId?: string,
  ) {
    const targetField = targetType === 'DEVLOG' ? 'devlogId' : 'commentId';

    const [reactions, viewerReactions] = await Promise.all([
      this.prisma.reaction.groupBy({
        by: ['type'],
        where: { [targetField]: targetId },
        _count: { type: true },
      }),
      userId
        ? this.prisma.reaction.findMany({
            where: { userId, [targetField]: targetId },
            select: { type: true },
          })
        : Promise.resolve([]),
    ]);

    const counts: Record<string, number> = { LIKE: 0, LOVE: 0, HYPE: 0, INSIGHTFUL: 0 };
    for (const r of reactions) {
      counts[r.type] = r._count.type;
    }

    return {
      targetType,
      targetId,
      counts,
      viewerReactions: viewerReactions.map((r) => r.type),
    };
  }
}
