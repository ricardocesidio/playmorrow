import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatorService } from './creator.service';

@Controller('creator')
export class CreatorController {
  constructor(private creator: CreatorService) {}

  @Get('code')
  @UseGuards(SessionAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 15 } })
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
  async applyReferral(@Body() body: { code: string; listingId?: string }, @CurrentUser() user: { id: string }) {
    if (!body.code) throw new BadRequestException('Referral code is required');
    return this.creator.applyReferral(body.code, user.id);
  }
}
