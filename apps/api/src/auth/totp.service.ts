import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'node:crypto';

@Injectable()
export class TotpService {
  private readonly DIGITS = 6;
  private readonly PERIOD = 30;
  private readonly encryptionKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    this.encryptionKey = scryptSync(secret, 'playmorrow-totp-salt', 32);
  }

  generateSecret(): string {
    const bytes = randomBytes(20);
    return this.base32Encode(bytes);
  }

  generateKeyUri(email: string, secret: string): string {
    const encoded = encodeURIComponent(`Playmorrow:${email}`);
    return `otpauth://totp/${encoded}?secret=${secret}&issuer=Playmorrow&algorithm=SHA1&digits=${this.DIGITS}&period=${this.PERIOD}`;
  }

  verifyToken(token: string, secret: string): boolean {
    const now = Math.floor(Date.now() / 1000);
    const counter = Math.floor(now / this.PERIOD);
    for (let i = -1; i <= 1; i++) {
      if (this.generateToken(secret, counter + i) === token) return true;
    }
    return false;
  }

  generateRecoveryCodes(): string[] {
    return Array.from({ length: 8 }, () =>
      randomBytes(5).toString('hex').toUpperCase(),
    );
  }

  private generateToken(secret: string, counter: number): string {
    const decoded = this.base32Decode(secret);
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(counter));
    const hmac = createHmac('sha1', decoded).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
    const otp = binary % Math.pow(10, this.DIGITS);
    return otp.toString().padStart(this.DIGITS, '0');
  }

  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';
    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;
      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
    return output;
  }

  private base32Decode(input: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const sanitized = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
    let bits = 0;
    let value = 0;
    const output: number[] = [];
    for (let i = 0; i < sanitized.length; i++) {
      value = (value << 5) | alphabet.indexOf(sanitized[i]);
      bits += 5;
      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    return Buffer.from(output);
  }

  encryptSecret(plaintext: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
  }

  decryptSecret(ciphertext: string): string {
    const [ivHex, encryptedHex, tagHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex!, 'hex');
    const encrypted = Buffer.from(encryptedHex!, 'hex');
    const tag = Buffer.from(tagHex!, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
  }
}
