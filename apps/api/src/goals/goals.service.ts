import { Injectable } from '@nestjs/common';
import { EventBus } from '../common/event-bus';
import type { PlaymorrowEvent } from '../common/event-bus';
import { PrismaService } from '../prisma/prisma.service';

const GOALS = {
  first_game: { title: 'First Published Game', category: 'publishing', description: 'Publish your first game', requirement: 1 },
  five_games: { title: 'Publish 5 Games', category: 'publishing', description: 'Publish 5 games', requirement: 5 },
  first_devlog: { title: 'First Devlog', category: 'content', description: 'Publish your first devlog', requirement: 1 },
  ten_devlogs: { title: 'Publish 10 Devlogs', category: 'content', description: 'Publish 10 devlogs', requirement: 10 },
  complete_roadmap: { title: 'Complete Roadmap', category: 'planning', description: 'Complete your game roadmap', requirement: 1 },
  upload_trailer: { title: 'Upload a Trailer', category: 'media', description: 'Upload a game trailer', requirement: 1 },
  ten_screenshots: { title: 'Upload 10 Screenshots', category: 'media', description: 'Upload 10 screenshots', requirement: 10 },
  reach_100_followers: { title: 'Reach 100 Followers', category: 'growth', description: 'Reach 100 studio followers', requirement: 100 },
  reach_500_followers: { title: 'Reach 500 Followers', category: 'growth', description: 'Reach 500 studio followers', requirement: 500 },
  reach_1000_views: { title: 'Reach 1,000 Views', category: 'growth', description: 'Reach 1,000 game views', requirement: 1000 },
  reach_500_wishlists: { title: 'Reach 500 Wishlists', category: 'growth', description: 'Reach 500 wishlists', requirement: 500 },
  complete_press_kit: { title: 'Complete Press Kit', category: 'publishing', description: 'Complete your press kit', requirement: 1 },
} as const;

type GoalId = keyof typeof GOALS;

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService, private eventBus: EventBus) {
    this.eventBus.on('game_published', (e) => this.progress(e.studioId!, 'first_game', 1));
    this.eventBus.on('game_published', (e) => this.progress(e.studioId!, 'five_games', 1));
    this.eventBus.on('devlog_published', (e) => this.progress(e.studioId!, 'first_devlog', 1));
    this.eventBus.on('devlog_published', (e) => this.progress(e.studioId!, 'ten_devlogs', 1));
    this.eventBus.on('roadmap_updated', (e) => this.progress(e.studioId!, 'complete_roadmap', 1));
    this.eventBus.on('game_updated', (e) => {
      if (e.metadata?.trailerUrl) this.progress(e.studioId!, 'upload_trailer', 1);
      if (e.metadata?.screenshotCount) this.progress(e.studioId!, 'ten_screenshots', e.metadata.screenshotCount as number);
    });
  }

  async initializeGoals(studioId: string): Promise<void> {
    const existing = await this.prisma.studioGoal.findMany({ where: { studioId } });
    const existingKeys = new Set(existing.map((g) => g.goalId));

    const toCreate = Object.entries(GOALS)
      .filter(([key]) => !existingKeys.has(key))
      .map(([key, def]) => ({
        studioId,
        goalId: key,
        title: def.title,
        description: def.description,
        category: def.category,
        requirement: def.requirement,
        progress: 0,
        isCompleted: false,
      }));

    if (toCreate.length > 0) {
      await this.prisma.studioGoal.createMany({ data: toCreate });
    }
  }

  async progress(studioId: string, goalId: GoalId, amount: number): Promise<void> {
    const goal = await this.prisma.studioGoal.findUnique({
      where: { studioId_goalId: { studioId, goalId } },
    });
    if (!goal || goal.isCompleted) return;

    const newProgress = Math.min(goal.progress + amount, goal.requirement);
    const isCompleted = newProgress >= goal.requirement;

    await this.prisma.studioGoal.update({
      where: { id: goal.id },
      data: {
        progress: newProgress,
        isCompleted,
        completedAt: isCompleted ? new Date() : undefined,
      },
    });

    if (isCompleted) {
      this.eventBus.emit({
        type: 'goal_completed',
        studioId,
        targetId: goal.id,
        targetType: 'studio_goal',
        metadata: { goalId, title: goal.title },
      });
    }
  }

  async getGoals(studioId: string) {
    await this.initializeGoals(studioId);
    return this.prisma.studioGoal.findMany({
      where: { studioId },
      orderBy: [{ isCompleted: 'asc' }, { createdAt: 'asc' }],
    });
  }
}
