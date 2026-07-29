import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailTemplatesModule } from '../email-templates/email-templates.module';
import { EmailService } from './email.service';
import { EmailSenderService } from './email-sender.service';

@Global()
@Module({
  imports: [PrismaModule, EmailTemplatesModule],
  providers: [EmailService, EmailSenderService],
  exports: [EmailService, EmailSenderService],
})
export class EmailModule {}
