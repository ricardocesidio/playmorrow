import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EventBusModule } from '../common/event-bus.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [PrismaModule, AuthModule, EventBusModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
