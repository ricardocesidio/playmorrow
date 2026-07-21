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

  /**
   * GDPR data export stub: gathers user's personal data.
   * Returns a JSON blob with profile, activity, etc. (expand as needed).
   */
  async exportUserData(userId: string): Promise<Record<string, any> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        location: true,
        country: true,
        avatarUrl: true,
        role: true,
        accountType: true,
        isVerified: true,
        level: true,
        xp: true,
        createdAt: true,
        updatedAt: true,
        marketingOptInAt: true,
        partnerMarketingOptInAt: true,
        cookiePreferences: true,
        // omit passwordHash, tokens etc.
      },
    });

    if (!user) return null;

    const [
      follows,
      wishlist,
      devlogs,
      comments,
      notifications,
      xpEvents,
      achievements,
      sessions,
      reportsFiled,
      reactions,
      studioMemberships,
    ] = await Promise.all([
      this.prisma.follow.findMany({ where: { userId }, select: { targetType: true, studioId: true, gameId: true, createdAt: true } }),
      this.prisma.wishlistItem.findMany({ where: { userId }, select: { gameId: true, createdAt: true } }),
      this.prisma.devlog.findMany({ where: { authorId: userId }, select: { id: true, title: true, slug: true, status: true, createdAt: true } }),
      this.prisma.comment.findMany({ where: { authorId: userId }, select: { id: true, body: true, devlogId: true, createdAt: true } }),
      this.prisma.notification.findMany({ where: { recipientId: userId }, select: { id: true, type: true, title: true, createdAt: true } }),
      this.prisma.playerXpEvent.findMany({ where: { userId }, select: { id: true, reason: true, amount: true, createdAt: true } }),
      this.prisma.achievement.findMany({ where: { userId }, select: { achievementId: true, name: true, unlockedAt: true } }),
      this.prisma.session.findMany({ where: { userId }, select: { id: true, createdAt: true, lastSeenAt: true, expiresAt: true } }),
      this.prisma.moderationReport.findMany({ where: { reporterId: userId }, select: { id: true, targetType: true, targetId: true, reason: true, createdAt: true } }),
      this.prisma.reaction.findMany({ where: { userId }, select: { id: true, type: true, devlogId: true, commentId: true, createdAt: true } }),
      this.prisma.studioMember.findMany({ where: { userId }, select: { studioId: true, role: true, joinedAt: true } }),
    ]);

    return {
      profile: user,
      follows,
      wishlist,
      devlogs,
      comments,
      notifications,
      xpEvents,
      achievements,
      sessions,
      reportsFiled,
      reactions,
      studioMemberships,
      exportedAt: new Date().toISOString(),
    };
  }
}
