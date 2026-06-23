import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { SessionModule } from '../session/session.module';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, SessionModule],
  controllers: [UsersController],
  providers: [UsersService, SessionAuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
