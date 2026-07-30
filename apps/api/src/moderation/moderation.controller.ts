import {
  Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { ModerationService } from './moderation.service';

@ApiTags('admin/moderation')
@Controller('admin/moderation')
export class ModerationController {
  constructor(private readonly mod: ModerationService) {}

  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Get('dashboard')
  @ApiOperation({ summary: 'Get moderation dashboard metrics' })
  async getDashboard() {
    return this.mod.getDashboardMetrics();
  }

  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Post('strike')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Give a strike to a user (3 strikes = auto-suspend)' })
  async giveStrike(
    @CurrentUser() admin: { id: string; role: string },
    @Body() body: { userId: string; reason: string },
  ) {
    return this.mod.giveStrike(admin.id, body.userId, body.reason);
  }

  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Post('suspend')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Suspend a user for a duration' })
  async suspend(
    @CurrentUser() admin: { id: string; role: string },
    @Body() body: { userId: string; reason: string; durationHours: number },
  ) {
    return this.mod.suspendUser(admin.id, body.userId, body.reason, body.durationHours);
  }

  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Post('unsuspend')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Remove a suspension from a user' })
  async unsuspend(
    @CurrentUser() admin: { id: string; role: string },
    @Body() body: { userId: string },
  ) {
    return this.mod.unsuspendUser(admin.id, body.userId);
  }

  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Post('shadow-ban')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Shadow ban a user' })
  async shadowBan(
    @CurrentUser() admin: { id: string; role: string },
    @Body() body: { userId: string },
  ) {
    return this.mod.shadowBanUser(admin.id, body.userId);
  }

  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Post('remove-shadow-ban')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Remove shadow ban from a user' })
  async removeShadowBan(
    @CurrentUser() admin: { id: string; role: string },
    @Body() body: { userId: string },
  ) {
    return this.mod.removeShadowBan(admin.id, body.userId);
  }

  @UseGuards(OptionalSessionGuard)
  @Get('users/:id')
  @ApiOperation({ summary: 'Get moderation status of a user (public)' })
  async getUserStatus(@Param('id') id: string) {
    return this.mod.getUserModerationStatus(id);
  }

  @UseGuards(SessionAuthGuard)
  @Post('appeals')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'File an appeal against a moderation action' })
  async fileAppeal(
    @CurrentUser() user: { id: string },
    @Body() body: { reportId: string; reason: string },
  ) {
    return this.mod.fileAppeal(user.id, body.reportId, body.reason);
  }

  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Get('appeals')
  @ApiOperation({ summary: 'List all users with active appeals' })
  async listAppeals(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.mod.listAppeals(page, pageSize);
  }

  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Patch('appeals/:userId')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Resolve an appeal (APPROVED or DENIED)' })
  async resolveAppeal(
    @CurrentUser() admin: { id: string; role: string },
    @Param('userId') userId: string,
    @Body() body: { resolution: 'APPROVED' | 'DENIED'; notes?: string },
  ) {
    return this.mod.resolveAppeal(admin.id, userId, body.resolution, body.notes);
  }
}
