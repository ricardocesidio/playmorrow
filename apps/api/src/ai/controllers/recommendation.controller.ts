import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RecommendationService } from '../services/recommendation.service';

@Controller('ai/recommendations')
export class RecommendationController {
  constructor(private recs: RecommendationService) {}

  @Get()
  @UseGuards(SessionAuthGuard)
  async getRecommendations(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
  ) {
    return this.recs.getRecommendations(user.id, parseInt(limit || '10'));
  }
}
