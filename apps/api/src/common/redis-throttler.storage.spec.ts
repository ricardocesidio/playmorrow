import { describe, expect, it, vi } from 'vitest';
import { RedisThrottlerStorage } from './redis-throttler.storage';

function createMockRedis() {
  return {
    eval: vi.fn(),
    pexpire: vi.fn().mockResolvedValue(1),
  } as unknown as { eval: ReturnType<typeof vi.fn>; pexpire: ReturnType<typeof vi.fn> };
}

describe('RedisThrottlerStorage', () => {
  it('increments and returns TTL from the atomic Lua script', async () => {
    const redis = createMockRedis();
    redis.eval.mockResolvedValue([3, 60000]);
    const storage = new RedisThrottlerStorage(redis as never);

    const record = await storage.increment('key', 60_000, 60, 0);

    expect(record.totalHits).toBe(3);
    expect(record.timeToExpire).toBe(60_000);
    expect(record.isBlocked).toBe(false);
    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining('redis.call'),
      ['key'],
      ['60000'],
    );
  });

  it('marks the key blocked when hits exceed the limit and a block duration is set', async () => {
    const redis = createMockRedis();
    redis.eval.mockResolvedValue([11, 60000]);
    const storage = new RedisThrottlerStorage(redis as never);

    const record = await storage.increment('key', 60_000, 10, 120_000);

    expect(record.isBlocked).toBe(true);
    expect(record.timeToBlockExpire).toBe(120_000);
    expect(redis.pexpire).toHaveBeenCalledWith('key', 120_000);
  });

  it('fails open when Redis is unavailable (API must never 500 on Redis outage)', async () => {
    const redis = createMockRedis();
    redis.eval.mockRejectedValue(new Error('connection refused'));
    const storage = new RedisThrottlerStorage(redis as never);

    const record = await storage.increment('key', 60_000, 60, 0);

    expect(record.totalHits).toBe(1);
    expect(record.timeToExpire).toBe(60_000);
    expect(record.isBlocked).toBe(false);
  });
});
