import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
