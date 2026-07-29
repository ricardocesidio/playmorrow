import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailTemplatesController } from './email-templates.controller';
import { EmailTemplatesService } from './email-templates.service';

@Module({
  imports: [PrismaModule],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService],
  exports: [EmailTemplatesService],
})
export class EmailTemplatesModule {}
