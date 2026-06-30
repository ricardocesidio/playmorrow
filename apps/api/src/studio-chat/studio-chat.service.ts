import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudioChatService {
  constructor(private prisma: PrismaService) {}

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
}
