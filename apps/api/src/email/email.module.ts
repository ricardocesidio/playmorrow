import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailTemplatesModule } from '../email-templates/email-templates.module';
import { EmailService } from './email.service';
import { EmailSenderService } from './email-sender.service';
import { EmailWebhooksController } from './webhooks/email-webhooks.controller';
import { EmailTrackingController } from './email-tracking.controller';

@Global()
@Module({
  imports: [PrismaModule, EmailTemplatesModule],
  controllers: [EmailWebhooksController, EmailTrackingController],
  providers: [EmailService, EmailSenderService],
  exports: [EmailService, EmailSenderService],
})
export class EmailModule {}
