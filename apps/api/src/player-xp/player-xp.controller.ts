import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlayerXpService } from './player-xp.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('me/xp')
@UseGuards(SessionAuthGuard)
export class PlayerXpController {
  constructor(
    private xpService: PlayerXpService,
    private prisma: PrismaService,
  ) {}

  @Get('history')
  async getHistory(@CurrentUser() user: { id: string }) {
    return this.xpService.getHistory(user.id);
  }

  @Get('weekly')
  async getWeekly(@CurrentUser() user: { id: string }) {
    return { weekly: await this.xpService.getWeeklyXp(user.id) };
  }

  @Get('monthly')
  async getMonthly(@CurrentUser() user: { id: string }) {
    return { monthly: await this.xpService.getMonthlyXp(user.id) };
  }

  @Post('daily-login')
  async dailyLogin(@CurrentUser() user: { id: string }) {
    return this.xpService.awardDailyLogin(user.id);
  }
}

@Controller()
export class PlayerXpPublicController {
  constructor(private prisma: PrismaService) {}

  @Get('leaderboard')
  async getLeaderboard() {
    const users = await this.prisma.user.findMany({
      where: { xp: { gt: 0 }, accountType: 'PLAYER' },
      orderBy: { xp: 'desc' },
      take: 50,
      select: { id: true, username: true, displayName: true, avatarUrl: true, level: true, xp: true },
    });
    return users.map((u, i) => ({ rank: i + 1, ...u }));
  }

  @Get('leaderboard/weekly')
  async getWeeklyLeaderboard() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const results = await this.prisma.playerXpEvent.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: weekAgo } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 50,
    });
    const userIds = results.map(r => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, displayName: true, avatarUrl: true, level: true, xp: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    return results.map((r, i) => ({
      rank: i + 1,
      ...userMap.get(r.userId),
      weeklyXp: r._sum.amount ?? 0,
    }));
  }
}
