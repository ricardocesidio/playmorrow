import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { GamesModule } from '../games/games.module';
import { PlayerXpModule } from '../player-xp/player-xp.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StudiosModule } from '../studios/studios.module';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';

@Module({
  imports: [PrismaModule, AuthModule, GamesModule, StudiosModule, PlayerXpModule],
  controllers: [FollowsController],
  providers: [FollowsService],
})
export class FollowsModule {}
