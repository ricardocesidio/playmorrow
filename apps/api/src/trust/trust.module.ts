import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventBusModule } from '../common/event-bus.module';
import { TrustScoreService } from './trust-score.service';

@Module({
  imports: [PrismaModule, EventBusModule],
  providers: [TrustScoreService],
  exports: [TrustScoreService],
})
export class TrustModule {}
