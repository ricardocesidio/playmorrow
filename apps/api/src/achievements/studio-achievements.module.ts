import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StudioAchievementsService } from './studio-achievements.service';

@Module({
  imports: [PrismaModule],
  providers: [StudioAchievementsService],
  exports: [StudioAchievementsService],
})
export class StudioAchievementsModule {}
