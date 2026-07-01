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

    if (reason !== 'DAILY_LOGIN') {
      const capped = await this.checkDailyCap(userId);
      if (capped) return { levelUp: false, newLevel: 0, xp: 0 };
    }

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

  async awardDailyLogin(userId: string): Promise<{ streak: number; xpAwarded: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingToday = await this.prisma.playerXpEvent.findFirst({
      where: { userId, reason: 'DAILY_LOGIN', createdAt: { gte: today } },
    });
    if (existingToday) return { streak: 0, xpAwarded: 0 };

    const lastLogin = await this.prisma.playerXpEvent.findFirst({
      where: { userId, reason: 'DAILY_LOGIN' },
      orderBy: { createdAt: 'desc' },
    });

    let streak = 1;
    if (lastLogin) {
      const lastDate = new Date(lastLogin.createdAt);
      lastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);
      if (diffDays === 1) {
        const recent = await this.prisma.playerXpEvent.findMany({
          where: { userId, reason: 'DAILY_LOGIN' },
          orderBy: { createdAt: 'desc' },
          take: 30,
        });
        streak = 1;
        for (let i = 0; i < recent.length; i++) {
          if (i > 0) {
            const prev = new Date(recent[i - 1].createdAt);
            const curr = new Date(recent[i].createdAt);
            prev.setHours(0, 0, 0, 0);
            curr.setHours(0, 0, 0, 0);
            const d = Math.floor((prev.getTime() - curr.getTime()) / 86400000);
            if (d === 1) streak++;
            else break;
          }
        }
        streak++;
      }
    }

    let xpAmount = 2;
    if (streak >= 31) xpAmount = 25;
    else if (streak >= 21) xpAmount = 20;
    else if (streak >= 14) xpAmount = 15;
    else if (streak >= 7) xpAmount = 10;
    else if (streak >= 3) xpAmount = 5;

    await this.prisma.playerXpEvent.create({
      data: { userId, reason: 'DAILY_LOGIN', amount: xpAmount },
    });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xpAmount } },
    });
    const newLevel = this.calculateLevel(user.xp ?? 0);
    if (newLevel > (user.level ?? 0)) {
      await this.prisma.user.update({ where: { id: userId }, data: { level: newLevel } });
    }

    return { streak, xpAwarded: xpAmount };
  }

  private async checkDailyCap(userId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await this.prisma.playerXpEvent.aggregate({
      where: { userId, createdAt: { gte: today } },
      _sum: { amount: true },
    });
    return (result._sum.amount ?? 0) >= 100;
  }
}
