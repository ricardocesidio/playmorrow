import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [SessionModule],
  controllers: [UploadController],
})
export class UploadModule {}
