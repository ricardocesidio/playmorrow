import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { FollowsService } from './follows.service';

@ApiTags('follows')
@Controller()
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('studios/:slug/follow')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Followed studio.' })
  async followStudio(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.followsService.followStudio(user.id, slug);
  }

  @Delete('studios/:slug/follow')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Unfollowed studio.' })
  async unfollowStudio(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.followsService.unfollowStudio(user.id, slug);
  }

  @Post('games/:slug/follow')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Followed game.' })
  async followGame(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.followsService.followGame(user.id, slug);
  }

  @Delete('games/:slug/follow')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Unfollowed game.' })
  async unfollowGame(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.followsService.unfollowGame(user.id, slug);
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
