import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsService } from './payments.service';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [PaymentsService],
  controllers: [WebhookController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
