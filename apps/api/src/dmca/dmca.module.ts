import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventBusModule } from '../common/event-bus.module';
import { DmcaController } from './dmca.controller';
import { DmcaService } from './dmca.service';

@Module({
  imports: [PrismaModule, EventBusModule],
  controllers: [DmcaController],
  providers: [DmcaService],
})
export class DmcaModule {}
