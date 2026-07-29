import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('analytics')
@Controller('analytics/platform')
export class PlatformAnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getPlatformMetrics(@Query('days') days?: string) {
    const period = Math.min(Math.max(parseInt(days || '30', 10) || 30, 1), 365);
    const since = new Date();
    since.setDate(since.getDate() - period);

    const [usersTotal, usersNew, studiosTotal, studiosNew, gamesTotal, gamesPublished, usersOnboarded] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.studio.count(),
      this.prisma.studio.count({ where: { createdAt: { gte: since } } }),
      this.prisma.game.count({ where: { isPublished: true } }),
      this.prisma.game.count({ where: { isPublished: true, publishedAt: { gte: since } } }),
      this.prisma.user.count({ where: { isOnboardingCompleted: true } }),
    ]);

    return {
      period,
      users: {
        total: usersTotal,
        new: usersNew,
        onboardingCompleted: usersOnboarded,
        onboardingRate: usersTotal > 0 ? Math.round((usersOnboarded / usersTotal) * 100) : 0,
      },
      studios: {
        total: studiosTotal,
        new: studiosNew,
      },
      games: {
        total: gamesTotal,
        published: gamesPublished,
      },
    };
  }
}
