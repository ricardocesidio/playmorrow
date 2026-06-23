import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StudiosController } from './studios.controller';
import { StudiosService } from './studios.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [StudiosController],
  providers: [StudiosService],
})
export class StudiosModule {}
