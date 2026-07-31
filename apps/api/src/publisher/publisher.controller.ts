import { Controller, Get, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { PublisherService } from './publisher.service';

@Controller('publisher')
export class PublisherController {
  constructor(
    private publisher: PublisherService,
    private prisma: PrismaService,
  ) {}

  @Get('revenue')
  @UseGuards(SessionAuthGuard)
  async myRevenue(@CurrentUser() user: { id: string }) {
    return this.publisher.getUserRevenue(user.id);
  }

  @Get('revenue/:studioId')
  @UseGuards(SessionAuthGuard)
  async studioRevenue(@Param('studioId') studioId: string, @CurrentUser() user: { id: string }, @Query('days') days?: string) {
    const member = await this.prisma.studioMember.findFirst({
      where: { studioId, userId: user.id },
    });
    if (!member) throw new ForbiddenException('You are not a member of this studio');
    if (days) return this.publisher.getStudioRevenueByPeriod(studioId, parseInt(days));
    return this.publisher.getStudioRevenue(studioId);
  }
}
