import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { StudiosModule } from '../studios/studios.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { FeedModule } from '../feed/feed.module';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { GamePublicationService } from './game-publication.service';
import { CountersService } from '../common/counters.service';

@Module({
  imports: [PrismaModule, AuthModule, StudiosModule, AuditLogModule, FeedModule, AnalyticsModule],
  controllers: [GamesController],
  providers: [GamesService, GamePublicationService, CountersService],
  exports: [GamesService],
})
export class GamesModule {}
