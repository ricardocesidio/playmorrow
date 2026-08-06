import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { EventBus } from '../common/event-bus';
import { MarketplaceService } from './marketplace.service';

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  const mockPrisma = {
    marketplaceListing: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    purchasedLicense: { findUnique: vi.fn(), findMany: vi.fn() },
    stripeConnectAccount: { findUnique: vi.fn() },
    studioMember: { findFirst: vi.fn() },
  };
  const mockPayments = {
    recordTransaction: vi.fn(),
    createPaymentIntent: vi.fn(),
    attachPaymentIntent: vi.fn(),
    markTransactionFailed: vi.fn(),
  };
  const mockEventBus = { emit: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.marketplaceListing.findMany.mockResolvedValue([]);
    mockPrisma.marketplaceListing.count.mockResolvedValue(0);
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PaymentsService, useValue: mockPayments },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile();
    service = module.get(MarketplaceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list only active listings', async () => {
    mockPrisma.marketplaceListing.findMany.mockResolvedValue([
      { id: '1', status: 'ACTIVE', priceCents: 500 },
    ]);
    const result = await service.listListings(undefined, 1, 20);
    expect(result.items.every((l: { status: string }) => l.status === 'ACTIVE')).toBe(true);
    expect(mockPrisma.marketplaceListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'ACTIVE' }) }),
    );
  });

  it('should reject purchase if listing not active', async () => {
    mockPrisma.marketplaceListing.findUnique.mockResolvedValue({
      id: '1', title: 'X', status: 'DRAFT', priceCents: 500, studioId: 's1',
    });
    await expect(service.purchase('user', '1')).rejects.toThrow();
    expect(mockPayments.recordTransaction).not.toHaveBeenCalled();
  });

  it('should reject download without license', async () => {
    mockPrisma.purchasedLicense.findUnique.mockResolvedValue(null);
    await expect(service.getDownloadUrl('nonexistent', 'nonexistent')).rejects.toThrow();
  });

  it('should update a listing and coerce enum fields', async () => {
    mockPrisma.marketplaceListing.findUnique.mockResolvedValue({ id: '1', status: 'DRAFT' });
    mockPrisma.marketplaceListing.update.mockResolvedValue({ id: '1', status: 'ACTIVE', title: 'New' });

    await service.updateListing('1', { status: 'ACTIVE', title: 'New' });

    expect(mockPrisma.marketplaceListing.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { title: 'New', status: 'ACTIVE' },
    });
  });

  it('should throw NotFoundException when updating a missing listing', async () => {
    mockPrisma.marketplaceListing.findUnique.mockResolvedValue(null);
    await expect(service.updateListing('ghost', { title: 'x' })).rejects.toThrow('Listing not found');
  });

  it('should archive (soft-delete) a listing', async () => {
    mockPrisma.marketplaceListing.findUnique.mockResolvedValue({ id: '1', status: 'ACTIVE' });
    mockPrisma.marketplaceListing.update.mockResolvedValue({ id: '1', status: 'ARCHIVED' });

    await service.deleteListing('1');

    expect(mockPrisma.marketplaceListing.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { status: 'ARCHIVED' },
    });
  });

  it('should throw NotFoundException when archiving a missing listing', async () => {
    mockPrisma.marketplaceListing.findUnique.mockResolvedValue(null);
    await expect(service.deleteListing('ghost')).rejects.toThrow('Listing not found');
  });

  it('should list all statuses for the studio dashboard', async () => {
    mockPrisma.marketplaceListing.findMany.mockResolvedValue([
      { id: '1', status: 'DRAFT' },
      { id: '2', status: 'ACTIVE' },
      { id: '3', status: 'ARCHIVED' },
    ]);

    await service.getStudioListings('studio-1');

    expect(mockPrisma.marketplaceListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studioId: 'studio-1' },
      }),
    );
  });
});
