import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { StudiosController } from './studios.controller';
import { StudiosService } from './studios.service';
import { StudioXpService } from './studio-xp.service';
import { StudioRolesGuard } from './guards/studio-roles.guard';

@Module({
  imports: [PrismaModule, AuthModule, AuditLogModule],
  controllers: [StudiosController],
  providers: [StudiosService, StudioXpService, StudioRolesGuard],
  exports: [StudiosService, StudioXpService],
})
export class StudiosModule {}
