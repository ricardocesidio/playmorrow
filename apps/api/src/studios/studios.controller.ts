import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { StudioRole } from '@playmorrow/database';

import { StudioRoles } from './guards/studio-roles.decorator';
import { StudioRolesGuard } from './guards/studio-roles.guard';
import { CreateStudioDto } from './dto/create-studio.dto';
import { UpdateStudioDto } from './dto/update-studio.dto';
import { StudiosService } from './studios.service';

@ApiTags('studios')
@Controller('studios')
export class StudiosController {
  constructor(private readonly studiosService: StudiosService) {}

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseGuards(SessionAuthGuard)
  @ApiCreatedResponse({ description: 'Studio created.' })
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateStudioDto) {
    return this.studiosService.create(user.id, dto);
  }

  @Get()
  @ApiOkResponse({ description: 'Paginated list of studios.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('search') search?: string,
  ) {
    return this.studiosService.findAll(page, Math.min(pageSize, 100), search);
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: "Current user's studios." })
  async findMyStudios(@CurrentUser() user: { id: string }) {
    return this.studiosService.findMyStudios(user.id);
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Studio profile.' })
  async findBySlug(@Param('slug') slug: string) {
    const studio = await this.studiosService.findBySlug(slug);
    if (!studio) {
      throw new NotFoundException('Studio not found');
    }
    return studio;
  }

  @Get(':slug/members')
  @ApiOkResponse({ description: 'Studio members list.' })
  async findMembers(@Param('slug') slug: string) {
    const studio = await this.studiosService.findBySlugWithMembers(slug);
    if (!studio) {
      throw new NotFoundException('Studio not found');
    }

    return {
      id: studio.id,
      name: studio.name,
      slug: studio.slug,
      members: studio.members,
    };
  }

  @Patch(':slug')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseGuards(SessionAuthGuard)
  @ApiOkResponse({ description: 'Studio updated.' })
  async update(
    @CurrentUser() user: { id: string },
    @Param('slug') slug: string,
    @Body() dto: UpdateStudioDto,
  ) {
    return this.studiosService.update(user.id, slug, dto);
  }

  @Delete(':slug')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Studio deleted (cascades to games, devlogs, etc.).' })
  async remove(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.studiosService.remove(user.id, slug);
  }

  @Patch(':slug/members/:userId')
  @UseGuards(SessionAuthGuard, StudioRolesGuard)
  @StudioRoles(StudioRole.OWNER, StudioRole.ADMIN)
  @ApiOkResponse({ description: 'Member updated.' })
  async updateMember(
    @Param('slug') slug: string,
    @Param('userId') userId: string,
    @Body() dto: { role?: StudioRole; title?: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.studiosService.updateMemberRole(user.id, slug, userId, dto);
  }

  @Delete(':slug/members/:userId')
  @UseGuards(SessionAuthGuard, StudioRolesGuard)
  @StudioRoles(StudioRole.OWNER, StudioRole.ADMIN)
  @ApiOkResponse({ description: 'Member removed.' })
  async removeMember(
    @Param('slug') slug: string,
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.studiosService.removeMember(user.id, slug, userId);
  }

  @Post(':slug/members/leave')
  @UseGuards(SessionAuthGuard, StudioRolesGuard)
  @StudioRoles(StudioRole.ADMIN, StudioRole.MODERATOR, StudioRole.MEMBER)
  @ApiOkResponse({ description: 'Left the studio.' })
  async leaveStudio(
    @Param('slug') slug: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.studiosService.leaveStudio(user.id, slug);
  }

  @Get(':slug/dashboard')
  @UseGuards(SessionAuthGuard, StudioRolesGuard)
  @StudioRoles(StudioRole.OWNER, StudioRole.ADMIN)
  @ApiOkResponse({ description: 'Studio dashboard aggregated stats.' })
  async getDashboard(@Param('slug') slug: string) {
    const studio = await this.studiosService.findBySlug(slug);
    if (!studio) {
      throw new NotFoundException('Studio not found');
    }
    return this.studiosService.getDashboardStats(studio.id);
  }

  @Post(':slug/transfer')
  @UseGuards(SessionAuthGuard, StudioRolesGuard)
  @StudioRoles(StudioRole.OWNER)
  @ApiOkResponse({ description: 'Ownership transferred.' })
  async transferOwnership(
    @Param('slug') slug: string,
    @Body() dto: { targetUserId: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.studiosService.transferOwnership(user.id, slug, dto.targetUserId);
  }
}
