import { Controller, Get, Param, NotFoundException, ParseIntPipe, Query, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiNotFoundResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

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
      studios: studioMemberships.map((m) => ({
        ...m.studio,
        role: m.role,
      })),
    };
  }
}
