import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { WeeklyReportsService } from './weekly-reports.service';

@Module({
  imports: [PrismaModule, ScheduleModule],
  providers: [WeeklyReportsService],
  exports: [WeeklyReportsService],
})
export class WeeklyReportsModule {}
