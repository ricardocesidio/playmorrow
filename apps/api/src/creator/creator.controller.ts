import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatorService } from './creator.service';

@Controller('creator')
export class CreatorController {
  constructor(private creator: CreatorService) {}

  @Get('code')
  @UseGuards(SessionAuthGuard)
  async getCode(@CurrentUser() user: { id: string }) {
    return this.creator.getOrCreateCode(user.id);
  }

  @Get('commissions')
  @UseGuards(SessionAuthGuard)
  async getCommissions(@CurrentUser() user: { id: string }) {
    return this.creator.getMyReferrals(user.id);
  }

  @Post('apply')
  @UseGuards(SessionAuthGuard)
  async applyReferral(@Body() body: { code: string }) {
    if (!body.code) throw new Error('Referral code is required');
    return { applied: true };
  }
}
