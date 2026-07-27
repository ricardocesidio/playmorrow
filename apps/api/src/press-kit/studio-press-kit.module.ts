import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventBusModule } from '../common/event-bus.module';
import { StudioPressKitService } from './studio-press-kit.service';

@Module({
  imports: [PrismaModule, EventBusModule],
  providers: [StudioPressKitService],
  exports: [StudioPressKitService],
})
/** Studio-level press kits */
export class StudioPressKitModule {}
