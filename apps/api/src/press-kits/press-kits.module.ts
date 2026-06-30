import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { PressKitsController } from './press-kits.controller';
import { PressKitsService } from './press-kits.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditLogModule],
  controllers: [PressKitsController],
  providers: [PressKitsService],
})
export class PressKitsModule {}
