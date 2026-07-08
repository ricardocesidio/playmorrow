import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StudiosModule } from '../studios/studios.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { FeedModule } from '../feed/feed.module';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

@Module({
  imports: [PrismaModule, AuthModule, StudiosModule, AuditLogModule, FeedModule],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
