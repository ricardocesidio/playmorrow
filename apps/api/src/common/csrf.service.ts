import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'node:crypto';

@Injectable()
export class CsrfService {
  generateToken(userId: string): string {
    const secret = process.env.CSRF_SECRET || 'dev-csrf-secret-do-not-use-in-prod';
    const nonce = randomBytes(16).toString('hex');
    const payload = `${userId}:${nonce}:${Date.now()}`;
    const signature = createHmac('sha256', secret).update(payload).digest('hex');
    return Buffer.from(`${payload}:${signature}`).toString('base64url');
  }

  validateToken(userId: string, token: string): boolean {
    try {
      const secret = process.env.CSRF_SECRET || 'dev-csrf-secret-do-not-use-in-prod';
      const decoded = Buffer.from(token, 'base64url').toString();
      const lastColon = decoded.lastIndexOf(':');
      if (lastColon === -1) return false;
      const payload = decoded.slice(0, lastColon);
      const signature = decoded.slice(lastColon + 1);
      const expected = createHmac('sha256', secret).update(payload).digest('hex');
      if (signature !== expected) return false;
      const userIdPart = payload.split(':')[0];
      return userIdPart === userId;
    } catch {
      return false;
    }
  }
}
