import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StudiosModule } from '../studios/studios.module';
import { RoadmapItemsController } from './roadmap-items.controller';
import { RoadmapItemsService } from './roadmap-items.service';

@Module({
  imports: [PrismaModule, AuthModule, StudiosModule],
  controllers: [RoadmapItemsController],
  providers: [RoadmapItemsService],
})
export class RoadmapItemsModule {}
