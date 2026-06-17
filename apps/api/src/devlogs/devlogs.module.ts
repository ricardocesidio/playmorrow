import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { DevlogsController } from './devlogs.controller';
import { DevlogsService } from './devlogs.service';

@Module({
  imports: [PrismaModule],
  controllers: [DevlogsController],
  providers: [DevlogsService],
})
export class DevlogsModule {}
