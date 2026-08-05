import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { MarketplaceService } from './marketplace.service';
import { PaymentsModule } from '../payments/payments.module';

describe('MarketplaceService', () => {
  let service: MarketplaceService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, PaymentsModule],
      providers: [MarketplaceService],
    }).compile();
    service = module.get(MarketplaceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list only active listings', async () => {
    const result = await service.listListings(undefined, 1, 20);
    expect(result.items.every((l: { status: string }) => l.status === 'active')).toBe(true);
  });

  it('should reject purchase if listing not active', async () => {
    await expect(service.purchase('nonexistent', 'nonexistent')).rejects.toThrow();
  });

  it('should reject download without license', async () => {
    await expect(service.getDownloadUrl('nonexistent', 'nonexistent')).rejects.toThrow();
  });
});
