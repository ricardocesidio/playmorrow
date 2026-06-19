import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRoadmapItemDto } from './dto/create-roadmap-item.dto';
import { UpdateRoadmapItemDto } from './dto/update-roadmap-item.dto';
import { RoadmapItemsService } from './roadmap-items.service';

@ApiTags('roadmap')
@Controller()
export class RoadmapItemsController {
  constructor(private readonly roadmapService: RoadmapItemsService) {}

  @Post('games/:gameSlug/roadmap')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Roadmap item created.' })
  async create(
    @CurrentUser() user: { id: string },
    @Param('gameSlug') gameSlug: string,
    @Body() dto: CreateRoadmapItemDto,
  ) {
    return this.roadmapService.create(user.id, gameSlug, dto);
  }

  @Get('games/:gameSlug/roadmap')
  @ApiOkResponse({ description: 'Roadmap items for a game.' })
  async findByGame(@Param('gameSlug') gameSlug: string) {
    return this.roadmapService.findByGameSlug(gameSlug);
  }

  @Patch('games/:gameSlug/roadmap/reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Roadmap items reordered.' })
  async reorder(
    @CurrentUser() user: { id: string },
    @Param('gameSlug') gameSlug: string,
    @Body() body: { items: { id: string; position: number }[] },
  ) {
    return this.roadmapService.reorder(user.id, gameSlug, body.items);
  }

  @Get('roadmap-items/:id')
  @ApiOkResponse({ description: 'Roadmap item detail.' })
  async findById(@Param('id') id: string) {
    const item = await this.roadmapService.findById(id);
    if (!item) {
      throw new NotFoundException('Roadmap item not found');
    }
    return item;
  }

  @Patch('roadmap-items/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Roadmap item updated.' })
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateRoadmapItemDto,
  ) {
    return this.roadmapService.update(user.id, id, dto);
  }

  @Delete('roadmap-items/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Roadmap item deleted.' })
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.roadmapService.remove(user.id, id);
  }
}
