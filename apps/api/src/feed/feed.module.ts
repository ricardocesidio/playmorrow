import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedEngineService } from './feed-events.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FeedController],
  providers: [FeedService, FeedEngineService],
  exports: [FeedEngineService],
})
export class FeedModule {}
