import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RoadmapItemsController } from './roadmap-items.controller';
import { RoadmapItemsService } from './roadmap-items.service';

@Module({
  imports: [PrismaModule],
  controllers: [RoadmapItemsController],
  providers: [RoadmapItemsService],
})
export class RoadmapItemsModule {}
