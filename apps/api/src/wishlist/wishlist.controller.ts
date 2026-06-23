import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { WishlistService } from './wishlist.service';

@ApiTags('wishlist')
@Controller()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post('games/:slug/wishlist')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Game added to wishlist.' })
  async add(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.wishlistService.add(user.id, slug);
  }

  @Delete('games/:slug/wishlist')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Game removed from wishlist.' })
  async remove(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.wishlistService.remove(user.id, slug);
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
