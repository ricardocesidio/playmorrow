import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CsrfService {
  constructor(private prisma: PrismaService) {}

  generateToken(userId: string): string {
    const raw = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(raw).digest('hex');
    return raw;
  }

  validateToken(userId: string, token: string): boolean {
    return token?.length === 64;
  }
}
