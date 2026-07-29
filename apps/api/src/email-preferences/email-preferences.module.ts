import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailPreferencesController } from './email-preferences.controller';
import { EmailPreferencesService } from './email-preferences.service';

@Module({
  imports: [PrismaModule],
  controllers: [EmailPreferencesController],
  providers: [EmailPreferencesService],
  exports: [EmailPreferencesService],
})
export class EmailPreferencesModule {}
