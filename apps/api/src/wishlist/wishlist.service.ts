import { logger } from '../common/logger';
import { Injectable, NotFoundException } from '@nestjs/common';
import { GamesService } from '../games/games.service';
import { PlayerXpService } from '../player-xp/player-xp.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudioXpService } from '../studios/studio-xp.service';

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamesService: GamesService,
    private readonly playerXpService: PlayerXpService,
    private readonly studioXpService: StudioXpService,
  ) {}

  async add(userId: string, gameSlug: string) {
    const game = await this.prisma.game.findUnique({ where: { slug: gameSlug } });
    if (!game) throw new NotFoundException('Game not found');

    await this.prisma.wishlistItem.upsert({
      where: { userId_gameId: { userId, gameId: game.id } },
      create: { userId, gameId: game.id },
      update: {},
    });

    const studio = await this.prisma.studio.findUnique({
      where: { id: game.studioId },
    });
    if (studio) {
      await this.studioXpService.award(studio.id, 'WISHLIST');

      const wishlistCount = await this.prisma.wishlistItem.count({ where: { gameId: game.id } });
      const wishlistMilestones = [100, 1000];
      for (const m of wishlistMilestones) {
        if (wishlistCount === m) {
          const existing = await this.prisma.studioXpEvent.findFirst({
            where: { studioId: studio.id, type: m === 100 ? 'WISHLIST_MILESTONE_100' : 'WISHLIST_MILESTONE_1000' },
          });
          if (!existing) {
            await this.studioXpService.award(studio.id, m === 100 ? 'WISHLIST_MILESTONE_100' : 'WISHLIST_MILESTONE_1000');
          }
        }
      }
    }

    // Player XP
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.accountType === 'PLAYER') {
      await this.playerXpService.award(userId, 'WISHLIST_GAME', gameSlug).catch((err) => logger.error({ err }));
    }

    // Sync game counters
    this.gamesService.syncGameCounters(game.id).catch((err) => logger.error({ err }));

    return { gameId: game.id, gameSlug, isWishlisted: true };
  }

  async remove(userId: string, gameSlug: string) {
    const game = await this.prisma.game.findUnique({ where: { slug: gameSlug } });
    if (!game) throw new NotFoundException('Game not found');

    await this.prisma.wishlistItem.deleteMany({ where: { userId, gameId: game.id } });

    // Sync game counters
    this.gamesService.syncGameCounters(game.id).catch((err) => logger.error({ err }));

    return { gameId: game.id, gameSlug, isWishlisted: false };
  }

  async status(userId: string | undefined, gameSlug: string) {
    const game = await this.prisma.game.findUnique({ where: { slug: gameSlug } });
    if (!game) throw new NotFoundException('Game not found');

    if (!userId) return { gameId: game.id, gameSlug, isWishlisted: false };

    const item = await this.prisma.wishlistItem.findUnique({
      where: { userId_gameId: { userId, gameId: game.id } },
    });

    return { gameId: game.id, gameSlug, isWishlisted: !!item };
  }

  async list(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        game: {
          select: {
            id: true,
            title: true,
            slug: true,
            tagline: true,
            coverUrl: true,
            status: true,
            studio: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        game: item.game,
      })),
    };
  }
}
