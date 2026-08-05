import { Test, TestingModule } from '@nestjs/testing';
import { CreatorService } from './creator.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CreatorService', () => {
  let service: CreatorService;
  let prisma: PrismaService;

  const mockPrisma = {
    referralCode: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(CreatorService);
    prisma = module.get(PrismaService);
  });

  describe('getOrCreateCode', () => {
    it('should return existing referral code', async () => {
      const existingCode = { userId: 'user-1', code: 'ABC123XY' };
      mockPrisma.referralCode.findUnique.mockResolvedValue(existingCode);

      const result = await service.getOrCreateCode('user-1');

      expect(result).toEqual(existingCode);
      expect(mockPrisma.referralCode.create).not.toHaveBeenCalled();
    });

    it('should create a new code when none exists', async () => {
      mockPrisma.referralCode.findUnique.mockResolvedValue(null);
      mockPrisma.referralCode.create.mockResolvedValue({ userId: 'user-2', code: 'X9K2MNPL' });

      const result = await service.getOrCreateCode('user-2');

      expect(result.userId).toBe('user-2');
      expect(result.code).toHaveLength(8);
      expect(mockPrisma.referralCode.create).toHaveBeenCalledTimes(1);
    });

    it('should generate an 8-character code', async () => {
      mockPrisma.referralCode.findUnique.mockResolvedValue(null);
      mockPrisma.referralCode.create.mockImplementation(({ data }: { data: { userId: string; code: string } }) =>
        Promise.resolve(data),
      );

      const result = await service.getOrCreateCode('user-3');

      expect(result.code).toHaveLength(8);
    });

    it('should never include ambiguous characters O/0/I/1 in generated codes', async () => {
      mockPrisma.referralCode.findUnique.mockResolvedValue(null);

      let code = '';
      mockPrisma.referralCode.create.mockImplementation(({ data }: { data: { userId: string; code: string } }) => {
        code = data.code;
        return Promise.resolve(data);
      });

      await service.getOrCreateCode('user-4');

      expect(code).not.toMatch(/[O0I1]/);
    });
  });

  describe('validateCode', () => {
    it('should return null for non-existent code', async () => {
      mockPrisma.referralCode.findUnique.mockResolvedValue(null);

      const result = await service.validateCode('NONEXIST', 'user-1');

      expect(result).toBeNull();
    });

    it('should return null when code belongs to the same user', async () => {
      mockPrisma.referralCode.findUnique.mockResolvedValue({
        code: 'MYCODE12',
        userId: 'user-1',
        user: { id: 'user-1', username: 'alice' },
      });

      const result = await service.validateCode('MYCODE12', 'user-1');

      expect(result).toBeNull();
    });

    it('should return referral info for valid code from another user', async () => {
      const referralInfo = {
        code: 'REFER12X',
        userId: 'user-2',
        user: { id: 'user-2', username: 'bob' },
      };
      mockPrisma.referralCode.findUnique.mockResolvedValue(referralInfo);

      const result = await service.validateCode('REFER12X', 'user-1');

      expect(result).toEqual(referralInfo);
      expect(result!.user.username).toBe('bob');
    });

    it('should include referred user info', async () => {
      mockPrisma.referralCode.findUnique.mockResolvedValue({
        code: 'ABC12345',
        userId: 'user-5',
        user: { id: 'user-5', username: 'charlie' },
      });

      const result = await service.validateCode('ABC12345', 'user-3');

      expect(result).toHaveProperty('user');
      expect(result!.user).toHaveProperty('id');
      expect(result!.user).toHaveProperty('username');
    });
  });

  describe('getMyReferrals', () => {
    it('should return empty data when user has no referral code', async () => {
      mockPrisma.referralCode.findUnique.mockResolvedValue(null);

      const result = await service.getMyReferrals('user-1');

      expect(result).toEqual({
        code: null,
        commissions: [],
        totalEarned: 0,
      });
    });

    it('should return commissions and total earned for existing code', async () => {
      mockPrisma.referralCode.findUnique.mockResolvedValue({
        userId: 'user-1',
        code: 'MYREF1XX',
      });
      mockPrisma.transaction.findMany.mockResolvedValue([
        { amountCents: 500, sellerId: 'user-1', type: 'REFERRAL_COMMISSION', createdAt: new Date() },
        { amountCents: 350, sellerId: 'user-1', type: 'REFERRAL_COMMISSION', createdAt: new Date() },
      ]);

      const result = await service.getMyReferrals('user-1');

      expect(result.code).toBe('MYREF1XX');
      expect(result.commissions).toHaveLength(2);
      expect(result.totalEarned).toBe(850);
    });
  });
});
