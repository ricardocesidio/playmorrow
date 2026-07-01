import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  xpReward: number;
  category: string;
  check: (userId: string, prisma: PrismaService) => Promise<boolean>;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_follow', name: 'First Follow', desc: 'Follow your first studio', icon: '🎯', xpReward: 25,
    category: 'Social', check: async (userId, prisma) => {
      const count = await prisma.follow.count({ where: { userId } });
      return count >= 1;
    },
  },
  {
    id: 'wishlister', name: 'Wishlister', desc: 'Add 5 games to your wishlist', icon: '⭐', xpReward: 50,
    category: 'Discovery', check: async (userId, prisma) => {
      const count = await prisma.wishlistItem.count({ where: { userId } });
      return count >= 5;
    },
  },
  {
    id: 'commenter', name: 'Commenter', desc: 'Post your first comment', icon: '💬', xpReward: 25,
    category: 'Community', check: async (userId, prisma) => {
      const count = await prisma.comment.count({ where: { authorId: userId } });
      return count >= 1;
    },
  },
  {
    id: 'social', name: 'Social', desc: 'Follow 10 studios', icon: '👥', xpReward: 75,
    category: 'Social', check: async (userId, prisma) => {
      const count = await prisma.follow.count({ where: { userId, targetType: 'STUDIO' } });
      return count >= 10;
    },
  },
  {
    id: 'explorer', name: 'Explorer', desc: 'Follow 3 games', icon: '🗺️', xpReward: 30,
    category: 'Discovery', check: async (userId, prisma) => {
      const count = await prisma.follow.count({ where: { userId, targetType: 'GAME' } });
      return count >= 3;
    },
  },
  {
    id: 'profile_complete', name: 'Complete Profile', desc: 'Fill in your bio and upload an avatar', icon: '🎨', xpReward: 50,
    category: 'Account', check: async (userId, prisma) => {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      return !!(user?.bio && user?.avatarUrl);
    },
  },
  {
    id: 'level_10', name: 'Rising Star', desc: 'Reach Level 10', icon: '🌟', xpReward: 100,
    category: 'Progression', check: async (userId, prisma) => {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      return (user?.level ?? 0) >= 10;
    },
  },
  {
    id: 'level_25', name: 'Dedicated', desc: 'Reach Level 25', icon: '💎', xpReward: 250,
    category: 'Progression', check: async (userId, prisma) => {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      return (user?.level ?? 0) >= 25;
    },
  },
  {
    id: 'level_50', name: 'Legend', desc: 'Reach Level 50', icon: '👑', xpReward: 500,
    category: 'Progression', check: async (userId, prisma) => {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      return (user?.level ?? 0) >= 50;
    },
  },
];

@Injectable()
export class AchievementService {
  constructor(private prisma: PrismaService) {}

  async getAchievements(userId: string) {
    const unlocked = await this.prisma.achievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true },
    });
    const unlockedMap = new Map(unlocked.map(u => [u.achievementId, u.unlockedAt]));

    return ACHIEVEMENTS.map(def => ({
      id: def.id,
      name: def.name,
      desc: def.desc,
      icon: def.icon,
      xpReward: def.xpReward,
      category: def.category,
      unlocked: unlockedMap.has(def.id),
      unlockedAt: unlockedMap.get(def.id) ?? null,
    }));
  }

  async checkAndAward(userId: string, xpService: { awardCustom: (userId: string, reason: string, amount: number) => Promise<any> }) {
    for (const def of ACHIEVEMENTS) {
      const already = await this.prisma.achievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: def.id } },
      });
      if (already) continue;

      const earned = await def.check(userId, this.prisma);
      if (earned) {
        await this.prisma.achievement.create({
          data: { userId, achievementId: def.id, name: def.name, unlockedAt: new Date() },
        });
        if (def.xpReward > 0) {
          await xpService.awardCustom(userId, `ACHIEVEMENT_${def.id}`, def.xpReward);
        }
      }
    }
  }
}
