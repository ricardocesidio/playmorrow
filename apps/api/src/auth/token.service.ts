import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

const TOKEN_BYTES = 32; // 256 bits
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class TokenService {
  constructor() {}

  generate() {
    const raw = randomBytes(TOKEN_BYTES).toString('base64url');
    return { raw, hash: hashToken(raw), expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS) };
  }

  hash(raw: string) {
    return hashToken(raw);
  }
}
