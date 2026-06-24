import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCommentDto } from './dto/create-comment.dto';
import type { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, devlogId: string, dto: CreateCommentDto) {
    const devlog = await this.prisma.devlog.findUnique({
      where: { id: devlogId },
      include: { game: { include: { studio: true } } },
    });
    if (!devlog) {
      throw new NotFoundException('Devlog not found');
    }
    if (!devlog.isPublished) {
      throw new NotFoundException('Devlog not found');
    }

    let parentAuthorId: string | null = null;

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
      if (parent.devlogId !== devlogId) {
        throw new NotFoundException('Parent comment does not belong to this devlog');
      }
      if (parent.deletedAt) {
        throw new NotFoundException('Cannot reply to a deleted comment');
      }
      parentAuthorId = parent.authorId;
    }

    const comment = await this.prisma.comment.create({
      data: {
        body: dto.body,
        devlogId,
        authorId: userId,
        parentId: dto.parentId ?? null,
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    // ── Notifications ──────────────────────────────────────────────────
    const actor = comment.author;
    const inputs: Array<{
      recipientId: string;
      actorId: string;
      type: string;
      title: string;
      targetType: string;
      targetId: string;
    }> = [];

    if (dto.parentId && parentAuthorId && parentAuthorId !== userId) {
      // Reply to a comment — notify parent author
      inputs.push({
        recipientId: parentAuthorId,
        actorId: userId,
        type: 'NEW_REPLY',
        title: `${actor.displayName} replied to your comment`,
        targetType: 'COMMENT',
        targetId: comment.id,
      });
    } else if (!dto.parentId) {
      // New comment on devlog — notify studio admin/mods
      const adminIds = await this.notificationsService.resolveStudioAdminIds(devlog.game.id, userId);
      for (const id of adminIds) {
        inputs.push({
          recipientId: id,
          actorId: userId,
          type: 'NEW_COMMENT',
          title: `${actor.displayName} commented on ${devlog.title}`,
          targetType: 'DEVLOG',
          targetId: devlog.id,
        });
      }
    }

    if (inputs.length > 0) {
      await this.notificationsService.createManyDeduped(inputs);
    }

    return this.toResponse(comment);
  }

  async findByDevlogId(devlogId: string, userId?: string) {
    const devlog = await this.prisma.devlog.findUnique({
      where: { id: devlogId },
      include: { game: { include: { studio: { include: { members: true } } } } },
    });
    if (!devlog) {
      throw new NotFoundException('Devlog not found');
    }

    // Only published devlogs are publicly visible
    if (!devlog.isPublished) {
      if (!userId) {
        throw new NotFoundException('Devlog not found');
      }
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const isAuthorized =
        user?.role === 'ADMIN' ||
        devlog.game.studio.members.some(
          (m) => m.userId === userId && (m.role === 'OWNER' || m.role === 'ADMIN'),
        );
      if (!isAuthorized) {
        throw new NotFoundException('Devlog not found');
      }
    }

    const comments = await this.prisma.comment.findMany({
      where: { devlogId },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((c) => this.toResponse(c));
  }

  async update(userId: string, commentId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }
    if (comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { body: dto.body },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    return this.toResponse(updated);
  }

  async delete(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { devlog: { include: { game: { include: { studio: { include: { members: true } } } } } } },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check authorization
    const isAuthor = comment.authorId === userId;
    const isGlobalAdmin = user.role === 'ADMIN';
    const isStudioAdmin = comment.devlog
      ? comment.devlog.game.studio.members.some(
          (m) => m.userId === userId && (m.role === 'OWNER' || m.role === 'ADMIN'),
        )
      : false;

    if (!isAuthor && !isGlobalAdmin && !isStudioAdmin) {
      throw new ForbiddenException('You are not allowed to delete this comment');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    return this.toResponse(updated);
  }

  async findByGame(slug: string, page: number, pageSize: number) {
    const game = await this.prisma.game.findUniqueOrThrow({ where: { slug }, select: { id: true } });
    const where = { gameId: game.id, parentId: null, deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          reactions: { select: { type: true, userId: true } },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async createForGame(slug: string, authorId: string, body: string) {
    const game = await this.prisma.game.findUniqueOrThrow({ where: { slug }, select: { id: true } });
    const trimmed = body.trim();
    if (!trimmed) throw new BadRequestException('Comment cannot be empty');
    if (trimmed.length > 1000) throw new BadRequestException('Comment must be 1000 characters or fewer');
    return this.prisma.comment.create({
      data: { gameId: game.id, authorId, body: trimmed },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  async reactToGameComment(commentId: string, userId: string, type: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId }, select: { id: true, gameId: true } });
    if (!comment || !comment.gameId) throw new NotFoundException('Comment not found');

    const reactionType = type as never;
    const validTypes = ['LIKE', 'LOVE', 'HYPE', 'INSIGHTFUL'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException('Invalid reaction type');
    }

    return this.prisma.reaction.upsert({
      where: { userId_commentId_type: { userId, commentId, type: reactionType } },
      create: { userId, commentId, type: reactionType, devlogId: null },
      update: {},
    });
  }

  async removeGameCommentReaction(commentId: string, userId: string, type: string) {
    const reactionType = type as never;
    await this.prisma.reaction.deleteMany({
      where: { userId, commentId, type: reactionType, devlogId: null },
    });
    return { success: true };
  }

  private toResponse(comment: {
    id: string;
    body: string;
    parentId: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    author: { id: string; username: string; displayName: string; avatarUrl: string | null };
  }) {
    if (comment.deletedAt) {
      return {
        id: comment.id,
        body: null,
        isDeleted: true,
        deletedAt: comment.deletedAt.toISOString(),
        parentId: comment.parentId,
        createdAt: comment.createdAt.toISOString(),
      };
    }

    return {
      id: comment.id,
      body: comment.body,
      parentId: comment.parentId,
      deletedAt: null,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        displayName: comment.author.displayName,
        avatarUrl: comment.author.avatarUrl,
      },
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }
}
