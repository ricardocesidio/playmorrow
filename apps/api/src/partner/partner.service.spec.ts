import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PartnerService } from './partner.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PartnerService', () => {
  let service: PartnerService;
  let prisma: PrismaService;

  const mockPrisma = {
    partner: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(PartnerService);
    prisma = module.get(PrismaService);
  });

  describe('list', () => {
    it('should return paginated results', async () => {
      const mockPartners = [
        { id: '1', name: 'Partner A', slug: 'partner-a', type: 'publisher', status: 'active' },
        { id: '2', name: 'Partner B', slug: 'partner-b', type: 'accelerator', status: 'active' },
      ];
      mockPrisma.partner.findMany.mockResolvedValue(mockPartners);
      mockPrisma.partner.count.mockResolvedValue(5);

      const result = await service.list(undefined, 1, 20);

      expect(result).toEqual({
        items: mockPartners,
        total: 5,
        page: 1,
        pageSize: 20,
        hasMore: false,
      });
    });

    it('should apply type filter when provided', async () => {
      mockPrisma.partner.findMany.mockResolvedValue([]);
      mockPrisma.partner.count.mockResolvedValue(0);

      await service.list('publisher', 1, 20);

      expect(mockPrisma.partner.findMany).toHaveBeenCalledWith({
        where: { status: 'active', type: 'publisher' },
        orderBy: { name: 'asc' },
        skip: 0,
        take: 20,
      });
    });

    it('should only query active partners', async () => {
      mockPrisma.partner.findMany.mockResolvedValue([]);
      mockPrisma.partner.count.mockResolvedValue(0);

      await service.list();

      expect(mockPrisma.partner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' },
        }),
      );
    });

    it('should calculate pagination offset correctly', async () => {
      mockPrisma.partner.findMany.mockResolvedValue([]);
      mockPrisma.partner.count.mockResolvedValue(10);

      await service.list(undefined, 3, 20);

      expect(mockPrisma.partner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20,
        }),
      );
    });

    it('should set hasMore to true when more pages exist', async () => {
      mockPrisma.partner.findMany.mockResolvedValue([]);
      mockPrisma.partner.count.mockResolvedValue(100);

      const result = await service.list(undefined, 1, 20);

      expect(result.hasMore).toBe(true);
    });

    it('should set hasMore to false on the last page', async () => {
      mockPrisma.partner.findMany.mockResolvedValue([]);
      mockPrisma.partner.count.mockResolvedValue(20);

      const result = await service.list(undefined, 1, 20);

      expect(result.hasMore).toBe(false);
    });
  });

  describe('getBySlug', () => {
    it('should return partner when found', async () => {
      const partner = { id: '1', name: 'Test Partner', slug: 'test-partner', type: 'publisher', status: 'active' };
      mockPrisma.partner.findUnique.mockResolvedValue(partner);

      const result = await service.getBySlug('test-partner');

      expect(result).toEqual(partner);
    });

    it('should throw NotFoundException for non-existent slug', async () => {
      mockPrisma.partner.findUnique.mockResolvedValue(null);

      await expect(service.getBySlug('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.getBySlug('non-existent')).rejects.toThrow('Partner not found');
    });
  });

  describe('create', () => {
    it('should create a partner record', async () => {
      const data = { name: 'New Partner', slug: 'new-partner', type: 'university', status: 'active' };
      mockPrisma.partner.create.mockResolvedValue({ id: '3', ...data });

      const result = await service.create(data);

      expect(result).toHaveProperty('id', '3');
      expect(result.name).toBe('New Partner');
      expect(mockPrisma.partner.create).toHaveBeenCalledWith({ data });
    });
  });
});
