import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { GameAnalyticsController } from './game-analytics.controller';
import { StudioAnalyticsController } from './studio-analytics.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController, StudioAnalyticsController, GameAnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
