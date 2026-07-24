import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StudioHealthService } from './studio-health.service';

@Module({
  imports: [PrismaModule],
  providers: [StudioHealthService],
  exports: [StudioHealthService],
})
export class StudioHealthModule {}
