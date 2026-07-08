import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { StudioChatModule } from '../studio-chat/studio-chat.module';
import { FeedModule } from '../feed/feed.module';
import { StudiosController } from './studios.controller';
import { StudiosService } from './studios.service';
import { StudioXpService } from './studio-xp.service';
import { StudioRolesGuard } from './guards/studio-roles.guard';

@Module({
  imports: [PrismaModule, AuthModule, AuditLogModule, StudioChatModule, FeedModule],
  controllers: [StudiosController],
  providers: [StudiosService, StudioXpService, StudioRolesGuard],
  exports: [StudiosService, StudioXpService],
})
export class StudiosModule {}
