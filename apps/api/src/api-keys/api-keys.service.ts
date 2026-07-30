import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'node:crypto';

const KEY_PREFIX = 'pm_';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  private generateKey(): { raw: string; prefix: string; hash: string } {
    const raw = crypto.randomBytes(32).toString('hex');
    const prefix = KEY_PREFIX + raw.slice(0, 8);
    return { raw: prefix + raw, prefix, hash: crypto.createHash('sha256').update(prefix + raw).digest('hex') };
  }

  async create(userId: string, name: string, scopes: string[] = ['*']) {
    const { raw, prefix, hash } = this.generateKey();
    await this.prisma.apiKey.create({
      data: { userId, name, keyHash: hash, keyPrefix: prefix, scopes },
    });
    return { key: raw, name, prefix, scopes };
  }

  async list(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      select: { id: true, name: true, keyPrefix: true, scopes: true, lastUsedAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return keys;
  }

  async revoke(userId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id: keyId, userId } });
    if (!key) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.update({ where: { id: keyId }, data: { revokedAt: new Date() } });
    return { revoked: true };
  }

  async validate(rawKey: string): Promise<{ userId: string; scopes: string[] } | null> {
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const key = await this.prisma.apiKey.findUnique({ where: { keyHash: hash } });
    if (!key || key.revokedAt || (key.expiresAt && key.expiresAt < new Date())) return null;
    await this.prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
    return { userId: key.userId, scopes: key.scopes };
  }
}
