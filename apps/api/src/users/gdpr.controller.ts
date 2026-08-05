import { Controller, Get, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('me')
@UseGuards(SessionAuthGuard)
export class GdprController {
  constructor(private prisma: PrismaService) {}

  @Get('export')
  async exportData(@CurrentUser() user: { id: string }) {
    const [
      profile,
      sessions,
      wishlists,
      follows,
      reactions,
      comments,
      licenses,
      notifications,
      reports,
      studioMemberships,
    ] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: user.id }, select: { id: true, username: true, email: true, avatarUrl: true, bio: true, createdAt: true, updatedAt: true } }),
      this.prisma.session.findMany({ where: { userId: user.id }, select: { id: true, createdAt: true, expiresAt: true } }),
      this.prisma.wishlistItem.findMany({ where: { userId: user.id }, select: { gameId: true, createdAt: true } }),
      this.prisma.follow.findMany({ where: { userId: user.id }, select: { studioId: true, gameId: true, targetType: true, createdAt: true } }),
      this.prisma.reaction.findMany({ where: { userId: user.id }, select: { devlogId: true, commentId: true, type: true, createdAt: true } }),
      this.prisma.comment.findMany({ where: { authorId: user.id }, select: { id: true, gameId: true, devlogId: true, body: true, createdAt: true } }),
      this.prisma.purchasedLicense.findMany({ where: { userId: user.id }, select: { listingId: true, purchasedAt: true, active: true } }),
      this.prisma.notification.findMany({ where: { recipientId: user.id }, select: { id: true, type: true, body: true, readAt: true, createdAt: true }, take: 500 }),
      this.prisma.moderationReport.findMany({ where: { reporterId: user.id }, select: { id: true, reason: true, status: true, createdAt: true } }),
      this.prisma.studioMember.findMany({ where: { userId: user.id }, select: { studioId: true, role: true, joinedAt: true } }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user: user.id,
      data: { profile, sessions, wishlists, follows, reactions, comments, licenses, notifications, reports, studioMemberships },
      version: '1.0',
    };
  }
}
