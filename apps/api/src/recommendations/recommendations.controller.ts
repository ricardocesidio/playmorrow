import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RecommendationsService, type RecommendationResult } from './recommendations.service';

@ApiTags('recommendations')
@Controller()
export class RecommendationsController {
  constructor(private readonly recs: RecommendationsService) {}

  @Get('recommendations')
  @UseGuards(OptionalSessionGuard)
  @ApiOkResponse({ description: 'Recommendations for the current user or public.' })
  @ApiQuery({ name: 'type', required: false, enum: ['for-you', 'trending', 'similar-games'] })
  @ApiQuery({ name: 'gameId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'cursor', required: false, description: 'JSON: {"score":0.5,"gameId":"..."}' })
  async getRecommendations(
    @CurrentUser() user: { id: string } | undefined,
    @Query('type', new DefaultValuePipe('for-you')) type: 'for-you' | 'trending' | 'similar-games',
    @Query('gameId') gameId: string | undefined,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('cursor') cursorRaw: string | undefined,
  ): Promise<RecommendationResult> {
    let cursor: { score: number; gameId: string } | null = null;
    if (cursorRaw) {
      try { cursor = JSON.parse(cursorRaw); } catch { /* invalid cursor — start from top */ }
    }
    return this.recs.getRecommendations(user?.id || null, type, gameId, limit, cursor);
  }
}
