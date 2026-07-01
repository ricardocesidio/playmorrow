import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const XP_REWARDS = {
  DAILY_LOGIN: 10,
  WISHLIST_GAME: 5,
  FOLLOW_STUDIO: 8,
  FOLLOW_GAME: 5,
  COMMENT: 10,
  RECEIVE_LIKE: 2,
  UPLOAD_AVATAR: 15,
  COMPLETE_PROFILE: 50,
  JOIN_PLAYTEST: 50,
  SAVE_DEVLOG: 8,
  WATCH_TRAILER: 3,
  READ_README: 5,
  VISIT_5_GAMES: 10,
  VISIT_20_GAMES: 20,
};

@Injectable()
export class PlayerXpService {
  constructor(private prisma: PrismaService) {}

  async award(userId: string, reason: keyof typeof XP_REWARDS, reference?: string): Promise<{ levelUp: boolean; newLevel: number; xp: number }> {
    const amount = XP_REWARDS[reason];
    if (!amount) return { levelUp: false, newLevel: 0, xp: 0 };

    await this.prisma.playerXpEvent.create({
      data: { userId, reason, amount, reference: reference ?? null },
    });

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
    });

    const totalXp = user.xp ?? 0;
    const newLevel = this.calculateLevel(totalXp);
    const levelUp = newLevel > (user.level ?? 0);

    if (levelUp) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });
    }

    return { levelUp, newLevel: levelUp ? newLevel : user.level ?? 0, xp: totalXp };
  }

  async awardCustom(userId: string, reason: string, amount: number, reference?: string): Promise<{ levelUp: boolean; newLevel: number; xp: number }> {
    if (amount <= 0) return { levelUp: false, newLevel: 0, xp: 0 };

    await this.prisma.playerXpEvent.create({
      data: { userId, reason, amount, reference: reference ?? null },
    });

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
    });

    const totalXp = user.xp ?? 0;
    const newLevel = this.calculateLevel(totalXp);
    const levelUp = newLevel > (user.level ?? 0);

    if (levelUp) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });
    }

    return { levelUp, newLevel: levelUp ? newLevel : user.level ?? 0, xp: totalXp };
  }

  async getHistory(userId: string, limit = 20) {
    return this.prisma.playerXpEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getWeeklyXp(userId: string): Promise<number> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.playerXpEvent.aggregate({
      where: { userId, createdAt: { gte: weekAgo } },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  async getMonthlyXp(userId: string): Promise<number> {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.playerXpEvent.aggregate({
      where: { userId, createdAt: { gte: monthAgo } },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  calculateLevel(xp: number): number {
    return Math.max(0, Math.floor((Math.sqrt(1 + 8 * xp / 100) - 1) / 2));
  }

  getXpForLevel(level: number): number {
    return 100 * level * (level + 1) / 2;
  }
}
