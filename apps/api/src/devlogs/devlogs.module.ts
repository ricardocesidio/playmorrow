import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StudiosModule } from '../studios/studios.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { FeedModule } from '../feed/feed.module';
import { DevlogsController } from './devlogs.controller';
import { DevlogsService } from './devlogs.service';
import { DevlogsSchedulerService } from './devlogs-scheduler.service';

@Module({
  imports: [PrismaModule, AuthModule, StudiosModule, AuditLogModule, FeedModule, ScheduleModule],
  controllers: [DevlogsController],
  providers: [DevlogsService, DevlogsSchedulerService],
})
export class DevlogsModule {}
