import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StudiosModule } from '../studios/studios.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { RoadmapItemsController } from './roadmap-items.controller';
import { RoadmapItemsService } from './roadmap-items.service';

@Module({
  imports: [PrismaModule, AuthModule, StudiosModule, AuditLogModule],
  controllers: [RoadmapItemsController],
  providers: [RoadmapItemsService],
})
export class RoadmapItemsModule {}
