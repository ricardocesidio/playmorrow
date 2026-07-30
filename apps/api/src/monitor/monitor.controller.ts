import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('monitor')
@Controller('admin/monitor')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('ADMIN')
export class MonitorController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get system monitoring metrics' })
  async getMetrics() {
    const [userCount, studioCount, gameCount, totalReports, emailLogs24h, pendingEmails] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.studio.count(),
      this.prisma.game.count(),
      this.prisma.moderationReport.count({ where: { status: 'OPEN' } }),
      this.prisma.emailLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      this.prisma.emailLog.count({ where: { status: 'failed' } }),
    ]);

    return {
      users: { total: userCount },
      studios: { total: studioCount },
      games: { total: gameCount },
      moderation: { openReports: totalReports },
      email: { last24h: emailLogs24h, pendingFailed: pendingEmails },
      timestamp: new Date().toISOString(),
    };
  }
}
