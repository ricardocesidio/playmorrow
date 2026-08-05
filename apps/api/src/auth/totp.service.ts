import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

@Injectable()
export class TotpService {
  private readonly encryptionKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    this.encryptionKey = scryptSync(secret, 'playmorrow-totp-salt', 32);
  }

  generateSecret(): string {
    return generateSecret();
  }

  generateKeyUri(email: string, secret: string): string {
    return generateURI({ secret, label: email, issuer: 'Playmorrow' });
  }

  verifyToken(token: string, secret: string): boolean {
    return verifySync({ secret, token }) as unknown as boolean;
  }

  generateRecoveryCodes(): string[] {
    return Array.from({ length: 8 }, () =>
      randomBytes(5).toString('hex').toUpperCase(),
    );
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
    return decipher.update(encrypted) + decipher.final('utf8');
  }
}
