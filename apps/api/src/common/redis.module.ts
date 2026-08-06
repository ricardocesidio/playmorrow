import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';
import { createRedisFromUrl } from './redis-client';
import { REDIS_CLIENT } from './redis.constants';
import { RedisPubSubService } from './redis-pubsub.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis | null => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (!redisUrl) return null;
        try {
          return createRedisFromUrl(redisUrl);
        } catch (err) {
          // Misconfigured Redis must never take the API down — degrade to no-op.
          console.error(
            '❌ REDIS_URL configured but unusable — Redis features disabled:',
            (err as Error).message,
          );
          return null;
        }
      },
    },
    RedisPubSubService,
  ],
  exports: [REDIS_CLIENT, RedisPubSubService],
})
export class RedisModule {}
