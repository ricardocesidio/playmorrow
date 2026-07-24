import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { FollowsService } from './follows.service';

@ApiTags('follows')
@Controller()
export class FollowsController {
  constructor(
    private readonly followsService: FollowsService,
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('studios/:slug/follow')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Followed studio.' })
  async followStudio(@CurrentUser() user: { id: string }, @Param('slug') slug: string, @Req() req: Request) {
    const result = await this.followsService.followStudio(user.id, slug);
    this.analyticsService.track({
      eventType: 'studio_follow',
      studioId: result.targetId,
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});
    return result;
  }

  @Delete('studios/:slug/follow')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Unfollowed studio.' })
  async unfollowStudio(@CurrentUser() user: { id: string }, @Param('slug') slug: string, @Req() req: Request) {
    const result = await this.followsService.unfollowStudio(user.id, slug);
    this.analyticsService.track({
      eventType: 'studio_unfollow',
      studioId: result.targetId,
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});
    return result;
  }

  @Post('games/:slug/follow')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Followed game.' })
  async followGame(@CurrentUser() user: { id: string }, @Param('slug') slug: string, @Req() req: Request) {
    const result = await this.followsService.followGame(user.id, slug);
    const game = await this.prisma.game.findUnique({ where: { slug: slug.toLowerCase() }, select: { studioId: true } });
    this.analyticsService.track({
      eventType: 'game_follow',
      gameId: result.targetId,
      studioId: game?.studioId,
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});
    return result;
  }

  @Delete('games/:slug/follow')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Unfollowed game.' })
  async unfollowGame(@CurrentUser() user: { id: string }, @Param('slug') slug: string, @Req() req: Request) {
    const result = await this.followsService.unfollowGame(user.id, slug);
    const game = await this.prisma.game.findUnique({ where: { slug: slug.toLowerCase() }, select: { studioId: true } });
    this.analyticsService.track({
      eventType: 'game_unfollow',
      gameId: result.targetId,
      studioId: game?.studioId,
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});
    return result;
  }

  @Get('studios/:slug/follow-status')
  @UseGuards(OptionalSessionGuard)
  @ApiOkResponse({ description: 'Studio follow status.' })
  async studioFollowStatus(
    @CurrentUser() user: { id: string } | undefined,
    @Param('slug') slug: string,
  ) {
    return this.followsService.getStudioFollowStatus(user?.id, slug);
  }

  @Get('games/:slug/follow-status')
  @UseGuards(OptionalSessionGuard)
  @ApiOkResponse({ description: 'Game follow status.' })
  async gameFollowStatus(
    @CurrentUser() user: { id: string } | undefined,
    @Param('slug') slug: string,
  ) {
    return this.followsService.getGameFollowStatus(user?.id, slug);
  }

  @Get('me/follows')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: "Current user's follows." })
  async getMyFollows(@CurrentUser() user: { id: string }) {
    return this.followsService.getMyFollows(user.id);
  }
}
