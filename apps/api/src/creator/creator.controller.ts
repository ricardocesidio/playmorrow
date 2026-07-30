import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CreatorService } from './creator.service';

@Controller('creator')
export class CreatorController {
  constructor(private creator: CreatorService) {}

  @Get('code')
  @UseGuards(SessionAuthGuard)
  async getCode(@Req() req: any) {
    return this.creator.getOrCreateCode(req.user.id);
  }

  @Get('commissions')
  @UseGuards(SessionAuthGuard)
  async getCommissions(@Req() req: any) {
    return this.creator.getMyReferrals(req.user.id);
  }

  @Post('apply')
  @UseGuards(SessionAuthGuard)
  async applyReferral(@Body() body: { code: string }, @Req() req: any) {
    if (!body.code) throw new Error('Referral code is required');
    return { applied: true };
  }
}
