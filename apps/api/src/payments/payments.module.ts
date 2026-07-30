import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [ConfigModule, PrismaModule, NotificationsModule],
  providers: [PaymentsService],
  controllers: [PaymentsController, WebhookController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
