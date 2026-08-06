/** DI token for the optional Redis client. Resolves to `null` when REDIS_URL is absent. */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
