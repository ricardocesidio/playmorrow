import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type XpEventType =
  | 'PROFILE_COMPLETE'
  | 'GAME_CREATE'
  | 'GAME_RELEASE'
  | 'GAME_BETA'
  | 'DEVLOG_PUBLISH'
  | 'ROADMAP_UPDATE'
  | 'PRESS_KIT'
  | 'PLATFORM_LINK'
  | 'MEDIA_UPLOAD'
  | 'FOLLOW'
  | 'WISHLIST'
  | 'COMMENT'
  | 'REACTION'
  | 'FOLLOWER_MILESTONE_100'
  | 'FOLLOWER_MILESTONE_500'
  | 'WISHLIST_MILESTONE_100'
  | 'WISHLIST_MILESTONE_1000';

const COMMUNITY_TYPES: XpEventType[] = ['FOLLOW', 'WISHLIST', 'COMMENT', 'REACTION'];

const XP_VALUES: Record<XpEventType, number> = {
  PROFILE_COMPLETE: 40,
  GAME_CREATE: 50,
  GAME_RELEASE: 100,
  GAME_BETA: 50,
  DEVLOG_PUBLISH: 25,
  ROADMAP_UPDATE: 15,
  PRESS_KIT: 40,
  PLATFORM_LINK: 10,
  MEDIA_UPLOAD: 10,
  FOLLOW: 5,
  WISHLIST: 3,
  COMMENT: 5,
  REACTION: 3,
  FOLLOWER_MILESTONE_100: 25,
  FOLLOWER_MILESTONE_500: 50,
  WISHLIST_MILESTONE_100: 30,
  WISHLIST_MILESTONE_1000: 75,
};

const DAILY_CAP = 200;

@Injectable()
export class StudioXpService {
  constructor(private prisma: PrismaService) {}

  async award(
    studioId: string,
    type: XpEventType,
    amount?: number,
    sourceId?: string,
  ): Promise<{ levelUp: boolean; newLevel: number }> {
    const xpAmount = amount ?? XP_VALUES[type];

    if (COMMUNITY_TYPES.includes(type)) {
      const capReached = await this.checkDailyCap(studioId);
      if (capReached) return { levelUp: false, newLevel: 0 };
    }

    await this.prisma.studioXpEvent.create({
      data: {
        studioId,
        type,
        amount: xpAmount,
        sourceId,
      },
    });

    const studio = await this.prisma.studio.update({
      where: { id: studioId },
      data: { xp: { increment: xpAmount } },
    });

    const newLevel = this.calculateLevel(studio.xp);
    const levelUp = newLevel > studio.level;

    if (levelUp) {
      await this.prisma.studio.update({
        where: { id: studioId },
        data: { level: newLevel },
      });
    }

    return { levelUp, newLevel: levelUp ? newLevel : studio.level };
  }

  private async checkDailyCap(studioId: string): Promise<boolean> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.prisma.studioXpEvent.aggregate({
      where: {
        studioId,
        type: { in: COMMUNITY_TYPES },
        createdAt: { gte: since },
      },
      _sum: { amount: true },
    });
    const total = result._sum.amount ?? 0;
    return total >= DAILY_CAP;
  }

  calculateLevel(xp: number): number {
    const n = Math.floor((1 + Math.sqrt(1 + (8 * xp) / 100)) / 2);
    return Math.max(1, n);
  }
}
