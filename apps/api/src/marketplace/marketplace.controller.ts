import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private marketplace: MarketplaceService) {}

  @Get()
  @UseGuards(OptionalSessionGuard)
  async list(
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.marketplace.listListings(
      type,
      parseInt(page || '1'),
      Math.min(parseInt(pageSize || '20'), 50),
    );
  }

  @Get(':id')
  @UseGuards(OptionalSessionGuard)
  async get(@Param('id') id: string) {
    return this.marketplace.getListing(id);
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  async create(@Body() body: { studioId: string; type: string; title: string; description?: string; priceCents: number; fileUrl?: string; thumbnailUrl?: string; tags?: string[]; gameId?: string }) {
    if (!body.studioId) throw new Error('studioId is required');
    return this.marketplace.createListing(body);
  }

  @Post(':id/purchase')
  @UseGuards(SessionAuthGuard)
  async purchase(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.marketplace.purchase(user.id, id);
  }

  @Get('me/licenses')
  @UseGuards(SessionAuthGuard)
  async myLicenses(@CurrentUser() user: { id: string }) {
    return this.marketplace.getUserLicenses(user.id);
  }

  @Get('studio/:studioId')
  @UseGuards(SessionAuthGuard)
  async studioListings(@Param('studioId') studioId: string) {
    return this.marketplace.getStudioListings(studioId);
  }
}
