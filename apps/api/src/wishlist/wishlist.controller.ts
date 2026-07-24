import { Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { WishlistService } from './wishlist.service';

@ApiTags('wishlist')
@Controller()
export class WishlistController {
  constructor(
    private readonly wishlistService: WishlistService,
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('games/:slug/wishlist')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Game added to wishlist.' })
  async add(@CurrentUser() user: { id: string }, @Param('slug') slug: string, @Req() req: Request) {
    const result = await this.wishlistService.add(user.id, slug);
    const game = await this.prisma.game.findUnique({ where: { slug: slug.toLowerCase() }, select: { id: true, studioId: true } });
    if (game) {
      this.analyticsService.track({
        eventType: 'wishlist_add',
        gameId: game.id,
        studioId: game.studioId,
        userId: user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch(() => {});
    }
    return result;
  }

  @Delete('games/:slug/wishlist')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Game removed from wishlist.' })
  async remove(@CurrentUser() user: { id: string }, @Param('slug') slug: string, @Req() req: Request) {
    const result = await this.wishlistService.remove(user.id, slug);
    const game = await this.prisma.game.findUnique({ where: { slug: slug.toLowerCase() }, select: { id: true, studioId: true } });
    if (game) {
      this.analyticsService.track({
        eventType: 'wishlist_remove',
        gameId: game.id,
        studioId: game.studioId,
        userId: user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch(() => {});
    }
    return result;
  }

  @Get('games/:slug/wishlist-status')
  @UseGuards(OptionalSessionGuard)
  @ApiOkResponse({ description: 'Wishlist status for current viewer.' })
  async status(@CurrentUser() user: { id?: string }, @Param('slug') slug: string) {
    return this.wishlistService.status(user?.id, slug);
  }

  @Get('me/wishlist')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: "Current user's wishlist." })
  async list(@CurrentUser() user: { id: string }) {
    return this.wishlistService.list(user.id);
  }
}
