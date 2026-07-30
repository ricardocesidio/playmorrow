import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventBusModule } from '../common/event-bus.module';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { EscalationService } from './escalation.service';

@Module({
  imports: [PrismaModule, EventBusModule],
  controllers: [ModerationController],
  providers: [ModerationService, EscalationService],
  exports: [ModerationService],
})
export class ModerationModule {}
