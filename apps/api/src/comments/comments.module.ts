import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CommentsController } from './comments.controller';
import { GameCommentsController } from './game-comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CommentsController, GameCommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
