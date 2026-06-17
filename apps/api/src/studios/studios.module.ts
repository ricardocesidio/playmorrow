import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { StudiosController } from './studios.controller';
import { StudiosService } from './studios.service';

@Module({
  imports: [PrismaModule],
  controllers: [StudiosController],
  providers: [StudiosService],
})
export class StudiosModule {}
