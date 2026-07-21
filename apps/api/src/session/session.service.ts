import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { logger } from '../common/logger';
import { PrismaService } from '../prisma/prisma.service';

const SESSION_BYTES = 32;
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, ip?: string, userAgent?: string) {
    const raw = randomBytes(SESSION_BYTES).toString('base64url');
    const sessionHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
    const ipHash = ip ? hashToken(ip).slice(0, 16) : null;

    await this.prisma.session.create({
      data: {
        sessionHash,
        userId,
        expiresAt,
        ipHash,
        userAgent: userAgent ?? null,
      },
    });

    return { raw, expiresAt };
  }

  async validate(raw: string) {
    const sessionHash = hashToken(raw);
    const session = await this.prisma.session.findUnique({
      where: { sessionHash },
      include: { user: { select: { id: true, role: true, isVerified: true, authVersion: true, lockedUntil: true } } },
    });

    if (!session) return null;
    if (session.revokedAt) return null;
    if (session.expiresAt < new Date()) return null;
    if (session.user.lockedUntil && session.user.lockedUntil > new Date()) return null;

    // Touch lastSeenAt (no more than once per minute to avoid write spam)
    if (Date.now() - session.lastSeenAt.getTime() > 60_000) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      }).catch((err) => logger.error({ err }));
    }

    return { session, user: session.user };
  }

  async revoke(sessionHash: string) {
    await this.prisma.session.updateMany({
      where: { sessionHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        lastSeenAt: true,
        expiresAt: true,
        userAgent: true,
        ipHash: true,
      },
    });
  }
}
