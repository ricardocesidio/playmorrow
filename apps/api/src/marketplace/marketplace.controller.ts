import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { MarketplaceService } from './marketplace.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private marketplace: MarketplaceService,
    private prisma: PrismaService,
  ) {}

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
  async create(@Body() body: CreateListingDto, @CurrentUser() user: { id: string }) {
    if (!body.studioId) throw new BadRequestException('studioId is required');
    const member = await this.prisma.studioMember.findFirst({
      where: { studioId: body.studioId, userId: user.id, role: { in: ['OWNER', 'ADMIN'] } },
    });
    if (!member) throw new ForbiddenException('You must be an admin of this studio to create listings');
    return this.marketplace.createListing(body);
  }

  @Post(':id/purchase')
  @UseGuards(SessionAuthGuard)
  async purchase(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.marketplace.purchase(user.id, id);
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard)
  async update(@Param('id') id: string, @Body() body: UpdateListingDto, @CurrentUser() user: { id: string }) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id },
      select: { studioId: true },
    });
    if (!listing) throw new BadRequestException('Listing not found');
    const member = await this.prisma.studioMember.findFirst({
      where: { studioId: listing.studioId, userId: user.id, role: { in: ['OWNER', 'ADMIN'] } },
    });
    if (!member) throw new ForbiddenException('You must be an admin of this studio to update listings');
    return this.marketplace.updateListing(id, body);
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id },
      select: { studioId: true },
    });
    if (!listing) throw new BadRequestException('Listing not found');
    const member = await this.prisma.studioMember.findFirst({
      where: { studioId: listing.studioId, userId: user.id, role: { in: ['OWNER', 'ADMIN'] } },
    });
    if (!member) throw new ForbiddenException('You must be an admin of this studio to delete listings');
    return this.marketplace.deleteListing(id);
  }

  @Get('me/licenses')
  @UseGuards(SessionAuthGuard)
  async myLicenses(@CurrentUser() user: { id: string }) {
    return this.marketplace.getUserLicenses(user.id);
  }

  @Get('download/:listingId')
  @UseGuards(SessionAuthGuard)
  async download(@Param('listingId') listingId: string, @CurrentUser() user: { id: string }) {
    return this.marketplace.getDownloadUrl(user.id, listingId);
  }

  @Get('studio/:studioId')
  @UseGuards(SessionAuthGuard)
  async studioListings(@Param('studioId') studioId: string) {
    return this.marketplace.getStudioListings(studioId);
  }
}
