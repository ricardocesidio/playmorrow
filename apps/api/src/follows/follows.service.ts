import { Injectable, NotFoundException } from '@nestjs/common';

import { logger } from '../common/logger';
import { GamesService } from '../games/games.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlayerXpService } from '../player-xp/player-xp.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudioXpService } from '../studios/studio-xp.service';

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamesService: GamesService,
    private readonly notificationsService: NotificationsService,
    private readonly playerXpService: PlayerXpService,
    private readonly studioXpService: StudioXpService,
  ) {}

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

    // Keep denormalized count in sync (centralized side effect)
    await this.prisma.studio.update({
      where: { id: studio.id },
      data: { followersCount: followerCount },
    });

    await this.studioXpService.award(studio.id, 'FOLLOW');

    const followerMilestones = [100, 500];
    for (const m of followerMilestones) {
      if (followerCount === m) {
        const existing = await this.prisma.studioXpEvent.findFirst({
          where: { studioId: studio.id, type: m === 100 ? 'FOLLOWER_MILESTONE_100' : 'FOLLOWER_MILESTONE_500' },
        });
        if (!existing) {
          await this.studioXpService.award(studio.id, m === 100 ? 'FOLLOWER_MILESTONE_100' : 'FOLLOWER_MILESTONE_500');
        }
      }
    }

    // Player XP
    const actor = await this.prisma.user.findUnique({ where: { id: userId } });
    if (actor && actor.accountType === 'PLAYER') {
      await this.playerXpService.award(userId, 'FOLLOW_STUDIO', studio.id).catch(() => {});
    }

    // Notify studio OWNER/ADMIN members
    const adminIds = await this.notificationsService.resolveStudioAdminIdsForStudio(studio.id, userId);
    if (adminIds.length > 0 && actor) {
      await this.notificationsService.createManyDeduped(
        adminIds.map((recipientId) => ({
          recipientId,
          actorId: userId,
          type: 'NEW_FOLLOWER',
          title: `${actor.displayName} followed your studio`,
          targetType: 'STUDIO',
          targetId: studio.id,
        })),
      );
    }

    logger.info({ msg: 'studio followed', studioId: studio.id, userId });

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

    // Keep denormalized count in sync
    await this.prisma.studio.update({
      where: { id: studio.id },
      data: { followersCount: followerCount },
    });

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

    // Player XP
    const actor = await this.prisma.user.findUnique({ where: { id: userId } });
    if (actor && actor.accountType === 'PLAYER') {
      await this.playerXpService.award(userId, 'FOLLOW_GAME', game.id).catch(() => {});
    }

    // Notify game studio OWNER/ADMIN members
    const adminIds = await this.notificationsService.resolveStudioAdminIds(game.id, userId);
    if (adminIds.length > 0 && actor) {
      await this.notificationsService.createManyDeduped(
        adminIds.map((recipientId) => ({
          recipientId,
          actorId: userId,
          type: 'NEW_FOLLOWER',
          title: `${actor.displayName} is following ${game.title}`,
          targetType: 'GAME',
          targetId: game.id,
        })),
      );
    }

    // Sync game counters
    this.gamesService.syncGameCounters(game.id).catch(() => {});

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

    // Sync game counters
    this.gamesService.syncGameCounters(game.id).catch(() => {});

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
