import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: PrismaService;

  const mockPrisma = {
    event: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(EventsService);
    prisma = module.get(PrismaService);
  });

  describe('list', () => {
    it('should return paginated published events', async () => {
      const mockEvents = [
        { id: '1', title: 'GDC 2026', slug: 'gdc-2026', startDate: new Date('2026-03-15'), status: 'published' },
        { id: '2', title: 'Gamescom', slug: 'gamescom', startDate: new Date('2026-08-20'), status: 'published' },
      ];
      mockPrisma.event.findMany.mockResolvedValue(mockEvents);
      mockPrisma.event.count.mockResolvedValue(4);

      const result = await service.list(1, 20);

      expect(result).toEqual({
        items: mockEvents,
        total: 4,
        page: 1,
        pageSize: 20,
        hasMore: false,
      });
    });

    it('should only query published events', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);
      mockPrisma.event.count.mockResolvedValue(0);

      await service.list();

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'published' },
        }),
      );
    });

    it('should filter for upcoming events when upcomingOnly is true', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);
      mockPrisma.event.count.mockResolvedValue(0);

      await service.list(1, 20, true);

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'published',
            startDate: { gte: expect.any(Date) },
          },
        }),
      );
    });

    it('should not apply date filter when upcomingOnly is false', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);
      mockPrisma.event.count.mockResolvedValue(0);

      await service.list(1, 20, false);

      const callArgs = mockPrisma.event.findMany.mock.calls[0][0];
      expect(callArgs.where.startDate).toBeUndefined();
    });

    it('should calculate pagination offset correctly', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);
      mockPrisma.event.count.mockResolvedValue(50);

      await service.list(3, 20);

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20,
        }),
      );
    });

    it('should set hasMore correctly', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);
      mockPrisma.event.count.mockResolvedValue(100);

      const result = await service.list(1, 20);
      expect(result.hasMore).toBe(true);

      mockPrisma.event.count.mockResolvedValue(20);
      const result2 = await service.list(1, 20);
      expect(result2.hasMore).toBe(false);
    });
  });

  describe('getBySlug', () => {
    it('should return event when found', async () => {
      const event = { id: '1', title: 'GDC 2026', slug: 'gdc-2026', startDate: new Date(), status: 'published' };
      mockPrisma.event.findUnique.mockResolvedValue(event);

      const result = await service.getBySlug('gdc-2026');

      expect(result).toEqual(event);
    });

    it('should throw NotFoundException for non-existent slug', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.getBySlug('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.getBySlug('non-existent')).rejects.toThrow('Event not found');
    });
  });

  describe('create', () => {
    it('should create an event record', async () => {
      const data = {
        title: 'New Event',
        slug: 'new-event',
        startDate: new Date('2026-12-01'),
        status: 'draft',
      };
      mockPrisma.event.create.mockResolvedValue({ id: '3', ...data });

      const result = await service.create(data);

      expect(result).toHaveProperty('id', '3');
      expect(result.title).toBe('New Event');
      expect(mockPrisma.event.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('publish', () => {
    it('should transition status from draft to published', async () => {
      const draftEvent = { id: '1', title: 'Draft Event', slug: 'draft-event', status: 'draft' };
      mockPrisma.event.findUnique.mockResolvedValue(draftEvent);
      mockPrisma.event.update.mockResolvedValue({ ...draftEvent, status: 'published' });

      const result = await service.publish('draft-event');

      expect(result.status).toBe('published');
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { slug: 'draft-event' },
        data: { status: 'published' },
      });
    });

    it('should accept a custom status', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: '2', title: 'Cancelled', slug: 'cancelled-event', status: 'draft',
      });
      mockPrisma.event.update.mockResolvedValue({ id: '2', title: 'Cancelled', slug: 'cancelled-event', status: 'cancelled' });

      const result = await service.publish('cancelled-event', 'cancelled');

      expect(result.status).toBe('cancelled');
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { slug: 'cancelled-event' },
        data: { status: 'cancelled' },
      });
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.publish('ghost-event')).rejects.toThrow(NotFoundException);
      await expect(service.publish('ghost-event')).rejects.toThrow('Event not found');
    });
  });
});
