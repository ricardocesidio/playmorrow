import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from '../analytics/analytics.service';
import { EventBus } from '../common/event-bus';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { GamesService } from './games.service';

@ApiTags('games')
@Controller()
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly analyticsService: AnalyticsService,
    private readonly eventBus: EventBus,
  ) {}

  @Post('studios/:studioSlug/games')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseGuards(SessionAuthGuard)
  @ApiCreatedResponse({ description: 'Game created.' })
  async create(
    @CurrentUser() user: { id: string },
    @Param('studioSlug') studioSlug: string,
    @Body() dto: CreateGameDto,
  ) {
    const game = await this.gamesService.create(user.id, studioSlug, dto);
    if (dto.status === 'RELEASED') {
      this.eventBus.emit({ type: 'game_published', actorId: user.id, gameId: game.id, studioId: game.studio?.id, targetType: 'GAME', targetId: game.id, metadata: { title: game.title } });
    }
    this.eventBus.emit({ type: 'game_updated', actorId: user.id, gameId: game.id, studioId: game.studio?.id, targetType: 'GAME', targetId: game.id });
    return game;
  }

  @Get('studios/:studioSlug/games')
  @ApiOkResponse({ description: 'Paginated games for a studio.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findByStudio(
    @Param('studioSlug') studioSlug: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('status') status?: string,
  ) {
    return this.gamesService.findByStudioSlug(studioSlug, page, Math.min(pageSize, 100), status);
  }

  @Get('games')
  @ApiOkResponse({ description: 'Paginated list of games.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'tag', required: false })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('tag') tag?: string,
  ) {
    return this.gamesService.findAll(page, Math.min(pageSize, 100), { search, status, tag });
  }

  @Get('games/:slug')
  @ApiOkResponse({ description: 'Game profile.' })
  async findBySlug(@Param('slug') slug: string, @Req() req: Request) {
    const game = await this.gamesService.findBySlug(slug);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    this.analyticsService.track({
      eventType: 'game_view',
      gameId: game.id,
      studioId: game.studio?.id,
      sessionId: (req as Request & { sessionId?: string }).sessionId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers['referer'],
    }).catch(() => {});

    this.eventBus.emit({ type: 'game_view', gameId: game.id, studioId: game.studio?.id, targetType: 'GAME', targetId: game.id });

    return game;
  }

  @Patch('games/:slug')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Game updated.' })
  async update(
    @CurrentUser() user: { id: string },
    @Param('slug') slug: string,
    @Body() dto: UpdateGameDto,
  ) {
    const game = await this.gamesService.update(user.id, slug, dto);
    if (dto.status === 'RELEASED' && game.status === 'RELEASED') {
      this.eventBus.emit({ type: 'game_published', actorId: user.id, gameId: game.id, studioId: game.studio?.id, targetType: 'GAME', targetId: game.id, metadata: { title: game.title } });
    }
    this.eventBus.emit({ type: 'game_updated', actorId: user.id, gameId: game.id, studioId: game.studio?.id, targetType: 'GAME', targetId: game.id, metadata: { trailerUrl: dto.trailerUrl, screenshotCount: dto.media?.length } });
    return game;
  }

  @Delete('games/:slug')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Game deleted (cascades to devlogs, media, etc.).' })
  async remove(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.gamesService.remove(user.id, slug);
  }
}
