import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, gameSlug: string) {
    const game = await this.prisma.game.findUnique({ where: { slug: gameSlug } });
    if (!game) throw new NotFoundException('Game not found');

    await this.prisma.wishlistItem.upsert({
      where: { userId_gameId: { userId, gameId: game.id } },
      create: { userId, gameId: game.id },
      update: {},
    });

    return { gameId: game.id, gameSlug, isWishlisted: true };
  }

  async remove(userId: string, gameSlug: string) {
    const game = await this.prisma.game.findUnique({ where: { slug: gameSlug } });
    if (!game) throw new NotFoundException('Game not found');

    await this.prisma.wishlistItem.deleteMany({ where: { userId, gameId: game.id } });

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
