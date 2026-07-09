import { Controller, Get, Param, NotFoundException, Delete, Body, Patch, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import * as argon2 from 'argon2';

import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':username')
  @ApiOkResponse({ description: 'Public user profile.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  async getProfile(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username.toLowerCase());
    if (!user) throw new NotFoundException('User not found');

    const studioMemberships = await this.prisma.studioMember.findMany({
      where: { userId: user.id },
      include: { studio: { select: { id: true, name: true, slug: true, logoUrl: true, tagline: true } } },
    });

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
      isVerified: user.isVerified,
      level: user.level ?? 0,
      xp: user.xp ?? 0,
      createdAt: user.createdAt,
      followersCount: 0, // User-to-user follows not yet implemented
      followingCount: 0,
      studios: studioMemberships.map((m) => ({ ...m.studio, role: m.role })),
    };
  }

  @Patch('me')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Profile updated.' })
  async patchProfileSimple(
    @CurrentUser() user: { id: string },
    @Body() body: { displayName?: string; bio?: string; avatarUrl?: string },
  ) {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { displayName: body.displayName, bio: body.bio, avatarUrl: body.avatarUrl },
    });
    return { id: updated.id, username: updated.username, displayName: updated.displayName, bio: updated.bio, avatarUrl: updated.avatarUrl, role: updated.role };
  }

  @Patch('me/profile')
  @UseGuards(SessionAuthGuard)
  async updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/cookie-preferences')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Cookie preferences saved.' })
  async updateCookiePreferences(
    @CurrentUser() user: { id: string },
    @Body() body: { analytics: boolean; marketing: boolean },
  ) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { cookiePreferences: { analytics: body.analytics, marketing: body.marketing, updatedAt: new Date().toISOString() } },
    });
    return { ok: true };
  }

  @Delete('me')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Account deleted.' })
  async deleteAccount(@CurrentUser() user: { id: string }, @Body('password') password?: string) {
    const fullUser = await this.usersService.findById(user.id);
    if (fullUser?.passwordHash) {
      if (!password) throw new NotFoundException('Password required');
      const valid = await argon2.verify(fullUser.passwordHash, password);
      if (!valid) throw new NotFoundException('Invalid password');
    }
    // Explicit cleanup + rely on Prisma cascade rules in schema (most User relations are Cascade).
    // This is the GDPR "right to erasure" path.
    // Deeper cleanup for reports (SetNull on resolvedBy, Cascade on reporter) and other sensitive data.
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.verificationToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.emailVerificationCode.deleteMany({ where: { userId: user.id } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.pushSubscription.deleteMany({ where: { userId: user.id } }),
      this.prisma.session.deleteMany({ where: { userId: user.id } }),
      this.prisma.wishlistItem.deleteMany({ where: { userId: user.id } }),
      // Reports: anonymize those resolved by user (SetNull on cascade), delete those reported by user (Cascade)
      this.prisma.moderationReport.updateMany({
        where: { resolvedById: user.id },
        data: { resolvedById: null, resolutionNote: '[user data erased]' },
      }),
      this.prisma.moderationReport.deleteMany({ where: { reporterId: user.id } }),
      // XP events, achievements, game views, studio chat, audit logs etc. rely on Cascade
      // Many other relations (devlogs, comments, reactions, follows, notifications, xp events, etc.)
      // use onDelete: Cascade in the Prisma schema.
    ]);

    await this.prisma.user.delete({ where: { id: user.id } });
    return { success: true, message: 'Account and associated data deleted (cascaded where configured). Reports resolved by user anonymized.' };
  }

  @Get('me/export')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'GDPR data export for the current user.' })
  async exportData(@CurrentUser() user: { id: string }) {
    const data = await this.usersService.exportUserData(user.id);
    if (!data) {
      throw new NotFoundException('User data not found');
    }
    return data;
  }
}
