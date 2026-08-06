import { Redis } from '@upstash/redis';

// Build an Upstash REST client from a single REDIS_URL string. Upstash embeds
// credentials as userinfo (`https://<token>@<host>`) or TCP-style
// (`redis://default:<token>@<host>`), so split those into url + token.
// Falls back to REDIS_TOKEN / UPSTASH_REDIS_REST_TOKEN when no credentials
// are embedded in the URL.
export function createRedisFromUrl(redisUrl: string): Redis {
  const u = new URL(redisUrl);
  const token = u.password || u.username;
  const isTcp = u.protocol === 'redis:' || u.protocol === 'rediss:';
  u.protocol = isTcp ? 'https:' : u.protocol;
  u.port = isTcp ? '' : u.port;
  u.username = '';
  u.password = '';
  const baseUrl = u.toString().replace(/\/$/, '');
  if (token) return new Redis({ url: baseUrl, token });
  const tokenEnv = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;
  if (tokenEnv) return new Redis({ url: baseUrl, token: tokenEnv });
  throw new Error(
    'REDIS_URL is set but contains no credentials. Use https://<token>@<host> or set REDIS_TOKEN.',
  );
}
