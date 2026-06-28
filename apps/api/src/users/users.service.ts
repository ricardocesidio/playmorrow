import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@playmorrow/database';

import { PrismaService } from '../prisma/prisma.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { OR: [{ username }, { usernameLowercase: username.toLowerCase() }] },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Record<string, unknown> = {};

    if (dto.username !== undefined) {
      const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Username already taken');
      }
      data.username = dto.username;
      data.usernameLowercase = dto.username.toLowerCase();
    }

    if (dto.email !== undefined) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      if (user.emailChangeCount >= 2) {
        throw new BadRequestException('Email can only be changed 2 times. Contact support for assistance.');
      }
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
      data.email = dto.email.toLowerCase();
      data.emailChangeCount = (user.emailChangeCount ?? 0) + 1;
    }

    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, bio: true, location: true, emailChangeCount: true, accountType: true, role: true },
    });
  }

  async create(data: {
    email: string;
    username: string;
    displayName: string;
    passwordHash: string;
    accountType?: 'PLAYER' | 'STUDIO';
    isOnboardingCompleted?: boolean;
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
        usernameLowercase: data.username.toLowerCase(),
        displayName: data.displayName,
        passwordHash: data.passwordHash,
        role: 'PLAYER',
        accountType: data.accountType ?? 'PLAYER',
        isOnboardingCompleted: data.isOnboardingCompleted ?? true,
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
