import {
  Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalSessionGuard } from '../auth/guards/optional-session.guard';
import { ModerationService } from './moderation.service';

// CSRF is intentionally NOT skipped here. Admin/moderator endpoints must be
// CSRF-protected because they use session cookies for auth (not API tokens).
// The SessionAuthGuard + CsrfGuard combination ensures that mutations require
// a valid CSRF token from the login response, preventing CSRF attacks.
@ApiTags('admin/moderation')
@Controller('admin/moderation')
export class ModerationController {
  constructor(private readonly mod: ModerationService) {}

  @UseGuards(SessionAuthGuard)
  @Post('suspend')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Suspend a user for a duration' })
  async suspend(
    @CurrentUser() admin: { id: string },
    @Body() body: { userId: string; reason: string; durationHours: number },
  ) {
    return this.mod.suspendUser(admin.id, body.userId, body.reason, body.durationHours);
  }

  @UseGuards(SessionAuthGuard)
  @Post('unsuspend')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Remove a suspension from a user' })
  async unsuspend(
    @CurrentUser() admin: { id: string },
    @Body() body: { userId: string },
  ) {
    return this.mod.unsuspendUser(admin.id, body.userId);
  }

  @UseGuards(SessionAuthGuard)
  @Post('shadow-ban')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Shadow ban a user' })
  async shadowBan(
    @CurrentUser() admin: { id: string },
    @Body() body: { userId: string },
  ) {
    return this.mod.shadowBanUser(admin.id, body.userId);
  }

  @UseGuards(SessionAuthGuard)
  @Post('remove-shadow-ban')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Remove shadow ban from a user' })
  async removeShadowBan(
    @CurrentUser() admin: { id: string },
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

  @UseGuards(SessionAuthGuard)
  @Get('appeals')
  @ApiOperation({ summary: 'List all users with active appeals' })
  async listAppeals(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.mod.listAppeals(page, pageSize);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('appeals/:userId')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Resolve an appeal (APPROVED or DENIED)' })
  async resolveAppeal(
    @CurrentUser() admin: { id: string },
    @Param('userId') userId: string,
    @Body() body: { resolution: 'APPROVED' | 'DENIED'; notes?: string },
  ) {
    return this.mod.resolveAppeal(admin.id, userId, body.resolution, body.notes);
  }
}
