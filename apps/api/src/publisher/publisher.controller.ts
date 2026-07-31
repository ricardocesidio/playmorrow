import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PublisherService } from './publisher.service';

@Controller('publisher')
export class PublisherController {
  constructor(private publisher: PublisherService) {}

  @Get('revenue')
  @UseGuards(SessionAuthGuard)
  async myRevenue(@CurrentUser() user: { id: string }) {
    return this.publisher.getUserRevenue(user.id);
  }

  @Get('revenue/:studioId')
  @UseGuards(SessionAuthGuard)
  async studioRevenue(@Param('studioId') studioId: string, @Query('days') days?: string) {
    if (days) return this.publisher.getStudioRevenueByPeriod(studioId, parseInt(days));
    return this.publisher.getStudioRevenue(studioId);
  }
}
