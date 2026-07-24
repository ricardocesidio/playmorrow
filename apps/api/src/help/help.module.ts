import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HelpController } from './help.controller';
import { AdminHelpController } from './admin-help.controller';
import { HelpService } from './help.service';

@Module({
  imports: [AuthModule],
  controllers: [HelpController, AdminHelpController],
  providers: [HelpService],
  exports: [HelpService],
})
export class HelpModule {}
