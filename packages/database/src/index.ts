import { PrismaClient } from '@prisma/client';

/**
 * Single shared PrismaClient instance.
 *
 * In development Next.js / Nest watch-mode reloads modules repeatedly, which
 * would otherwise spawn a new client (and a new connection pool) on every
 * reload. We cache the instance on `globalThis` to avoid exhausting connections.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export the generated types & enums so consumers depend only on
// `@playmorrow/database`, never on `@prisma/client` directly.
export * from '@prisma/client';
export { PrismaClient } from '@prisma/client';
