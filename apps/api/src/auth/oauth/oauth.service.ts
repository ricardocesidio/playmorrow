import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from '../../prisma/prisma.service';
import type { OAuthProfile } from './strategies/google.strategy';

const REFRESH_EXPIRES_DAYS = 30;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken(): string {
  return randomBytes(48).toString('hex');
}

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async handleOAuthLogin(profile: OAuthProfile) {
    // Try to find existing user by email
    let user = await this.prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } });

    if (user) {
      // Existing user — update avatar if OAuth provides one
      if (profile.avatarUrl && !user.avatarUrl) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: profile.avatarUrl },
        });
      }
    } else {
      // New user — create from OAuth profile
      const username = `${profile.provider}${profile.providerId.slice(0, 8)}`;
      user = await this.prisma.user.create({
        data: {
          email: profile.email.toLowerCase(),
          username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          passwordHash: null, // OAuth-only account
        },
      });
    }

    // Issue tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const rawRefresh = generateRefreshToken();
    const tokenHash = hashToken(rawRefresh);
    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: rawRefresh,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }
}
