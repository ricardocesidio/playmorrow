import { Controller, Get, Post, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
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
  async create(@Body() body: any, @Req() req: any) {
    if (!body.studioId) throw new Error('studioId is required');
    return this.marketplace.createListing(body);
  }

  @Post(':id/purchase')
  @UseGuards(SessionAuthGuard)
  async purchase(@Param('id') id: string, @Req() req: any) {
    return this.marketplace.purchase(req.user.id, id);
  }

  @Get('me/licenses')
  @UseGuards(SessionAuthGuard)
  async myLicenses(@Req() req: any) {
    return this.marketplace.getUserLicenses(req.user.id);
  }

  @Get('studio/:studioId')
  @UseGuards(SessionAuthGuard)
  async studioListings(@Param('studioId') studioId: string) {
    return this.marketplace.getStudioListings(studioId);
  }
}
