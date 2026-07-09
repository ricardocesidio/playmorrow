import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * C2: Small shared service to centralize counter updates (followers, wishlists, etc.)
 * Prevents duplication across services.
 */
@Injectable()
export class CountersService {
  constructor(private readonly prisma: PrismaService) {}

  async syncGameCounters(gameId: string) {
    const [followers, wishlists, comments, views] = await Promise.all([
      this.prisma.follow.count({ where: { gameId } }),
      this.prisma.wishlistItem.count({ where: { gameId } }),
      this.prisma.comment.count({ where: { gameId } }),
      this.prisma.gameView.count({ where: { gameId } }),
    ]);

    await this.prisma.game.update({
      where: { id: gameId },
      data: { followersCount: followers, wishlistsCount: wishlists, commentsCount: comments, viewsCount: views },
    });
  }

  async syncStudioCounters(studioId: string) {
    const followers = await this.prisma.follow.count({ where: { studioId } });
    await this.prisma.studio.update({
      where: { id: studioId },
      data: { followersCount: followers },
    });
  }
}
