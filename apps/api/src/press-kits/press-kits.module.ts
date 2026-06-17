import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { PressKitsController } from './press-kits.controller';
import { PressKitsService } from './press-kits.service';

@Module({
  imports: [PrismaModule],
  controllers: [PressKitsController],
  providers: [PressKitsService],
})
export class PressKitsModule {}
