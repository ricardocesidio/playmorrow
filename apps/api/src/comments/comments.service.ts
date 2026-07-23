import { logger } from '../common/logger';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GamesService } from '../games/games.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlayerXpService } from '../player-xp/player-xp.service';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeHtml } from '../common/sanitize-html';
import { StudioXpService } from '../studios/studio-xp.service';
import type { CreateCommentDto } from './dto/create-comment.dto';
import type { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamesService: GamesService,
    private readonly notificationsService: NotificationsService,
    private readonly playerXpService: PlayerXpService,
    private readonly studioXpService: StudioXpService,
  ) {}

  async create(userId: string, devlogId: string, dto: CreateCommentDto) {
    const devlog = await this.prisma.devlog.findUnique({
      where: { id: devlogId },
      select: {
        id: true,
        isPublished: true,
        title: true,
        game: {
          select: {
            id: true,
            studio: { select: { id: true } },
          },
        },
      },
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
        body: sanitizeHtml(dto.body),
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

    await this.studioXpService.award(devlog.game.studio.id, 'COMMENT', undefined, comment.id);

    // Player XP
    const commentAuthor = await this.prisma.user.findUnique({ where: { id: userId } });
    if (commentAuthor?.accountType === 'PLAYER') {
      await this.playerXpService.award(userId, 'COMMENT', comment.id).catch((err) => logger.error({ err }));
    }

    // Sync game counters
    this.gamesService.syncGameCounters(devlog.game.id).catch((err) => logger.error({ err }));

    return this.toResponse(comment);
  }

  async findByDevlogId(devlogId: string, userId?: string) {
    const devlog = await this.prisma.devlog.findUnique({
      where: { id: devlogId },
      // Explicit select to reduce N+1 (performance audit)
      select: {
        id: true,
        isPublished: true,
        game: {
          select: {
            id: true,
            studio: {
              select: {
                id: true,
                members: { select: { userId: true, role: true } },
              },
            },
          },
        },
      },
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
      where: { devlogId, parentId: null },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        // 4-level recursion support (increased per audit for "Seed and verify 3–4 level nested comments")
        replies: {
          include: {
            author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            replies: {
              include: {
                author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
                replies: {
                  include: {
                    author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
                    replies: {
                      include: {
                        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
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
      data: { body: sanitizeHtml(dto.body) },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    return this.toResponse(updated);
  }

  async delete(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        gameId: true,
        devlog: {
          select: {
            id: true,
            game: {
              select: {
                id: true,
                studio: {
                  select: {
                    id: true,
                    members: { select: { userId: true, role: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check authorization — only studio OWNER/ADMIN/MODERATOR or global ADMIN can delete
    const isGlobalAdmin = user.role === 'ADMIN';
    const studioMembers = comment.devlog
      ? comment.devlog.game.studio.members
      : undefined;
    // For game comments (no devlog), fetch studio membership from the game
    const gameStudioMembers = !studioMembers && comment.gameId
      ? (await this.prisma.game.findUnique({
          where: { id: comment.gameId },
          select: { studio: { select: { members: { select: { userId: true, role: true } } } } },
        }))?.studio.members
      : undefined;
    const members = studioMembers ?? gameStudioMembers ?? [];
    const isStudioMod = members.some(
      (m) => m.userId === userId && (m.role === 'OWNER' || m.role === 'ADMIN' || m.role === 'MODERATOR'),
    );

    if (!isGlobalAdmin && !isStudioMod) {
      throw new ForbiddenException('You are not allowed to delete this comment');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    // Sync game counters
    const gameId = comment.gameId ?? comment.devlog?.game?.id;
    if (gameId) {
      this.gamesService.syncGameCounters(gameId).catch((err) => logger.error({ err }));
    }

    return this.toResponse(updated);
  }

  async findByGame(slug: string, page: number, pageSize: number, currentUserId?: string) {
    const game = await this.prisma.game.findUniqueOrThrow({ where: { slug }, select: { id: true, studioId: true } });
    // Get studio members and their logos for avatar lookup
    const studioMembers = await this.prisma.studioMember.findMany({
      where: { studioId: game.studioId },
      include: { studio: { select: { logoUrl: true } } },
    });
    const memberLogoMap = new Map(studioMembers.map((m) => [m.userId, m.studio.logoUrl]));
    const where = { gameId: game.id, parentId: null, deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          reactions: { select: { type: true, userId: true } },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);
    const transformed = items.map((c) => ({
      id: c.id,
      body: c.body,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      deletedAt: c.deletedAt?.toISOString() ?? null,
      author: c.author,
      studioLogoUrl: memberLogoMap.get(c.authorId) ?? null,
      reactions: (c.reactions as Array<{ type: string; userId: string }>).reduce(
        (acc, r) => { acc[r.type] = (acc[r.type] ?? 0) + 1; return acc; },
        {} as Record<string, number>,
      ),
      viewerReactions: currentUserId
        ? (c.reactions as Array<{ type: string; userId: string }>)
            .filter((r) => r.userId === currentUserId)
            .map((r) => r.type)
        : [],
    }));
    return { items: transformed, total, page, pageSize, hasMore: page * pageSize < total };
  }

  async createForGame(slug: string, authorId: string, body: string) {
    const game = await this.prisma.game.findUniqueOrThrow({ where: { slug }, select: { id: true, studioId: true } });
    const sanitized = sanitizeHtml(body.trim());
    if (!sanitized) throw new BadRequestException('Comment cannot be empty');
    if (sanitized.length > 1000) throw new BadRequestException('Comment must be 1000 characters or fewer');
    const comment = await this.prisma.comment.create({
      data: { gameId: game.id, authorId, body: sanitized },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    await this.studioXpService.award(game.studioId, 'COMMENT', undefined, comment.id);

    // Player XP
    const commentAuthor = await this.prisma.user.findUnique({ where: { id: authorId } });
    if (commentAuthor?.accountType === 'PLAYER') {
      await this.playerXpService.award(authorId, 'COMMENT', comment.id).catch((err) => logger.error({ err }));
    }

    // Sync game counters
    this.gamesService.syncGameCounters(game.id).catch((err) => logger.error({ err }));

    return comment;
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
    replies?: any[];
  }): any {
    if (comment.deletedAt) {
      return {
        id: comment.id,
        body: null,
        isDeleted: true,
        deletedAt: comment.deletedAt.toISOString(),
        parentId: comment.parentId,
        createdAt: comment.createdAt.toISOString(),
        replies: comment.replies?.map((r) => this.toResponse(r)) ?? [],
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
      replies: comment.replies?.map((r) => this.toResponse(r)) ?? [],
    };
  }
}
