import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MonitorController } from './monitor.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MonitorController],
})
export class MonitorModule {}
