import {
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';

@ApiTags('game-analytics')
@Controller('games/:slug/analytics')
export class GameAnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(OptionalSessionGuard)
  @ApiOkResponse({ description: 'Full game analytics.' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d', 'all'] })
  async getGameAnalytics(
    @Param('slug') slug: string,
    @Query('period') period: '7d' | '30d' | '90d' | 'all' = '30d',
  ) {
    const game = await this.prisma.game.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true, title: true, slug: true, studioId: true },
    });
    if (!game) throw new NotFoundException('Game not found');

    const stats = await this.analyticsService.getGameStats(game.id, period);
    return { game: { id: game.id, title: game.title, slug: game.slug }, ...stats };
  }

  @Get('timeseries')
  @UseGuards(OptionalSessionGuard)
  @ApiOkResponse({ description: 'Time-series data for charts.' })
  @ApiQuery({ name: 'eventType', required: true })
  @ApiQuery({ name: 'days', required: false })
  async getTimeSeries(
    @Param('slug') slug: string,
    @Query('eventType') eventType: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const game = await this.prisma.game.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true },
    });
    if (!game) throw new NotFoundException('Game not found');

    const data = await this.analyticsService.getTimeSeries(game.id, eventType, Math.min(days, 365));
    return { points: data };
  }

  @Get('traffic')
  @UseGuards(OptionalSessionGuard)
  @ApiOkResponse({ description: 'Traffic sources for a game.' })
  async getTrafficSources(@Param('slug') slug: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true },
    });
    if (!game) throw new NotFoundException('Game not found');

    const sources = await this.analyticsService.getTrafficSources(game.id);
    return { sources };
  }

  @Get('countries')
  @UseGuards(OptionalSessionGuard)
  @ApiOkResponse({ description: 'Country data for a game.' })
  async getCountries(@Param('slug') slug: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true },
    });
    if (!game) throw new NotFoundException('Game not found');

    const countries = await this.analyticsService.getCountries(game.id);
    return { countries };
  }
}
