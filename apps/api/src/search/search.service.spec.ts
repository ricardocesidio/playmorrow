import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchService } from './search.service';
import { describe, it, expect, beforeAll, vi } from 'vitest';

vi.setConfig({ testTimeout: 30_000 });

describe('SearchService', () => {
  let service: SearchService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
      providers: [SearchService],
    }).compile();
    service = module.get(SearchService);
  });

  it('should return empty results for empty query', async () => {
    const result = await service.search('', {}, 1, 10);
    expect(result.query).toBe('');
  });

  it('should return results for a search query', async () => {
    const result = await service.search('test', {}, 1, 10);
    expect(result.games).toBeDefined();
    expect(result.studios).toBeDefined();
    expect(result.devlogs).toBeDefined();
  });

  it('should filter by genre', async () => {
    const result = await service.search('', { genre: 'horror' }, 1, 10);
    expect(result.games).toBeDefined();
  });

  it('should sort by popularity', async () => {
    const result = await service.search('', { sort: 'popularity' }, 1, 10);
    expect(result.games).toBeDefined();
  });

  it('should sort by newest', async () => {
    const result = await service.search('', { sort: 'newest' }, 1, 10);
    expect(result.games).toBeDefined();
  });
});
