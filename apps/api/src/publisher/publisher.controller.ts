import { Controller, Get, Param, Req, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PublisherService } from './publisher.service';

@Controller('publisher')
export class PublisherController {
  constructor(private publisher: PublisherService) {}

  @Get('revenue')
  @UseGuards(SessionAuthGuard)
  async myRevenue(@Req() req: any, @Query('days') days?: string) {
    return this.publisher.getUserRevenue(req.user.id);
  }

  @Get('revenue/:studioId')
  @UseGuards(SessionAuthGuard)
  async studioRevenue(@Param('studioId') studioId: string, @Query('days') days?: string) {
    if (days) return this.publisher.getStudioRevenueByPeriod(studioId, parseInt(days));
    return this.publisher.getStudioRevenue(studioId);
  }
}
