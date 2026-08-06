import { Test } from '@nestjs/testing';
import { Redis } from '@upstash/redis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisPubSubService } from './redis-pubsub.service';

describe('RedisPubSubService', () => {
  let mockRedis: { publish: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> };

  const createService = async (redis: Redis | null) => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RedisPubSubService,
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();
    return moduleRef.get(RedisPubSubService);
  };

  beforeEach(() => {
    const subscriber = { on: vi.fn(), unsubscribe: vi.fn().mockResolvedValue(undefined) };
    mockRedis = {
      publish: vi.fn().mockResolvedValue(1),
      subscribe: vi.fn().mockReturnValue(subscriber),
    };
  });

  it('publish is a no-op when no Redis client is configured', async () => {
    const service = await createService(null);
    await service.publish('chan', { a: 1 });
    expect(mockRedis.publish).not.toHaveBeenCalled();
  });

  it('publish serializes and sends the message', async () => {
    const service = await createService(mockRedis as unknown as Redis);
    await service.publish('chan', { a: 1 });
    expect(mockRedis.publish).toHaveBeenCalledWith('chan', JSON.stringify({ a: 1 }));
  });

  it('publish never throws when Redis errors', async () => {
    mockRedis.publish.mockRejectedValue(new Error('down'));
    const service = await createService(mockRedis as unknown as Redis);
    await expect(service.publish('chan', { a: 1 })).resolves.toBeUndefined();
  });

  it('subscribe without Redis returns a no-op unsubscribe', async () => {
    const service = await createService(null);
    const unsubscribe = service.subscribe<{ a: number }>('chan', () => {});
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });

  it('subscribe relays messages to the handler', async () => {
    const service = await createService(mockRedis as unknown as Redis);
    const handler = vi.fn();
    service.subscribe<{ a: number }>('chan', handler);

    const on = mockRedis.subscribe.mock.results[0].value.on;
    const messageListener = on.mock.calls.find((c) => c[0] === 'message')?.[1];
    messageListener({ channel: 'chan', message: { a: 42 } });

    expect(handler).toHaveBeenCalledWith({ a: 42 });
  });

  it('subscribe never throws when subscription fails', async () => {
    mockRedis.subscribe.mockImplementation(() => { throw new Error('no ws'); });
    const service = await createService(mockRedis as unknown as Redis);
    expect(() => service.subscribe<{ a: number }>('chan', () => {})).not.toThrow();
  });
});
