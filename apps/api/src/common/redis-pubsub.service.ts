import { Inject, Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { REDIS_CLIENT } from './redis.constants';

/**
 * Best-effort Redis pub/sub bridge.
 *
 * Every operation is fail-open: when no Redis client is configured (REDIS_URL
 * absent) or a call errors, publish is a no-op and subscribe never fires. This
 * keeps single-instance deployments working exactly as before and guarantees
 * a Redis outage never breaks the API.
 *
 * REDIS_CLIENT is always resolvable (RedisModule provides `null` when
 * REDIS_URL is unset), so no @Optional() is needed on the injection.
 */
@Injectable()
export class RedisPubSubService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  /** Fire-and-forget publish. Never throws. */
  async publish<T>(channel: string, message: T): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.publish(channel, JSON.stringify(message));
    } catch {
      // Fail-open: local in-process delivery already covered the sender's
      // subscribers; a Redis outage just loses cross-instance fan-out.
    }
  }

  /** Subscribe to a channel. Returns an unsubscribe function. Never throws. */
  subscribe<T>(channel: string, handler: (message: T) => void): () => void {
    if (!this.redis) return () => {};
    try {
      const subscriber = this.redis.subscribe<T>(channel);
      subscriber.on('message', ({ message }) => {
        try {
          handler(message);
        } catch {
          // A failing consumer must never crash the Redis message pump.
        }
      });
      subscriber.on('error', () => {});
      return () => {
        try {
          void subscriber.unsubscribe();
        } catch {
          // Unsubscribe is best-effort.
        }
      };
    } catch {
      return () => {};
    }
  }
}
