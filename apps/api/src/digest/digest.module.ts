import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailSenderService } from '../email/email-sender.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';
import { DigestService } from './digest.service';

@Module({
  imports: [PrismaModule],
  providers: [DigestService, EmailSenderService, EmailTemplatesService],
})
export class DigestModule {}
