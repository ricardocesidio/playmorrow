import { Test, TestingModule } from '@nestjs/testing';
import { PublisherService } from './publisher.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PublisherService', () => {
  let service: PublisherService;
  let prisma: PrismaService;

  const mockPrisma = {
    studioMember: {
      findMany: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublisherService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(PublisherService);
    prisma = module.get(PrismaService);
  });

  describe('getStudioRevenue', () => {
    it('should return zero for studio with no transactions', async () => {
      mockPrisma.studioMember.findMany.mockResolvedValue([
        { userId: 'member-1' },
        { userId: 'member-2' },
      ]);
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      const result = await service.getStudioRevenue('studio-1');

      expect(result).toEqual({
        totalRevenue: 0,
        totalFees: 0,
        netRevenue: 0,
        totalSales: 0,
        transactions: [],
      });
    });

    it('should compute revenue from completed purchase transactions', async () => {
      mockPrisma.studioMember.findMany.mockResolvedValue([
        { userId: 'member-1' },
      ]);
      mockPrisma.transaction.findMany.mockResolvedValue([
        { amountCents: 1000, platformFeeCents: 100, createdAt: new Date('2026-01-01') },
        { amountCents: 2000, platformFeeCents: 200, createdAt: new Date('2026-01-02') },
      ]);

      const result = await service.getStudioRevenue('studio-1');

      expect(result.totalRevenue).toBe(3000);
      expect(result.totalFees).toBe(300);
      expect(result.netRevenue).toBe(2700);
      expect(result.totalSales).toBe(2);
      expect(result.transactions).toHaveLength(2);
    });

    it('should only query for COMPLETED PURCHASE transactions', async () => {
      mockPrisma.studioMember.findMany.mockResolvedValue([{ userId: 'member-1' }]);
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await service.getStudioRevenue('studio-1');

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          sellerId: { in: ['member-1'] },
          status: 'COMPLETED',
          type: 'PURCHASE',
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getStudioRevenueByPeriod', () => {
    it('should return daily breakdown with correct ranges', async () => {
      mockPrisma.studioMember.findMany.mockResolvedValue([
        { userId: 'member-1' },
      ]);
      const day1 = new Date();
      day1.setDate(day1.getDate() - 2);
      const day2 = new Date();
      day2.setDate(day2.getDate() - 5);
      mockPrisma.transaction.findMany.mockResolvedValue([
        { amountCents: 500, platformFeeCents: 50, createdAt: day1 },
        { amountCents: 1500, platformFeeCents: 150, createdAt: day1 },
        { amountCents: 1000, platformFeeCents: 100, createdAt: day2 },
      ]);

      const result = await service.getStudioRevenueByPeriod('studio-1', 7);

      expect(result.totalSales).toBe(3);
      expect(result.totalRevenue).toBe(3000);
      expect(result.totalFees).toBe(300);
      expect(result.daily).toHaveLength(2);
      expect(result.daily[0].revenue).toBe(1000);
      expect(result.daily[1].revenue).toBe(2000);
      expect(result.daily[0].date < result.daily[1].date).toBe(true);
    });

    it('should default to 30 day window', async () => {
      mockPrisma.studioMember.findMany.mockResolvedValue([{ userId: 'member-1' }]);
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await service.getStudioRevenueByPeriod('studio-1');

      const callArgs = mockPrisma.transaction.findMany.mock.calls[0][0];
      expect(callArgs.where.createdAt.gte).toBeDefined();
      // The timestamp should be roughly 30 days ago
      const now = Date.now();
      const since = callArgs.where.createdAt.gte;
      const diffDays = (now - since.getTime()) / 86400000;
      expect(diffDays).toBeCloseTo(30, -0.5);
    });
  });

  describe('getUserRevenue', () => {
    it('should aggregate revenue across all OWNER/ADMIN memberships', async () => {
      mockPrisma.studioMember.findMany.mockResolvedValueOnce([
        { userId: 'user-1', role: 'OWNER', studioId: 'studio-1', studio: { id: 'studio-1', name: 'Studio A', slug: 'studio-a' } },
        { userId: 'user-1', role: 'ADMIN', studioId: 'studio-2', studio: { id: 'studio-2', name: 'Studio B', slug: 'studio-b' } },
      ]);

      mockPrisma.studioMember.findMany.mockResolvedValueOnce([{ userId: 'member-1' }]);
      mockPrisma.transaction.findMany.mockResolvedValueOnce([
        { amountCents: 1000, platformFeeCents: 100, createdAt: new Date() },
      ]);

      mockPrisma.studioMember.findMany.mockResolvedValueOnce([{ userId: 'member-2' }]);
      mockPrisma.transaction.findMany.mockResolvedValueOnce([
        { amountCents: 500, platformFeeCents: 50, createdAt: new Date() },
        { amountCents: 700, platformFeeCents: 70, createdAt: new Date() },
      ]);

      const result = await service.getUserRevenue('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].studio.slug).toBe('studio-a');
      expect(result[0].totalRevenue).toBe(1000);
      expect(result[1].studio.slug).toBe('studio-b');
      expect(result[1].totalRevenue).toBe(1200);
    });
  });
});
