import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudioChatService {
  constructor(private prisma: PrismaService) {}

  private async assertAdminOrOwner(studioId: string, userId: string) {
    const membership = await this.prisma.studioMember.findUnique({
      where: { studioId_userId: { studioId, userId } },
    });
    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      throw new ForbiddenException('Only the Owner or an Admin can perform this action');
    }
  }

  async postMessage(studioId: string, authorId: string, message: string) {
    const membership = await this.prisma.studioMember.findUnique({
      where: { studioId_userId: { studioId, userId: authorId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this studio');

    return this.prisma.studioChatMessage.create({
      data: { studioId, authorId, message: message.slice(0, 2000) },
      include: { author: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
    });
  }

  async getFeed(studioId: string, limit = 50) {
    const [chatMessages, auditLogs] = await Promise.all([
      this.prisma.studioChatMessage.findMany({
        where: { studioId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { author: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
      }),
      this.prisma.auditLog.findMany({
        where: { studioId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { actor: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
      }),
    ]);

    const items: any[] = [
      ...chatMessages.map(m => ({ type: 'chat', ...m, author: m.author })),
      ...auditLogs.map(l => ({ type: 'system', id: l.id, action: l.action, actor: l.actor, metadata: l.metadata, createdAt: l.createdAt })),
    ];

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { items: items.slice(0, limit) };
  }

  async deleteMessage(studioId: string, messageId: string, userId: string) {
    const msg = await this.prisma.studioChatMessage.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.studioId !== studioId) throw new ForbiddenException('Message does not belong to this studio');

    const membership = await this.prisma.studioMember.findUnique({
      where: { studioId_userId: { studioId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this studio');

    const isOwner = msg.authorId === userId;
    const isAdminOrOwner = membership.role === 'OWNER' || membership.role === 'ADMIN';

    if (!isOwner && !isAdminOrOwner) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.studioChatMessage.delete({ where: { id: messageId } });
  }

  async clearMessages(studioId: string, userId: string) {
    await this.assertAdminOrOwner(studioId, userId);
    await this.prisma.studioChatMessage.deleteMany({ where: { studioId } });
  }
}
