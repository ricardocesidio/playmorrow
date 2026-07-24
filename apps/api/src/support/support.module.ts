import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { SupportController } from './support.controller';
import { AdminSupportController } from './admin-support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [UploadModule],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
