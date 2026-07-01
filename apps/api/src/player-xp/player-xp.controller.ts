import { Controller, Get, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlayerXpService } from './player-xp.service';

@Controller('me/xp')
@UseGuards(SessionAuthGuard)
export class PlayerXpController {
  constructor(private xpService: PlayerXpService) {}

  @Get('history')
  async getHistory(@CurrentUser() user: { id: string }) {
    return this.xpService.getHistory(user.id);
  }

  @Get('weekly')
  async getWeekly(@CurrentUser() user: { id: string }) {
    return { weekly: await this.xpService.getWeeklyXp(user.id) };
  }

  @Get('monthly')
  async getMonthly(@CurrentUser() user: { id: string }) {
    return { monthly: await this.xpService.getMonthlyXp(user.id) };
  }
}
