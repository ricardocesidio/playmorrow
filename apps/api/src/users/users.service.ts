import { ConflictException, Injectable } from '@nestjs/common';
import type { User } from '@playmorrow/database';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: {
    email: string;
    username: string;
    displayName: string;
    passwordHash: string;
    accountType?: 'PLAYER' | 'STUDIO';
    termsAcceptedAt?: Date;
    privacyAcceptedAt?: Date;
    communityGuidelinesAcceptedAt?: Date;
    termsVersion?: string;
    privacyVersion?: string;
    communityGuidelinesVersion?: string;
    marketingOptInAt?: Date;
    partnerMarketingOptInAt?: Date;
  }): Promise<User> {
    const emailLower = data.email.toLowerCase();

    const existingEmail = await this.findByEmail(emailLower);
    if (existingEmail) {
      throw new ConflictException('A user with this email already exists');
    }

    const existingUsername = await this.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictException('A user with this username already exists');
    }

    return this.prisma.user.create({
      data: {
        email: emailLower,
        username: data.username,
        displayName: data.displayName,
        passwordHash: data.passwordHash,
        role: 'PLAYER',
        accountType: data.accountType ?? 'PLAYER',
        termsAcceptedAt: data.termsAcceptedAt,
        privacyAcceptedAt: data.privacyAcceptedAt,
        communityGuidelinesAcceptedAt: data.communityGuidelinesAcceptedAt,
        termsVersion: data.termsVersion,
        privacyVersion: data.privacyVersion,
        communityGuidelinesVersion: data.communityGuidelinesVersion,
        marketingOptInAt: data.marketingOptInAt,
        partnerMarketingOptInAt: data.partnerMarketingOptInAt,
      },
    });
  }
}
