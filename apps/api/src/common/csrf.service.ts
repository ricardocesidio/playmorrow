import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

@Injectable()
export class CsrfService {
  private readonly secret: string;

  constructor(config: ConfigService) {
    const isProduction = config.get<string>('NODE_ENV') === 'production';
    const secret = config.get<string>('CSRF_SECRET');
    if (!secret && isProduction) {
      throw new Error('CSRF_SECRET environment variable is required in production');
    }
    this.secret = secret || 'dev-csrf-secret';
    if (!secret) {
      Logger.warn('CSRF_SECRET not set — using development fallback. Set CSRF_SECRET in production.');
    }
  }

  private readonly tokenMaxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days (matches session lifetime)

  generateToken(userId: string): string {
    const nonce = randomBytes(16).toString('hex');
    const now = Date.now();
    const payload = `${userId}:${nonce}:${now}`;
    const signature = createHmac('sha256', this.secret).update(payload).digest('hex');
    return Buffer.from(`${payload}:${signature}`).toString('base64url');
  }

  validateToken(userId: string, token: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64url').toString();
      const lastColon = decoded.lastIndexOf(':');
      if (lastColon === -1) return false;
      const payload = decoded.slice(0, lastColon);
      const signature = decoded.slice(lastColon + 1);
      const expected = createHmac('sha256', this.secret).update(payload).digest('hex');
      if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) return false;
      const parts = payload.split(':');
      if (parts.length < 3) return false;
      const userIdPart = parts[0];
      if (userIdPart !== userId) return false;
      const ts = Number(parts[parts.length - 1]);
      if (Number.isNaN(ts)) return false;
      if (Date.now() - ts > this.tokenMaxAgeMs) return false;
      return true;
    } catch {
      return false;
    }
  }
}
