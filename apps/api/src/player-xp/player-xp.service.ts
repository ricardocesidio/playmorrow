import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const XP_PER_ACTION = {
  FOLLOW_STUDIO: 5,
  FOLLOW_GAME: 3,
  WISHLIST_GAME: 5,
  COMMENT: 10,
  REACTION: 3,
  DAILY_LOGIN: 2,
  PROFILE_COMPLETED: 25,
};

@Injectable()
export class PlayerXpService {
  constructor(private prisma: PrismaService) {}

  async award(userId: string, action: keyof typeof XP_PER_ACTION, sourceId?: string): Promise<{ levelUp: boolean; newLevel: number }> {
    const amount = XP_PER_ACTION[action];
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
    });
    const newLevel = Math.max(1, Math.floor((1 + Math.sqrt(1 + (8 * (user.xp ?? 0)) / 100)) / 2));
    const levelUp = newLevel > (user.level ?? 1);
    if (levelUp) {
      await this.prisma.user.update({ where: { id: userId }, data: { level: newLevel } });
    }
    return { levelUp, newLevel: levelUp ? newLevel : user.level ?? 1 };
  }

  calculateLevel(xp: number): number {
    return Math.max(1, Math.floor((1 + Math.sqrt(1 + (8 * xp) / 100)) / 2));
  }
}
