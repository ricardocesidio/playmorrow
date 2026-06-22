import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import type { PressKitResponse } from './press-kits.service';
import { UpsertPressKitDto } from './dto/upsert-press-kit.dto';
import { PressKitsService } from './press-kits.service';

@ApiTags('press-kits')
@Controller()
export class PressKitsController {
  constructor(private readonly pressKitsService: PressKitsService) {}

  @Put('games/:gameSlug/press-kit')
  @UseGuards(SessionAuthGuard)
  @ApiCreatedResponse({ description: 'Press kit created or updated.' })
  async upsert(
    @CurrentUser() user: { id: string },
    @Param('gameSlug') gameSlug: string,
    @Body() dto: UpsertPressKitDto,
  ): Promise<PressKitResponse> {
    return this.pressKitsService.upsert(user.id, gameSlug, dto);
  }

  @Get('games/:gameSlug/press-kit')
  @ApiOkResponse({ description: 'Public press kit.' })
  async findByGame(@Param('gameSlug') gameSlug: string): Promise<PressKitResponse> {
    return this.pressKitsService.findByGameSlug(gameSlug);
  }
}
