import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PlayerXpService } from './player-xp.service';
import { PlayerXpController, PlayerXpPublicController } from './player-xp.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PlayerXpController, PlayerXpPublicController],
  providers: [PlayerXpService],
  exports: [PlayerXpService],
})
export class PlayerXpModule {}
