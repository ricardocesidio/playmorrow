import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DevlogsController } from './devlogs.controller';
import { DevlogsService } from './devlogs.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DevlogsController],
  providers: [DevlogsService],
})
export class DevlogsModule {}
