import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { GamesModule } from '../games/games.module';
import { PlayerXpModule } from '../player-xp/player-xp.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StudiosModule } from '../studios/studios.module';
import { CommentsController } from './comments.controller';
import { GameCommentsController } from './game-comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [PrismaModule, AuthModule, GamesModule, StudiosModule, PlayerXpModule],
  controllers: [CommentsController, GameCommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
