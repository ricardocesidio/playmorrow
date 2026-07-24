import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GoalsService } from './goals.service';

@Module({
  imports: [PrismaModule],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
