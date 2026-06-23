import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PressKitsController } from './press-kits.controller';
import { PressKitsService } from './press-kits.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PressKitsController],
  providers: [PressKitsService],
})
export class PressKitsModule {}
