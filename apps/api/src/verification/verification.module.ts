import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EventBusModule } from '../common/event-bus.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { VerificationController } from './verification.controller';
import { AdminVerificationController } from './admin-verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [PrismaModule, AuthModule, EventBusModule, NotificationsModule],
  controllers: [VerificationController, AdminVerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
