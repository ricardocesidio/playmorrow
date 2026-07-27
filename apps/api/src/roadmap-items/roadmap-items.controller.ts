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
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { EventBus } from '../common/event-bus';
import { CreateRoadmapItemDto } from './dto/create-roadmap-item.dto';
import { UpdateRoadmapItemDto } from './dto/update-roadmap-item.dto';
import { RoadmapItemsService } from './roadmap-items.service';

@ApiTags('roadmap')
@Controller()
export class RoadmapItemsController {
  constructor(
    private readonly roadmapService: RoadmapItemsService,
    private readonly eventBus: EventBus,
  ) {}

  @Post('games/:gameSlug/roadmap')
  @UseGuards(SessionAuthGuard)
  @ApiCreatedResponse({ description: 'Roadmap item created.' })
  async create(
    @CurrentUser() user: { id: string },
    @Param('gameSlug') gameSlug: string,
    @Body() dto: CreateRoadmapItemDto,
  ) {
    const item = await this.roadmapService.create(user.id, gameSlug, dto);
    this.eventBus.emit({ type: 'roadmap_updated', actorId: user.id, gameId: item.game?.id, studioId: item.studio?.id, targetType: 'ROADMAP_ITEM', targetId: item.id });
    return item;
  }

  @Get('games/:gameSlug/roadmap')
  @ApiOkResponse({ description: 'Roadmap items for a game.' })
  async findByGame(@Param('gameSlug') gameSlug: string) {
    return this.roadmapService.findByGameSlug(gameSlug);
  }

  @Patch('games/:gameSlug/roadmap/reorder')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Roadmap items reordered.' })
  async reorder(
    @CurrentUser() user: { id: string },
    @Param('gameSlug') gameSlug: string,
    @Body() body: { items: { id: string; position: number }[] },
  ) {
    const result = await this.roadmapService.reorder(user.id, gameSlug, body.items);
    this.eventBus.emit({ type: 'roadmap_updated', actorId: user.id, gameId: (result as any)?.gameId, studioId: (result as any)?.studioId, targetType: 'ROADMAP' });
    return result;
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
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Roadmap item updated.' })
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateRoadmapItemDto,
  ) {
    const item = await this.roadmapService.update(user.id, id, dto);
    this.eventBus.emit({ type: 'roadmap_updated', actorId: user.id, gameId: item.game?.id, studioId: item.studio?.id, targetType: 'ROADMAP_ITEM', targetId: item.id });
    return item;
  }

  @Delete('roadmap-items/:id')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Roadmap item deleted.' })
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    const result = await this.roadmapService.remove(user.id, id);
    this.eventBus.emit({ type: 'roadmap_updated', actorId: user.id, gameId: (result as any)?.gameId, studioId: (result as any)?.studioId, targetType: 'ROADMAP_ITEM', targetId: id });
    return result;
  }
}
