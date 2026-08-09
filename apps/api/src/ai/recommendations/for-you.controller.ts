import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { OptionalSessionGuard } from '../../auth/guards/optional-session.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { User } from '@playmorrow/database';
import { HybridRecommenderService } from './hybrid-recommender.service';
import { RecommendationFeedbackService } from './recommendation-feedback.service';
import { GameEmbeddingRefreshService } from './game-embedding-refresh.service';
import { RecommendationFeedbackDto } from './dto/recommendation-feedback.dto';

@ApiTags('recommendations')
@Controller('recommendations')
export class ForYouController {
  constructor(
    private readonly hybrid: HybridRecommenderService,
    private readonly feedback: RecommendationFeedbackService,
    private readonly refreshService: GameEmbeddingRefreshService,
  ) {}

  @Get('for-you')
  @UseGuards(OptionalSessionGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'M23 hybrid "For You" feed' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, description: 'URL-encoded JSON {score, gameId}' })
  async forYou(
    @CurrentUser() user: User | null,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const parsedLimit = limit ? Math.min(50, Math.max(1, parseInt(limit, 10) || 20)) : 20;
    const parsedCursor = this.parseCursor(cursor);
    return this.hybrid.getForYou(user?.id ?? null, parsedLimit, parsedCursor);
  }

  @Post('feedback')
  @UseGuards(SessionAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Record recommendation CTR/dismissal feedback' })
  async recordFeedback(
    @CurrentUser() user: User,
    @Body() dto: RecommendationFeedbackDto,
  ): Promise<{ ok: true }> {
    await this.feedback.record(user.id, dto.gameId, dto.action);
    return { ok: true };
  }

  @Post('refresh-embeddings')
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @ApiOperation({ summary: 'Admin: run the game embedding refresh pipeline' })
  async refreshEmbeddings(): Promise<{ embedded: number; skipped: number; deleted: number; disabled: boolean }> {
    return this.refreshService.refresh();
  }

  private parseCursor(raw?: string): { score: number; gameId: string } | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { score?: unknown; gameId?: unknown };
      if (
        typeof parsed.score === 'number' &&
        Number.isFinite(parsed.score) &&
        typeof parsed.gameId === 'string'
      ) {
        return { score: parsed.score, gameId: parsed.gameId };
      }
    } catch {
      return null;
    }
    return null;
  }
}
