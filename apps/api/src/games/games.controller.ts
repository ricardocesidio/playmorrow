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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { GamesService } from './games.service';

@ApiTags('games')
@Controller()
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post('studios/:studioSlug/games')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Game created.' })
  async create(
    @CurrentUser() user: { id: string },
    @Param('studioSlug') studioSlug: string,
    @Body() dto: CreateGameDto,
  ) {
    return this.gamesService.create(user.id, studioSlug, dto);
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
  async findBySlug(@Param('slug') slug: string) {
    const game = await this.gamesService.findBySlug(slug);
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }

  @Patch('games/:slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Game updated.' })
  async update(
    @CurrentUser() user: { id: string },
    @Param('slug') slug: string,
    @Body() dto: UpdateGameDto,
  ) {
    return this.gamesService.update(user.id, slug, dto);
  }

  @Delete('games/:slug')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Game deleted (cascades to devlogs, media, etc.).' })
  async remove(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.gamesService.remove(user.id, slug);
  }
}
