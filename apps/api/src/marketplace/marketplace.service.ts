import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { EventBus } from '../common/event-bus';

@Injectable()
export class MarketplaceService {
  constructor(
    private prisma: PrismaService,
    private payments: PaymentsService,
    private eventBus: EventBus,
  ) {}

  async listListings(type?: string, page = 1, pageSize = 20) {
    const where: any = { status: 'active' };
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.marketplaceListing.findMany({
        where,
        include: {
          studio: { select: { id: true, name: true, slug: true, logoUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.marketplaceListing.count({ where }),
    ]);
    return { items, total, page, pageSize, hasMore: page * pageSize < total };
  }

  async getListing(id: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        studio: { select: { id: true, name: true, slug: true, logoUrl: true } },
        game: { select: { id: true, title: true, slug: true } },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    const { fileUrl, ...safe } = listing;
    return safe;
  }

  async createListing(data: {
    type: string;
    title: string;
    description?: string;
    priceCents: number;
    fileUrl?: string;
    thumbnailUrl?: string;
    tags?: string[];
    studioId: string;
    gameId?: string;
  }) {
    return this.prisma.marketplaceListing.create({ data: data as any });
  }

  async updateListing(id: string, data: any) {
    const listing = await this.prisma.marketplaceListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    return this.prisma.marketplaceListing.update({ where: { id }, data });
  }

  async purchase(userId: string, listingId: string) {
    const listing = await this.getListing(listingId);
    if (listing.status !== 'active') throw new BadRequestException('Listing is not active');

    const existingLicense = await this.prisma.purchasedLicense.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (existingLicense?.active) throw new ConflictException('Already purchased');

    const platformFeePercent = parseInt(process.env.PLATFORM_FEE_PERCENT || '10', 10);
    const platformFeeCents = Math.round(listing.priceCents * (platformFeePercent / 100));

    const stripeAccount = await this.prisma.stripeConnectAccount.findUnique({
      where: { studioId: listing.studioId },
    });
    if (!stripeAccount?.onboarded) throw new BadRequestException('Studio not ready to receive payments');

    const owner = await this.prisma.studioMember.findFirst({
      where: { studioId: listing.studioId, role: 'OWNER' },
    });
    const sellerId = owner?.userId;

    const pi = await this.payments.createPaymentIntent(
      listing.priceCents,
      platformFeeCents,
      stripeAccount.stripeAccountId,
      { buyerId: userId, listingId, listingType: listing.type },
    );

    try {
      await this.payments.recordTransaction({
        type: 'PURCHASE',
        amountCents: listing.priceCents,
        platformFeeCents,
        buyerId: userId,
        sellerId,
        listingId,
        stripePaymentIntentId: pi.id,
        description: `Purchase of ${listing.title}`,
      });
    } catch (err) {
      await this.payments.cancelPaymentIntent(pi.id);
      throw new BadRequestException('Purchase failed — payment has been cancelled and not charged');
    }

    this.eventBus.emit({
      type: 'MARKETPLACE_PURCHASE_INITIATED',
      actorId: userId,
      targetId: listingId,
      targetType: 'marketplace_listing',
      studioId: listing.studioId,
      metadata: {
        priceCents: listing.priceCents,
        platformFeeCents,
        listingTitle: listing.title,
      },
    });

    return { clientSecret: pi.client_secret };
  }

  async getStudioListings(studioId: string) {
    return this.prisma.marketplaceListing.findMany({
      where: { studioId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: { studio: { select: { id: true, name: true, slug: true, logoUrl: true } } },
    });
  }

  async getDownloadUrl(userId: string, listingId: string) {
    const license = await this.prisma.purchasedLicense.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (!license?.active) throw new NotFoundException('Purchase required to download');
    const listing = await this.prisma.marketplaceListing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');
    return { url: listing.fileUrl };
  }

  async getUserLicenses(userId: string) {
    return this.prisma.purchasedLicense.findMany({
      where: { userId, active: true },
      include: {
        listing: {
          include: {
            studio: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    });
  }
}
