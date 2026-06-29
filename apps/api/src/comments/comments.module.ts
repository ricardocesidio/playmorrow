import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StudiosModule } from '../studios/studios.module';
import { CommentsController } from './comments.controller';
import { GameCommentsController } from './game-comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [PrismaModule, AuthModule, StudiosModule],
  controllers: [CommentsController, GameCommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
