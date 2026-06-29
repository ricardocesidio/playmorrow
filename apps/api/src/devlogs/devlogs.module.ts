import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StudiosModule } from '../studios/studios.module';
import { DevlogsController } from './devlogs.controller';
import { DevlogsService } from './devlogs.service';

@Module({
  imports: [PrismaModule, AuthModule, StudiosModule],
  controllers: [DevlogsController],
  providers: [DevlogsService],
})
export class DevlogsModule {}
