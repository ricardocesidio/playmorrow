import { Injectable } from '@nestjs/common';
import { EventBus } from '../common/event-bus';
import { PrismaService } from '../prisma/prisma.service';

const ACHIEVEMENTS = {
  first_game: { title: 'Game Developer', description: 'Published your first game', icon: '🎮' },
  ten_devlogs: { title: 'Storyteller', description: 'Published 10 devlogs', icon: '📝' },
  thousand_followers: { title: 'Rising Star', description: 'Reached 1,000 followers', icon: '⭐' },
  complete_studio: { title: 'Complete Studio', description: 'Profile, trailer, screenshots, press kit done', icon: '🏆' },
} as const;

type AchievementId = keyof typeof ACHIEVEMENTS;

@Injectable()
export class StudioAchievementsService {
  constructor(private prisma: PrismaService, private eventBus: EventBus) {
    this.eventBus.on('goal_completed', (e) => {
      const goalId = e.metadata?.goalId as string;
      if (goalId === 'five_games') this.check(e.studioId!, 'first_game');
      if (goalId === 'ten_devlogs') this.check(e.studioId!, 'ten_devlogs');
    });
  }

  private async getAllStudioData(studioId: string) {
    const studio = await this.prisma.studio.findUnique({
      where: { id: studioId },
      include: {
        games: {
          include: {
            media: { select: { type: true } },
            pressKit: { select: { id: true } },
            roadmapItems: { select: { status: true } },
          },
        },
        _count: { select: { followers: true } },
      },
    });
    return studio;
  }

  async check(studioId: string, achievementId: AchievementId): Promise<void> {
    const existing = await this.prisma.studioAchievement.findUnique({
      where: { studioId_achievementId: { studioId, achievementId } },
    });
    if (existing) return;

    const studio = await this.getAllStudioData(studioId);
    if (!studio) return;

    let shouldUnlock = false;

    switch (achievementId) {
      case 'first_game':
        shouldUnlock = studio.games.some((g) => g.roadmapItems.some((r) => r.status === 'DONE'));
        break;
      case 'ten_devlogs': {
        const devlogCount = await this.prisma.devlog.count({
          where: { game: { studioId }, isPublished: true },
        });
        shouldUnlock = devlogCount >= 10;
        break;
      }
      case 'thousand_followers':
        shouldUnlock = studio._count.followers >= 1000;
        break;
      case 'complete_studio': {
        const hasTrailer = studio.games.some((g) =>
          g.media.some((m) => m.type === 'TRAILER'),
        );
        const hasScreenshots = studio.games.some((g) =>
          g.media.some((m) => m.type === 'SCREENSHOT'),
        );
        const hasPressKit = studio.games.some((g) => g.pressKit);
        shouldUnlock = !!studio.logoUrl && hasTrailer && hasScreenshots && hasPressKit;
        break;
      }
    }

    if (!shouldUnlock) return;

    const achievement = ACHIEVEMENTS[achievementId];
    await this.prisma.studioAchievement.create({
      data: {
        studioId,
        achievementId,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
      },
    });

    this.eventBus.emit({
      type: 'achievement_unlocked',
      studioId,
      targetId: achievementId,
      targetType: 'studio_achievement',
      metadata: { title: achievement.title, icon: achievement.icon },
    });
  }

  async getAchievements(studioId: string) {
    return this.prisma.studioAchievement.findMany({
      where: { studioId },
      orderBy: { unlockedAt: 'desc' },
    });
  }
}
