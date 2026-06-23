import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RoadmapItemsController } from './roadmap-items.controller';
import { RoadmapItemsService } from './roadmap-items.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RoadmapItemsController],
  providers: [RoadmapItemsService],
})
export class RoadmapItemsModule {}
