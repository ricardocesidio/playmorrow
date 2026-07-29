import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SkipCsrf } from '../common/skip-csrf.decorator';
import { EmailPreferencesService } from './email-preferences.service';

@ApiTags('email-preferences')
@Controller()
export class EmailPreferencesController {
  constructor(private readonly svc: EmailPreferencesService) {}

  @Get('email-preferences')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Get current user email preferences' })
  async get(@CurrentUser() user: { id: string }) {
    return this.svc.getOrCreate(user.id);
  }

  @Patch('email-preferences')
  @UseGuards(SessionAuthGuard)
  @SkipCsrf()
  @ApiOperation({ summary: 'Update email preferences' })
  async update(
    @CurrentUser() user: { id: string },
    @Body() body: {
      marketingOptIn?: boolean;
      digestFrequency?: string;
      devlogNotifications?: boolean;
      wishlistNotifications?: boolean;
      releaseNotifications?: boolean;
      followNotifications?: boolean;
    },
  ) {
    return this.svc.update(user.id, body);
  }

  @Post('unsubscribe/:token')
  @SkipCsrf()
  @ApiOperation({ summary: 'Unsubscribe via token (no auth required)' })
  async unsubscribe(@Param('token') token: string) {
    return this.svc.unsubscribeByToken(token);
  }

  @Get('unsubscribe/:token')
  @ApiOperation({ summary: 'Get unsubscribe info by token' })
  async getUnsubscribeInfo(@Param('token') token: string) {
    return this.svc.getByToken(token);
  }
}
