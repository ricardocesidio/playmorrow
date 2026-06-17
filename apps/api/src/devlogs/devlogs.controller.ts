import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { CreateDevlogDto } from './dto/create-devlog.dto';
import { UpdateDevlogDto } from './dto/update-devlog.dto';
import { DevlogsService } from './devlogs.service';

@ApiTags('devlogs')
@Controller()
export class DevlogsController {
  constructor(private readonly devlogsService: DevlogsService) {}

  @Post('games/:gameSlug/devlogs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Devlog created.' })
  async create(
    @CurrentUser() user: { id: string },
    @Param('gameSlug') gameSlug: string,
    @Body() dto: CreateDevlogDto,
  ) {
    return this.devlogsService.create(user.id, gameSlug, dto);
  }

  @Get('games/:gameSlug/devlogs')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ description: 'Paginated devlogs for a game.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'includeDrafts', required: false })
  async findByGame(
    @Param('gameSlug') gameSlug: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('includeDrafts', new DefaultValuePipe(false), ParseBoolPipe) includeDrafts: boolean,
    @CurrentUser() user?: { id: string },
  ) {
    return this.devlogsService.findByGameSlug(gameSlug, page, Math.min(pageSize, 100), includeDrafts, user?.id);
  }

  @Get('devlogs')
  @ApiOkResponse({ description: 'Paginated list of published devlogs.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('search') search?: string,
  ) {
    return this.devlogsService.findAllPublished(page, Math.min(pageSize, 100), search);
  }

  @Get('devlogs/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ description: 'Devlog detail.' })
  async findById(@Param('id') id: string, @CurrentUser() user?: { id: string }) {
    const devlog = await this.devlogsService.findById(id, user?.id);
    if (!devlog) {
      throw new NotFoundException('Devlog not found');
    }
    return devlog;
  }

  @Patch('devlogs/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Devlog updated.' })
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateDevlogDto,
  ) {
    return this.devlogsService.update(user.id, id, dto);
  }
}
