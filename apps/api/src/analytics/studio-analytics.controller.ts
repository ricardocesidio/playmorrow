import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StudioRole } from '@playmorrow/database';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';

@ApiTags('studio-analytics')
@Controller('studios/:slug/analytics')
export class StudioAnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Full studio analytics dashboard data.' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d', 'all'] })
  async getDashboard(
    @Param('slug') slug: string,
    @Query('period') period: '7d' | '30d' | '90d' | 'all' = '30d',
    @CurrentUser() user: { id: string },
  ) {
    const studio = await this.prisma.studio.findUnique({
      where: { slug: slug.toLowerCase() },
      include: { members: true },
    });
    if (!studio) throw new NotFoundException('Studio not found');

    const membership = studio.members.find((m) => m.userId === user.id);
    if (!membership) throw new NotFoundException('Studio not found');

    const stats = await this.analyticsService.getStudioStats(studio.id, period);
    return { studio: { id: studio.id, name: studio.name, slug: studio.slug }, ...stats };
  }

  @Get('games')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Top games for a studio.' })
  async getTopGames(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
  ) {
    const studio = await this.prisma.studio.findUnique({
      where: { slug: slug.toLowerCase() },
      include: { members: true },
    });
    if (!studio) throw new NotFoundException('Studio not found');

    const membership = studio.members.find((m) => m.userId === user.id);
    if (!membership) throw new NotFoundException('Studio not found');

    const topGames = await this.analyticsService.getTopGames(studio.id);
    return { games: topGames };
  }

  @Get('overview')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Quick analytics overview.' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d', 'all'] })
  async getOverview(
    @Param('slug') slug: string,
    @Query('period') period: '7d' | '30d' | '90d' | 'all' = '30d',
    @CurrentUser() user: { id: string },
  ) {
    const studio = await this.prisma.studio.findUnique({
      where: { slug: slug.toLowerCase() },
      include: { members: true },
    });
    if (!studio) throw new NotFoundException('Studio not found');

    const membership = studio.members.find((m) => m.userId === user.id);
    if (!membership) throw new NotFoundException('Studio not found');

    const stats = await this.analyticsService.getStudioStats(studio.id, period);
    return {
      totalViews: stats.totalViews,
      totalFollowers: stats.totalFollowers,
      totalWishlists: stats.totalWishlists,
      gameCount: stats.gameCount,
      memberCount: stats.memberCount,
      topGames: stats.topGames.slice(0, 5),
      period,
    };
  }
}
