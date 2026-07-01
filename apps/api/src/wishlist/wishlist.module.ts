import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PlayerXpModule } from '../player-xp/player-xp.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StudiosModule } from '../studios/studios.module';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [PrismaModule, AuthModule, StudiosModule, PlayerXpModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
