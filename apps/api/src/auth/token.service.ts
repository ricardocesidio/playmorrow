import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

import { hashToken } from '../common/crypto-utils';

const TOKEN_BYTES = 32; // 256 bits
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class TokenService {

  generate() {
    const raw = randomBytes(TOKEN_BYTES).toString('base64url');
    return { raw, hash: hashToken(raw), expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS) };
  }

  hash(raw: string) {
    return hashToken(raw);
  }
}
