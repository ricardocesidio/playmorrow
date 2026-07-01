import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StudioChatController } from './studio-chat.controller';
import { StudioChatService } from './studio-chat.service';

@Module({
  imports: [PrismaModule],
  controllers: [StudioChatController],
  providers: [StudioChatService],
  exports: [StudioChatService],
})
export class StudioChatModule {}
