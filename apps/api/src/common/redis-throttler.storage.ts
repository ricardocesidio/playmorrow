import { Redis } from '@upstash/redis';
import type { ThrottlerStorage } from '@nestjs/throttler';

// @nestjs/throttler does not re-export ThrottlerStorageRecord from the package
// root; define the structural shape here instead.
export interface ThrottlerStorageRecordShape {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

// Atomic INCR + first-hit PEXPIRE in a single Lua round-trip so the counter
// window survives multi-instance deployments and process restarts.
const INCR_AND_TTL_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return { current, ttl }
`;

export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecordShape> {
    try {
      const result = (await this.redis.eval(
        INCR_AND_TTL_SCRIPT,
        [key],
        [String(ttl)],
      )) as [number, number];

      const totalHits = Number(result[0]);
      const ttlMs = Number(result[1]);

      const timeToExpire = ttlMs >= 0 ? ttlMs : ttl;
      let timeToBlockExpire = 0;
      let isBlocked = false;

      if (blockDuration > 0 && totalHits > limit) {
        await this.redis.pexpire(key, blockDuration);
        timeToBlockExpire = blockDuration;
        isBlocked = true;
      }

      return { totalHits, timeToExpire, isBlocked, timeToBlockExpire };
    } catch (err) {
      // Redis unavailable → fail open so a Redis outage never takes down the API.
      return { totalHits: 1, timeToExpire: ttl, isBlocked: false, timeToBlockExpire: 0 };
    }
  }
}
