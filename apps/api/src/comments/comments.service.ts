import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCommentDto } from './dto/create-comment.dto';
import type { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

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
    const isStudioAdmin = comment.devlog.game.studio.members.some(
      (m) => m.userId === userId && (m.role === 'OWNER' || m.role === 'ADMIN'),
    );

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
