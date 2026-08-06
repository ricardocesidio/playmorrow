import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { EventBus } from '../common/event-bus';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import type { ListingType, MarketplaceListingStatus, Prisma } from '@playmorrow/database';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private payments: PaymentsService,
    private eventBus: EventBus,
  ) {}

  async listListings(type?: string, page = 1, pageSize = 20) {
    const where: Prisma.MarketplaceListingWhereInput = { status: 'ACTIVE' as MarketplaceListingStatus };
    if (type) where.type = type as ListingType;

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

  async createListing(data: CreateListingDto) {
    return this.prisma.marketplaceListing.create({
      data: { ...data, type: data.type as ListingType },
    });
  }

  async updateListing(id: string, data: UpdateListingDto) {
    const listing = await this.prisma.marketplaceListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    const { status, type, ...rest } = data;
    return this.prisma.marketplaceListing.update({
      where: { id },
      data: {
        ...rest,
        ...(type ? { type: type as ListingType } : {}),
        ...(status ? { status: status as MarketplaceListingStatus } : {}),
      },
    });
  }

  async purchase(userId: string, listingId: string) {
    const listing = await this.getListing(listingId);
    if (listing.status !== 'ACTIVE') throw new BadRequestException('Listing is not active');

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

    // 1. PENDING — record intent to purchase BEFORE touching Stripe.
    const transaction = await this.payments.recordTransaction({
      type: 'PURCHASE',
      amountCents: listing.priceCents,
      platformFeeCents,
      buyerId: userId,
      sellerId,
      listingId,
      description: `Purchase of ${listing.title}`,
    });

    // 2. Create the PaymentIntent and link it to the transaction.
    let pi: { id: string; client_secret: string | null };
    try {
      pi = await this.payments.createPaymentIntent(
        listing.priceCents,
        platformFeeCents,
        stripeAccount.stripeAccountId,
        { buyerId: userId, listingId, listingType: listing.type },
      );
      await this.payments.attachPaymentIntent(transaction.id, pi.id);
    } catch (err) {
      // 3. FAILED — never cancel the intent. A created-but-unconfirmed intent
      // cannot charge the buyer, and cancelling can race the confirmation webhook.
      try {
        await this.payments.markTransactionFailed(transaction.id);
      } catch {
        // DB unavailable — the transaction stays PENDING; the audit/webhook layer
        // can reconcile it later.
      }
      this.logger.warn(
        `Purchase ${transaction.id} failed after PaymentIntent creation: ${(err as Error).message}`,
      );
      throw new BadRequestException('Purchase could not be completed — no charge was made');
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
      where: { studioId },
      orderBy: { createdAt: 'desc' },
      include: { studio: { select: { id: true, name: true, slug: true, logoUrl: true } } },
    });
  }

  async deleteListing(id: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    // Soft-delete: ARCHIVED keeps the row for transaction/license FK integrity.
    return this.prisma.marketplaceListing.update({
      where: { id },
      data: { status: 'ARCHIVED' as MarketplaceListingStatus },
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
