import { Controller, Get, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AchievementService } from './achievement.service';
import { PlayerXpService } from '../player-xp/player-xp.service';

@Controller('me/achievements')
@UseGuards(SessionAuthGuard)
export class AchievementController {
  constructor(
    private achievementService: AchievementService,
    private xpService: PlayerXpService,
  ) {}

  @Get()
  async getAchievements(@CurrentUser() user: { id: string }) {
    return this.achievementService.getAchievements(user.id);
  }

  @Get('check')
  async checkAndAward(@CurrentUser() user: { id: string }) {
    return this.achievementService.checkAndAward(user.id, this.xpService);
  }
}
