import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { SessionModule } from '../session/session.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, SessionModule],
  controllers: [UploadController],
})
export class UploadModule {}
