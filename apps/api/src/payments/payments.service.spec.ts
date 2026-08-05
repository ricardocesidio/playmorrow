import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: {
        create: vi.fn(),
      },
      accounts: {
        create: vi.fn(),
      },
      accountLinks: {
        create: vi.fn(),
      },
    })),
  };
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;
  let config: ConfigService;

  const mockPrisma = {
    stripeConnectAccount: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    processedWebhookEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    purchasedLicense: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const mockConfig = {
    get: vi.fn(),
  };

  async function createModule(stripeKey: string | undefined) {
    vi.clearAllMocks();
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'STRIPE_SECRET_KEY') return stripeKey;
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    return {
      service: module.get(PaymentsService),
      prisma: module.get(PrismaService),
      config: module.get(ConfigService),
    };
  }

  beforeEach(async () => {
    vi.clearAllMocks();

    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'STRIPE_SECRET_KEY') return 'sk_test_123';
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(PaymentsService);
    prisma = module.get(PrismaService);
    config = module.get(ConfigService);
  });

  describe('createPaymentIntent', () => {
    it('should throw when Stripe key is missing', async () => {
      const svc = await createModule(undefined);

      await expect(
        svc.service.createPaymentIntent(1000, 100, 'acct_123', {}),
      ).rejects.toThrow('Stripe not configured');
    });
  });

  describe('recordTransaction', () => {
    it('should create a transaction record with PENDING status', async () => {
      const mockTx = { id: 'txn-1', status: 'PENDING', amountCents: 1000 };
      mockPrisma.transaction.create.mockResolvedValue(mockTx);

      const result = await service.recordTransaction({
        type: 'PURCHASE',
        amountCents: 1000,
        platformFeeCents: 50,
        buyerId: 'buyer-1',
        listingId: 'listing-1',
        stripePaymentIntentId: 'pi_123',
      });

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: {
          type: 'PURCHASE',
          amountCents: 1000,
          platformFeeCents: 50,
          buyerId: 'buyer-1',
          listingId: 'listing-1',
          stripePaymentIntentId: 'pi_123',
          status: 'PENDING',
        },
      });
      expect(result).toEqual(mockTx);
    });
  });

  describe('isWebhookProcessed', () => {
    it('should return false for unprocessed events', async () => {
      mockPrisma.processedWebhookEvent.findUnique.mockResolvedValue(null);

      const result = await service.isWebhookProcessed('evt_unknown');

      expect(result).toBe(false);
      expect(mockPrisma.processedWebhookEvent.findUnique).toHaveBeenCalledWith({
        where: { stripeEventId: 'evt_unknown' },
      });
    });

    it('should return true for already processed events', async () => {
      mockPrisma.processedWebhookEvent.findUnique.mockResolvedValue({
        id: '1',
        stripeEventId: 'evt_known',
        type: 'payment_intent.succeeded',
      });

      const result = await service.isWebhookProcessed('evt_known');

      expect(result).toBe(true);
    });
  });

  describe('getOrCreateConnectAccount', () => {
    it('should throw when Stripe is not configured', async () => {
      const svc = await createModule(undefined);

      await expect(
        svc.service.getOrCreateConnectAccount('studio-1', 'test@example.com'),
      ).rejects.toThrow('Stripe not configured');
    });

    it('should return existing onboarded account', async () => {
      mockPrisma.stripeConnectAccount.findUnique.mockResolvedValue({
        id: '1',
        studioId: 'studio-1',
        stripeAccountId: 'acct_123',
        accountType: 'express',
        onboarded: true,
      });

      const result = await service.getOrCreateConnectAccount('studio-1', 'test@example.com');

      expect(result).toHaveProperty('studioId', 'studio-1');
      expect(result).toHaveProperty('onboarded', true);
      expect(mockPrisma.stripeConnectAccount.create).not.toHaveBeenCalled();
    });
  });

  describe('markWebhookProcessed', () => {
    it('should create a processed webhook event record', async () => {
      mockPrisma.processedWebhookEvent.create.mockResolvedValue({
        id: '1',
        stripeEventId: 'evt_123',
        type: 'payment_intent.succeeded',
      });

      await service.markWebhookProcessed('evt_123', 'payment_intent.succeeded');

      expect(mockPrisma.processedWebhookEvent.create).toHaveBeenCalledWith({
        data: { stripeEventId: 'evt_123', type: 'payment_intent.succeeded' },
      });
    });
  });

  describe('processSuccessfulPayment', () => {
    it('should return null when no pending transaction exists', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      const result = await service.processSuccessfulPayment('pi_unknown', 'buyer-1', 1000, 50);

      expect(result).toBeNull();
    });

    it('should return existing completed transaction without changes', async () => {
      const completedTx = { id: 'txn-1', status: 'COMPLETED', stripePaymentIntentId: 'pi_123' };
      mockPrisma.transaction.findUnique.mockResolvedValue(completedTx);

      const result = await service.processSuccessfulPayment('pi_123', 'buyer-1', 1000, 50);

      expect(result).toEqual(completedTx);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
