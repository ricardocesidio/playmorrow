import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async followStudio(userId: string, slug: string) {
    const studio = await this.prisma.studio.findUnique({ where: { slug: slug.toLowerCase() } });
    if (!studio) {
      throw new NotFoundException('Studio not found');
    }

    await this.prisma.follow.upsert({
      where: { userId_studioId: { userId, studioId: studio.id } },
      update: {},
      create: { userId, targetType: 'STUDIO', studioId: studio.id },
    });

    const followerCount = await this.prisma.follow.count({ where: { studioId: studio.id } });
    return { targetType: 'STUDIO', targetId: studio.id, isFollowing: true, followerCount };
  }

  async unfollowStudio(userId: string, slug: string) {
    const studio = await this.prisma.studio.findUnique({ where: { slug: slug.toLowerCase() } });
    if (!studio) {
      throw new NotFoundException('Studio not found');
    }

    await this.prisma.follow.deleteMany({
      where: { userId, studioId: studio.id },
    });

    const followerCount = await this.prisma.follow.count({ where: { studioId: studio.id } });
    return { targetType: 'STUDIO', targetId: studio.id, isFollowing: false, followerCount };
  }

  async followGame(userId: string, slug: string) {
    const game = await this.prisma.game.findUnique({ where: { slug: slug.toLowerCase() } });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    await this.prisma.follow.upsert({
      where: { userId_gameId: { userId, gameId: game.id } },
      update: {},
      create: { userId, targetType: 'GAME', gameId: game.id },
    });

    const followerCount = await this.prisma.follow.count({ where: { gameId: game.id } });
    return { targetType: 'GAME', targetId: game.id, isFollowing: true, followerCount };
  }

  async unfollowGame(userId: string, slug: string) {
    const game = await this.prisma.game.findUnique({ where: { slug: slug.toLowerCase() } });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    await this.prisma.follow.deleteMany({
      where: { userId, gameId: game.id },
    });

    const followerCount = await this.prisma.follow.count({ where: { gameId: game.id } });
    return { targetType: 'GAME', targetId: game.id, isFollowing: false, followerCount };
  }

  async getMyFollows(userId: string) {
    const follows = await this.prisma.follow.findMany({
      where: { userId },
      include: {
        studio: { select: { id: true, name: true, slug: true, logoUrl: true } },
        game: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
            studio: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const studios = follows
      .filter((f) => f.targetType === 'STUDIO' && f.studio)
      .map((f) => f.studio!);

    const games = follows
      .filter((f) => f.targetType === 'GAME' && f.game)
      .map((f) => f.game!);

    return { studios, games };
  }

  async getStudioFollowStatus(userId: string | undefined, slug: string) {
    const studio = await this.prisma.studio.findUnique({ where: { slug: slug.toLowerCase() } });
    if (!studio) {
      throw new NotFoundException('Studio not found');
    }

    const [followerCount, follow] = await Promise.all([
      this.prisma.follow.count({ where: { studioId: studio.id } }),
      userId
        ? this.prisma.follow.findUnique({
            where: { userId_studioId: { userId, studioId: studio.id } },
          })
        : Promise.resolve(null),
    ]);

    return {
      targetType: 'STUDIO',
      targetId: studio.id,
      isFollowing: !!follow,
      followerCount,
    };
  }

  async getGameFollowStatus(userId: string | undefined, slug: string) {
    const game = await this.prisma.game.findUnique({ where: { slug: slug.toLowerCase() } });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const [followerCount, follow] = await Promise.all([
      this.prisma.follow.count({ where: { gameId: game.id } }),
      userId
        ? this.prisma.follow.findUnique({
            where: { userId_gameId: { userId, gameId: game.id } },
          })
        : Promise.resolve(null),
    ]);

    return {
      targetType: 'GAME',
      targetId: game.id,
      isFollowing: !!follow,
      followerCount,
    };
  }
}
