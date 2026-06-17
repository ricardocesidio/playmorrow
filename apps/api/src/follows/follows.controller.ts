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
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { FollowsService } from './follows.service';

@ApiTags('follows')
@Controller()
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('studios/:slug/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Followed studio.' })
  async followStudio(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.followsService.followStudio(user.id, slug);
  }

  @Delete('studios/:slug/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Unfollowed studio.' })
  async unfollowStudio(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.followsService.unfollowStudio(user.id, slug);
  }

  @Post('games/:slug/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Followed game.' })
  async followGame(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.followsService.followGame(user.id, slug);
  }

  @Delete('games/:slug/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Unfollowed game.' })
  async unfollowGame(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.followsService.unfollowGame(user.id, slug);
  }

  @Get('studios/:slug/follow-status')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ description: 'Studio follow status.' })
  async studioFollowStatus(
    @CurrentUser() user: { id: string } | undefined,
    @Param('slug') slug: string,
  ) {
    return this.followsService.getStudioFollowStatus(user?.id, slug);
  }

  @Get('games/:slug/follow-status')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ description: 'Game follow status.' })
  async gameFollowStatus(
    @CurrentUser() user: { id: string } | undefined,
    @Param('slug') slug: string,
  ) {
    return this.followsService.getGameFollowStatus(user?.id, slug);
  }

  @Get('me/follows')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: "Current user's follows." })
  async getMyFollows(@CurrentUser() user: { id: string }) {
    return this.followsService.getMyFollows(user.id);
  }
}
