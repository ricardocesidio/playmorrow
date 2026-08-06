import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { EventBus } from '../common/event-bus';
import { MarketplaceService } from './marketplace.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const activeListing = {
  id: 'listing-1',
  type: 'ASSET',
  title: 'Sprite Pack',
  priceCents: 1000,
  status: 'ACTIVE',
  studioId: 'studio-1',
  fileUrl: null,
  studio: { id: 'studio-1', name: 'Studio', slug: 'studio', logoUrl: null },
};

function createMockedModule() {
  const prisma = {
    marketplaceListing: {
      findUnique: vi.fn(),
    },
    purchasedLicense: {
      findUnique: vi.fn(),
    },
    stripeConnectAccount: {
      findUnique: vi.fn(),
    },
    studioMember: {
      findFirst: vi.fn(),
    },
  };
  const payments = {
    recordTransaction: vi.fn(),
    attachPaymentIntent: vi.fn(),
    markTransactionFailed: vi.fn(),
    createPaymentIntent: vi.fn(),
    cancelPaymentIntent: vi.fn(),
  };
  const eventBus = { emit: vi.fn() };

  return { prisma, payments, eventBus };
}

describe('MarketplaceService.purchase — state machine', () => {
  let service: MarketplaceService;
  let mocks: ReturnType<typeof createMockedModule>;

  beforeEach(async () => {
    mocks = createMockedModule();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceService,
        { provide: PrismaService, useValue: mocks.prisma },
        { provide: PaymentsService, useValue: mocks.payments },
        { provide: EventBus, useValue: mocks.eventBus },
      ],
    }).compile();
    service = module.get(MarketplaceService);
  });

  it('creates a PENDING transaction before touching Stripe', async () => {
    mocks.prisma.marketplaceListing.findUnique.mockResolvedValue(activeListing);
    mocks.prisma.purchasedLicense.findUnique.mockResolvedValue(null);
    mocks.prisma.stripeConnectAccount.findUnique.mockResolvedValue({
      studioId: 'studio-1',
      stripeAccountId: 'acct_123',
      onboarded: true,
    });
    mocks.prisma.studioMember.findFirst.mockResolvedValue({ userId: 'seller-1' });
    mocks.payments.recordTransaction.mockResolvedValue({ id: 'txn-1', status: 'PENDING' });
    mocks.payments.createPaymentIntent.mockResolvedValue({
      id: 'pi_123',
      client_secret: 'cs_test',
    });
    mocks.payments.attachPaymentIntent.mockResolvedValue({ id: 'txn-1' });

    const result = await service.purchase('buyer-1', 'listing-1');

    // Order: transaction recorded before PaymentIntent is created.
    const recordOrder = mocks.payments.recordTransaction.mock.invocationCallOrder[0];
    const intentOrder = mocks.payments.createPaymentIntent.mock.invocationCallOrder[0];
    expect(recordOrder).toBeLessThan(intentOrder);
    expect(mocks.payments.recordTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PURCHASE', buyerId: 'buyer-1', listingId: 'listing-1' }),
    );
    expect(mocks.payments.attachPaymentIntent).toHaveBeenCalledWith('txn-1', 'pi_123');
    expect(result).toEqual({ clientSecret: 'cs_test' });
    expect(mocks.eventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'MARKETPLACE_PURCHASE_INITIATED' }),
    );
  });

  it('marks the transaction FAILED when PaymentIntent creation fails — never cancels', async () => {
    mocks.prisma.marketplaceListing.findUnique.mockResolvedValue(activeListing);
    mocks.prisma.purchasedLicense.findUnique.mockResolvedValue(null);
    mocks.prisma.stripeConnectAccount.findUnique.mockResolvedValue({
      studioId: 'studio-1',
      stripeAccountId: 'acct_123',
      onboarded: true,
    });
    mocks.prisma.studioMember.findFirst.mockResolvedValue({ userId: 'seller-1' });
    mocks.payments.recordTransaction.mockResolvedValue({ id: 'txn-1', status: 'PENDING' });
    mocks.payments.createPaymentIntent.mockRejectedValue(new Error('stripe down'));

    await expect(service.purchase('buyer-1', 'listing-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(mocks.payments.markTransactionFailed).toHaveBeenCalledWith('txn-1');
    expect(mocks.payments.cancelPaymentIntent).not.toHaveBeenCalled();
  });
});
