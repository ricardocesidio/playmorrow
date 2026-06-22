import { Controller, Get, Param, NotFoundException, Delete, Body, Patch, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import * as argon2 from 'argon2';

import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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
      createdAt: user.createdAt,
      studios: studioMemberships.map((m) => ({ ...m.studio, role: m.role })),
    };
  }

  @Patch('me')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Profile updated.' })
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() body: { displayName?: string; bio?: string; avatarUrl?: string },
  ) {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { displayName: body.displayName, bio: body.bio, avatarUrl: body.avatarUrl },
    });
    return { id: updated.id, username: updated.username, displayName: updated.displayName, bio: updated.bio, avatarUrl: updated.avatarUrl, role: updated.role };
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
    // Session cleanup
    await this.prisma.session.deleteMany({ where: { userId: user.id } });
    await this.prisma.user.delete({ where: { id: user.id } });
    return { success: true };
  }
}
