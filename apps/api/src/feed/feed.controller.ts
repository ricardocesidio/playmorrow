import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { FeedService, type FeedResult } from './feed.service';

@ApiTags('feed')
@Controller()
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('me/feed')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Personalized feed for current user.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['all', 'devlogs', 'roadmap'] })
  async getPersonalFeed(
    @CurrentUser() user: { id: string },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('type', new DefaultValuePipe('all')) type: 'all' | 'devlogs' | 'roadmap',
  ): Promise<FeedResult> {
    return this.feedService.getPersonalFeed(user.id, page, pageSize, type);
  }

  @Get('feed/public')
  @ApiOkResponse({ description: 'Public feed of latest content.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['all', 'devlogs', 'roadmap'] })
  async getPublicFeed(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('type', new DefaultValuePipe('all')) type: 'all' | 'devlogs' | 'roadmap',
  ): Promise<FeedResult> {
    return this.feedService.getPublicFeed(page, pageSize, type);
  }
}
